# Beta Auth Implementation Handoff

## 1. Summary

This change adds the backend foundation for invite-only Agent and Agency onboarding, Cognito-backed identity verification, account status, beta/paid entitlements, platform administration, audit records, and reusable authorization guards. The Angular portal now preserves an invitation token across Cognito login and sends the Cognito ID token only on onboarding redemption.

Existing data is preserved. The additive migration sets every existing `User.status` to `PENDING`; it does not create entitlements, activate accounts, or alter Agent, Agency, or Brokerage data. No QA or Production migration or deployment was run. Prisma client generation was not run.

## 2. Files Changed

### Backend schema, migration, and dependency

- `prisma/schema.prisma`: adds `PLATFORM_ADMIN`, `AccountStatus`, invitation/access enums, and `Invitation`, `AccessEntitlement`, and `AuditLog` models and relations.
- `prisma/migrations/20261009170000_secure_invite_onboarding/migration.sql`: additive DDL; existing users receive `PENDING`.
- `package.json`: adds `bootstrap:platform-admins` and `admin` scripts.
- `package.json`, `package-lock.json`: adds `@aws-sdk/client-cognito-identity-provider` for trusted Cognito user verification.
- `scripts/bootstrap-platform-admins.ts`: verifies exactly two configured Cognito identities before promoting them transactionally.
- `scripts/admin.ts`: interactive admin menu using Cognito authorization-code + PKCE and protected admin API calls.
- `src/app.module.ts`: registers `PlatformAdminModule`.

### Backend authentication and onboarding

- `src/auth/cognito-auth.service.ts`: verifies RS256 access and ID tokens; uses Cognito `ListUsers`/`AdminGetUser` for verified identity lookup.
- `src/auth/auth-user.service.ts`: shared account, role, status, entitlement, Agent, and Agency ownership checks; onboarding access-state response.
- `src/auth/auth.module.ts`: registers and exports reusable Agency and Platform Admin guards.
- `src/auth/agency-admin.guard.ts`: authenticated, active, entitled `AGENCY_ADMIN` context for future Agency routes.
- `src/auth/platform-admin.guard.ts`: authenticated, active platform-admin-only context.
- `src/auth/current-cognito-sub.decorator.ts`: provides the authenticated actor subject to administrative services.
- `src/auth/auth-user.service.spec.ts`, `src/auth/cognito-auth.service.spec.ts`: access-control and token identity tests.
- `src/onboarding/dto/redeem-invitation.dto.ts`: request DTO; role and email are not accepted as trusted fields.
- `src/onboarding/onboarding.controller.ts`: keeps `GET /onboarding/me`; secures the existing `POST /onboarding/agent` path with the Cognito ID-token header and invite body.
- `src/onboarding/onboarding.service.ts`: checks invite/email and provisions Agent or Agency plus User in the same transaction as the single-use invite claim.
- `src/onboarding/onboarding.service.spec.ts`: valid, mismatch, expiry, revocation, replay, concurrency, and spoofed-body coverage.
- `src/agents/agents.service.ts`: exposes slug generation to the transactional onboarding service.

### Backend authorization and administration

- `src/agent-app/agent-app.controller.ts`: removes `GET /agent-app/agents` and `POST /agent-app/agents`; lead creation now receives the authenticated Agent ID.
- `src/leads/dto/create-lead.dto.ts`: removes client-supplied `agentId`.
- `src/leads/leads.service.ts`, `src/leads/leads.service.spec.ts`: use server-derived lead ownership, scope generic updates, and reject mixed-owner bulk status updates before writes.
- `src/notes/notes.service.ts`: scope note edits by authenticated Agent and exact subject, closing a supplied-note-ID cross-tenant update path.
- `src/platform-admin/dto/create-invitation.dto.ts`: validated invitation creation fields.
- `src/platform-admin/dto/update-account-status.dto.ts`: activation/suspension input.
- `src/platform-admin/dto/grant-access.dto.ts`: beta/paid access input and date bounds.
- `src/platform-admin/platform-admin.controller.ts`: protected administrative endpoints.
- `src/platform-admin/platform-admin.module.ts`: administrative module wiring.
- `src/platform-admin/platform-admin.service.ts`: invitation/access/status/list operations and audit writes.
- `src/platform-admin/platform-admin.service.spec.ts`: verifies invitation token hashing and one-time response behavior.

### Angular portal

- `Frontend/qrohaa-portal/src/app/auth/auth.guard.ts`: saves `#invite=...` before redirecting to Cognito.
- `Frontend/qrohaa-portal/src/app/auth/auth.model.ts`: onboarding response/access-state shape.
- `Frontend/qrohaa-portal/src/app/auth/auth.service.ts`: caches an Agent only when backend access is granted.
- `Frontend/qrohaa-portal/src/app/onboarding/onboarding.guard.ts`: routes unprovisioned users to invitation setup and provisioned ineligible accounts to access-pending.
- `Frontend/qrohaa-portal/src/app/app.routes.ts`: adds the protected `access-pending` route.
- `Frontend/qrohaa-portal/src/app/pages/access-pending/access-pending.component.ts`: pending/blocked state with an access recheck.
- `Frontend/qrohaa-portal/src/app/pages/setup-agent/setup-agent.component.html`, `setup-agent.component.ts`: requires an invitation and routes successful redemption to pending access.
- `Frontend/qrohaa-portal/src/app/pages/setup-agent/setup-agent.model.ts`: includes the invitation token and omits request email.
- `Frontend/qrohaa-portal/src/app/pages/setup-agent/setup-agent.service.ts`: attaches `X-Cognito-Id-Token` only to `POST /onboarding/agent`.

## 3. Prisma Changes and Migration

Migration: `20261009170000_secure_invite_onboarding`.

- `UserRole`: adds `PLATFORM_ADMIN`; existing `AGENT` and `AGENCY_ADMIN` remain.
- `AccountStatus`: `PENDING`, `ACTIVE`, `SUSPENDED`. Existing users default to `PENDING`.
- `Invitation`: normalized email, unique SHA-256 token hash, intended role/account type, creator subject, expiry, revocation, redemption timestamp and subject. A database check restricts Agent invitations to `AGENT` and Agency invitations to `AGENCY_ADMIN`.
- `AccessEntitlement`: `BETA` or `PAID`, `ACTIVE`/`EXPIRED`/`REVOKED`, start/expiry/revocation timestamps, exactly one User or Agency target, grant actor, and optional Stripe identifiers.
- `AuditLog`: actor subject, action, target, timestamp, and JSON metadata.

The migration includes no destructive operations, data reset, seed, or default entitlement. Foreign keys restrict deletion of records referenced by invitations or entitlements.

## 4. API Endpoints

All `/platform-admin/*` routes use `PlatformAdminGuard`.

- `POST /platform-admin/invitations` with `{ email, accountType: "AGENT" | "AGENCY", expiresInHours? }`. Returns the raw random token once. The database stores only its SHA-256 hash. Role is derived server-side from account type.
- `GET /platform-admin/invitations` lists the latest invitation metadata without returning token hashes.
- `PATCH /platform-admin/invitations/:invitationId/revoke` revokes an unused invitation.
- `GET /platform-admin/users` lists user status, role, linked IDs, and entitlement state.
- `GET /platform-admin/agencies` lists agency and entitlement summaries.
- `PATCH /platform-admin/users/:userId/status` with `{ status: "ACTIVE" | "SUSPENDED" }`.
- `POST /platform-admin/users/:userId/access` with `{ type: "BETA" | "PAID", startsAt?, expiresAt? }`.
- `POST /platform-admin/agencies/:agencyId/access` grants agency-level entitlement.
- `PATCH /platform-admin/access/:entitlementId/revoke` revokes an entitlement.
- `GET /platform-admin/audit` returns the latest 500 audit records and audits the listing operation.

Onboarding:

- `GET /onboarding/me` remains Cognito-authenticated and is intentionally usable before a PostgreSQL User exists. It returns invitation-required state for an unprovisioned Cognito identity, access-pending state without profile data for an ineligible account, or an authorized Agent profile.
- `POST /onboarding/agent` remains the single Agent onboarding endpoint. It requires the normal `Authorization: Bearer <access-token>`, `X-Cognito-Id-Token: <ID-token>`, and `invitationToken` in the body. Agent profile and nested brokerage fields remain grouped as before. The email in the form/request is not trusted or used; the backend takes normalized email only from the verified identity. The stored invite selects the role.

Agent API:

- `GET /agent-app/agents` and `POST /agent-app/agents` are removed.
- `PATCH /agent-app/agents` remains scoped to the authenticated Agent.
- `POST /agent-app/leads` no longer accepts an owner ID; ownership comes from `CurrentAgentId`.
- Other Agent routes remain under `AgentAuthGuard`.

The public QR configuration/landing/feedback routes remain public and unchanged by account guards.

## 5. Roles and Authorization

- `PLATFORM_ADMIN`: must be `ACTIVE`; bypasses subscription entitlement. Only the trusted bootstrap can initially assign this role. No public role assignment or role-change endpoint exists.
- `AGENCY_ADMIN`: must be `ACTIVE`, attached to an Agency, and have an active direct or agency entitlement. `AgencyAdminGuard` and `assertAgencyOwnsAgent` are reusable, but there is not yet an Agency controller or agency-created Agent invitation flow.
- `AGENT`: must be `ACTIVE`, have a live direct or agency entitlement, and be linked to an Agent. `AgentAuthGuard` establishes the Agent ID from the Cognito subject and database relation.
- `PENDING` and `SUSPENDED` accounts cannot access protected application routes. Entitlement expiry is checked against the current time on every protected request, independent of any scheduled job.
- Agency-level access is evaluated from the authenticated User's Agency relation. Future Agency controllers must use the Agency ID established by `AgencyAdminGuard` and call `assertAgencyOwnsAgent` before accessing an Agent's resources.

The old all-Agent list/create routes were removed, lead ownership can no longer be selected by request-body `agentId`, and note/lead writes verify ownership at the data-access boundary.

## 6. Invitation Creation and Redemption

1. A platform admin creates an Agent or Agency invitation. The service uses 32 random bytes encoded base64url, persists only SHA-256, normalizes email, records expiry/creator, and audits creation. Raw tokens are not logged.
2. Admin distributes the returned token manually. For the portal, use a URL fragment such as `https://<portal>/setup-agent#invite=<raw-token>`; no email sender is implemented.
3. The portal preserves the fragment token in `sessionStorage` through Cognito login, sends it in the request body, and sends the current ID token in `X-Cognito-Id-Token`. Normal API requests remain unchanged and continue to send only the access token.
4. Backend verifies ID-token signature (RS256), issuer, expiry, client audience, `token_use=id`, `email_verified=true`, and matching `sub` with the authenticated access token. It then calls Cognito `AdminGetUser` for the signed Cognito username and rechecks enabled state, `sub`, email, and `email_verified`.
5. Verified email is normalized and compared with the invitation email. The request body email, role, account status, Agent ID, Agency ID, and entitlements are not used to grant authority.
6. In one Prisma transaction, a conditional `updateMany` claims the still-valid invite, duplicate User identities are rejected, Agent plus brokerage or Agency is provisioned, User is linked, and redemption audit is written. A losing concurrent request cannot claim or provision. Any transaction failure rolls the claim back.
7. New provisioned Users are `ACTIVE` but have no entitlement. A platform admin must grant beta/paid access before Agent or Agency application access is enabled.

Agency invitations create an Agency and `AGENCY_ADMIN` identity. Agency-admin-created Agent invitations, seat-limit enforcement, and brokerage inheritance are not implemented yet.

## 7. Beta Access

- Platform admin grants BETA or PAID access to one User or one Agency, with a start and optional expiry. The database check requires exactly one target.
- Protected access checks account status and an active entitlement whose start is reached, whose expiry is in the future (or absent), and which is not revoked.
- Expiry is denied immediately from `expiresAt`; admin list requests lazily mark elapsed active records `EXPIRED` for inspection. There is no timer or deletion job.
- Revocation sets `REVOKED` and `revokedAt`; access is denied on the next request.
- Existing QA users receive no entitlements. No Stripe calls or billing logic are present; Stripe identifiers are placeholders for future integration.

## 8. PLATFORM_ADMIN Bootstrap

Set exactly two distinct Cognito `sub` values in `PLATFORM_ADMIN_COGNITO_SUBS`, comma-separated. Also provide database environment variables and Cognito settings. Run only after the migration and Prisma client generation:

```bash
export COGNITO_REGION=us-east-1
export COGNITO_USER_POOL_ID=us-east-1_KeUrBrdKN
export COGNITO_CLIENT_ID=<portal-cognito-client-id>
export PLATFORM_ADMIN_COGNITO_SUBS=<owner-one-sub>,<owner-two-sub>
npm run bootstrap:platform-admins
```

The command rejects missing/duplicate subs, verifies both Cognito users and verified emails via `ListUsers` plus `AdminGetUser` before any write, and fails if a different platform admin already exists. It then upserts both identities as active `PLATFORM_ADMIN` users in one transaction. Re-running with the same identities is idempotent and does not create duplicate users. The script never accepts admin identities from a public endpoint.

## 9. Existing QA Users and Data

The migration assigns `PENDING` to all existing PostgreSQL Users and creates no access entitlements. Their existing Agent, Agency, Brokerage, property, lead, open-house, and feedback data is untouched. After bootstrap, a platform admin manually approves selected QA users:

1. `GET /platform-admin/users` to find the user record.
2. `PATCH /platform-admin/users/:userId/status` with `{ "status": "ACTIVE" }`.
3. `POST /platform-admin/users/:userId/access` with `{ "type": "BETA", "expiresAt": "<ISO-8601>" }` (or omit expiry when intentionally granting no expiry).

Activation alone does not grant access. Expired users retain data; there is no automatic deletion. A configurable retention policy and any data export/deletion workflows remain future work.

For the guided equivalent, run `npm run admin`, choose the environment, and select `Approve existing user and grant beta/paid access`.

## 10. Environment and Cognito/IAM Changes

Backend environment values:

- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID` (required for invitation ID-token audience validation)
- `PLATFORM_ADMIN_COGNITO_SUBS` (exactly two values, only for trusted bootstrap)
- Existing `NODE_ENV`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, and `DATABASE_PASSWORD` remain required by the app.

The portal keeps its existing OIDC scope `openid profile email`; its `angular-auth-oidc-client` ID-token accessor is used only for the redemption request. No Cognito hosted UI configuration change is expected, but confirm the ID token includes `email` and `email_verified` for the configured client.

Do not apply the following IAM change as part of this work. The ECS task role needs the two narrowly scoped Cognito read actions for this user pool (and equivalent local AWS credentials for local bootstrap):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["cognito-idp:AdminGetUser", "cognito-idp:ListUsers"],
      "Resource": "arn:aws:cognito-idp:us-east-1:<account-id>:userpool/us-east-1_KeUrBrdKN"
    }
  ]
}
```

Confirm `ListUsers` resource-level policy support for the account's AWS policy validator before applying. Do not attach broad Cognito permissions or change AWS resources without review.

### Interactive Admin CLI

Run `npm run admin` from the backend directory. Choose Local, QA, or Production, then the CLI opens Cognito Hosted UI and signs in with authorization-code + PKCE. The access token remains only in process memory and is discarded at exit; it is never saved or printed. All reads and mutations go through `/platform-admin/*`, so the server's `PlatformAdminGuard` and audit logging still apply.

Before using the CLI, configure these values:

- `COGNITO_CLI_REDIRECT_URI`, for example `http://localhost:8765/callback`. Register this exact callback URL on every selected Cognito app client. The CLI only binds HTTP loopback addresses on explicit ports above 1023.
- `COGNITO_HOSTED_UI_DOMAIN` if different from the default `https://auth.open-house.studio`.
- `ADMIN_API_LOCAL` and `COGNITO_CLIENT_ID_LOCAL` override Local settings. Defaults point to `http://localhost:3000` and the portal's local client.
- `ADMIN_API_QA` and `COGNITO_CLIENT_ID_QA` override QA settings. Defaults point to the QA API and portal QA client.
- `ADMIN_API_PRODUCTION` and `COGNITO_CLIENT_ID_PRODUCTION` are required to enable Production selection. They are deliberately not defaulted.
- `ADMIN_PORTAL_URL_LOCAL`, `ADMIN_PORTAL_URL_QA`, `ADMIN_PORTAL_URL_PRODUCTION` optionally override the corresponding invite-link base URLs.

The menu includes invitation creation/list/revocation, user listing, approve-and-grant access, individual or agency beta/paid grants, access revocation for users or agencies, suspension/reactivation, agency listing, audit logs, environment switching, and exit. Single-select menus use Up/Down arrows and Enter. The reusable multi-select prompt uses Up/Down to move, Space to toggle choices, and Enter to confirm. Each mutation displays its target and requires confirmation; Production mutations require an additional confirmation. New invitation tokens are shown once as a shareable portal URL. Distribute that URL privately. The CLI does not change Cognito app clients or infrastructure; callback registration is manual configuration.

Example local shell setup and launch:

```bash
export COGNITO_CLI_REDIRECT_URI=http://localhost:8765/callback
npm run admin
```

Configure the Cognito app clients for authorization-code grant with PKCE, no client secret, and the exact callback URI above (or the URI you configured) as an allowed callback. Register it on every app client you plan to select. Cognito callback changes are manual AWS configuration and are not included in this code change.

## 11. Local Validation Commands

After the owner approves Prisma generation, run locally:

```bash
npm run admin
npx prisma validate --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npm run build
npm test -- --runInBand
cd ../../Frontend/qrohaa-portal && npm run build
```

Invitation unit tests use mocks; they do not require Cognito credentials or mutate a database. The bootstrap command contacts Cognito and writes Users, so do not run it against QA/Production as a test. `npm run admin` performs real protected API reads and mutations against the selected environment; it is not a test harness.

## 12. QA Migration and Deployment Steps (Not Executed)

1. Review migration order and confirm QA backup/restore readiness. No database reset, seed, or Production operation is part of this work.
2. Locally apply pending migrations using the configured development database, then generate the Prisma client and run approved validation.
3. Commit/review the schema and migration with the backend changes. The existing QA migration script is `npm run prisma:status:qa`; review pending order before execution.
4. Obtain explicit approval to migrate QA. Then run `npm run prisma:deploy:qa` against QA. Do not run `prisma migrate reset`.
5. Add the scoped ECS task-role permission and required environment variables through the separately approved infrastructure process; neither was changed here.
6. Deploy through the existing approved QA pipeline only after migration and IAM/config readiness. Verify service health, platform-admin bootstrap, invitation redemption, manual QA activation/grant, and public QR feedback.
7. Do not deploy or migrate Production from this handoff. Production rollout needs separate approval and a reviewed backup/rollback plan.

## 13. Validation Results and Known Limitations

- Earlier focused security tests completed successfully: 13 tests across 3 suites passed before the last additions to the test cases and pending-access UI.
- An Angular portal build completed successfully before the final pending-access/request-email refinements; it emitted the existing `qrcode` CommonJS optimization warning.
- A backend `npm run build` was attempted before Prisma generation and failed on stale generated Prisma types: the checked-in client does not yet contain `PLATFORM_ADMIN`, `User.status`, or the new Prisma models/delegates. Do not treat these generated-client errors as confirmation of source correctness; after your approval, generate and rerun build.
- The final full-suite/build/schema-validation commands were started, but their terminal results were not captured. The user asked to avoid further test runs, so no new tests or builds were run afterward. The final note/lead tenant-scope changes are therefore unverified by execution.
- No Prisma migration, Prisma generation, QA/Production database operation, deployment, or AWS/IAM change was performed.
- The manual migration has not yet been validated against a live Postgres instance. Agency seat limits, agency-created Agent invites, agency Agent management endpoints, role-change administration, Stripe integration, and configurable retention policy remain outstanding.

## 14. Remaining Work Before January Beta

- Owner must run Prisma schema validation, migration, and generation locally and resolve any generated-client compile issues.
- Review/fix any failed full-suite tests and run a complete backend build after generation.
- Confirm ID-token email claims and add the scoped ECS IAM permission.
- Bootstrap exactly two platform admins, then manually activate/grant beta access to QA testers.
- Add product UX for expired/suspended accounts and invitation errors; current portal pending screen covers the basic activation wait.
- Build the Mainframe admin UI and Agency app.
- Implement agency-created Agent invitations with seat-limit enforcement and server-side agency association.
- Decide/implement how agency branding and brokerage changes propagate to created Agents.
- Decide policy for removing/reassigning a platform admin and for break-glass recovery.
- Add pagination/rate limits for admin listing endpoints and review audit-log retention/immutability requirements.
- Review the package install audit output (31 reported dependency advisories, 21 moderate, 8 high, 2 critical) separately; no broad audit fix was run.

## 15. Decisions and Assumptions

- Cognito remains the identity provider; User records are provisioned only by invite redemption or the trusted bootstrap.
- Platform admins are exactly the two configured owner identities for initial bootstrap; expansion/recovery requires a separately trusted process.
- Existing QA users are deliberately not grandfathered into active access.
- Email comparison trims whitespace and lowercases; no provider-specific plus-address rewriting is performed.
- Agency access is entitlement-based, but Agency product routes are deferred. Current Agent routes remain Agent-only.
- Invitations are manually distributed; no email delivery integration was added.
- Access-expiry enforcement is synchronous in guards, with lazy database status normalization during admin listings rather than a scheduled worker.
- The frontend uses an invitation token in a URL fragment so it is not sent in HTTP Referer headers; browser storage is cleared after successful redemption or when setup detects an existing Agent.
