# Agency invitations and local seat testing

Agency administrators manage their own agency at `/agency`. Platform administrators can select any agency in that workspace. The Agents page supports invitations, resend (token rotation), revoke, and ordinary-agent deactivation/reactivation. Membership removal and existing-account ownership transfers are deliberately not performed by this flow.

## Local three-seat fixture

From `Backend/qrohaa`:

```sh
npm run agency:test:local -- --seats=3
```

The default owner is `michael.elder@kw.com`; override using `--email=...`. The script matches the local account case-insensitively and verifies its Cognito sub and verified email before any mutation. It requires an existing active platform administrator, preserves their role and existing personal agent profile, attaches `Local Test Agency`, and provisions agency beta access. It does not transfer the owner's existing properties or leads. The platform administrator is not an agent seat unless their Agent profile belongs to the agency.

Rerunning updates the existing fixture's limit without clearing agents or invitations. It refuses to attach over another agency or lower the limit below occupied plus reserved seats. It is restricted to `NODE_ENV=local` and a localhost database. The fixture contains test brokerage details and is not production data.

For an isolated database integration check:

```sh
npm run agency:verify:local
```

This creates a separate temporary three-seat agency. Four concurrent invitations must produce exactly three reservations. Revoking an invitation releases a reservation. Three concurrent acceptances must produce three users linked to three agency-owned agent profiles. A fourth acceptance must fail without consuming its invitation. Branding and brokerage inheritance are checked. The check uses mocked verified Cognito identities and a mocked email sender, sends no email, and removes its temporary records afterward. It does not consume the fixture's seats.

For manual GUI testing, sign in as Michael, select Agency view, and create three invitations to distinct email addresses that do not already have application accounts. The fourth is blocked. Revoke one to free its reservation. Open a shared link in a separate browser profile, register/verify the matching Cognito email, review the agency, and accept. An invited user may already exist in Cognito, provided they do not already have an application User record. Existing application accounts show an explicit transfer-review message; their ownership is unchanged.

## Seat policy

`Agency.seatLimit = null` means unlimited; otherwise the limit counts agency-owned Agent profiles plus pending, unexpired invitations. Agency administrator invitations also create an Agent profile and therefore reserve one agent seat. A platform administrator attached only via User.agencyId does not consume a seat. Suspended agents retain their occupied seat because their profile and records remain owned by the agency. Expired and revoked invitations release reservations.

Invitation creation, revocation, resend, and acceptance lock the agency row for the transaction. Acceptance checks actual occupied capacity again and atomically claims the current token hash before provisioning. Revocation/resend races cannot redeem an obsolete token. Tokens are random, stored only as SHA-256 hashes, and displayed to an authorized admin only when created or rotated. Invites expire after 72 hours; resending rotates the link without extending its original expiry.

## Cognito identity verification

Set `COGNITO_CLIENT_ID` in the backend environment to the app client used by that environment’s portal. For localhost this is `27aqgqq5fiqak5bubmql7nifdu`. This is the audience checked on invitation ID tokens. Restart the backend after changing environment variables. The backend AWS identity also needs Cognito `AdminGetUser` permission to confirm the account’s verified email.

Agency invitees stay on `/join-agency` after hosted signup and see inherited brokerage details as read-only. Verification errors retain the invitation and allow retry or switching accounts. Personal `/setup-agent` redirects back to the agency join page while an agency invitation is pending.

## Email delivery

Configure these backend environment variables:

```dotenv
AGENT_PORTAL_URL=http://localhost:4202
INVITATION_EMAIL_FROM=your-verified-sender@example.com
```

Use the actual portal origin for each environment. The SESv2 sender uses `AWS_REGION` and the server's normal AWS credential provider chain. The sender identity must be verified in SES and the execution role must allow `ses:SendEmail` for that identity. SES sandbox accounts also require verified recipient identities. Do not put AWS credentials in frontend code.

If either setting is absent, the response reports `MANUAL` and the GUI offers a copyable link; it never says email was sent. If SES fails, the response reports `FAILED` and the invitation remains usable through its link. Configure sender/domain and IAM before expecting automated delivery. SES acceptance is reported as sent; downstream delivery/bounce tracking is not implemented.

## Ownership and authentication

The join link uses `/join-agency#invite=...`. The fragment is captured into session storage and removed from the address bar. The invitation survives Cognito sign-in and email verification within that browser session. The authenticated user reviews the agency, invitation email, signed-in email, and role before explicitly accepting. No password is handled by the agency or app backend.

The backend verifies the access token and ID token belong to the same Cognito sub, verifies the email claim, and checks the current Cognito user. Email must match the invite. The transaction creates User.cognitoSub, User.agentId, User.agencyId, and Agent.agencyId together. Client-supplied branding and role cannot override agency ownership or the invitation role.

Agency-owned agent colors, logo, and brokerage are resolved from the agency when profiles/public configuration are read. Their own headshot remains editable. Backend mutations reject agent changes to inherited branding, brokerage, and logo. Agency administrators and platform administrators can edit shared branding and brokerage at `/agency/settings`. The same selected agency is retained between Agents and Agency Settings. Agency logos upload under an agency-owned S3 prefix and must be JPEG, PNG, or WebP images up to 5 MB. Brokerage name and license number are required when adding or editing brokerage information. Agent profiles inherit updated values at read time; reload public pages and regenerate printed materials to see changes. Agent headshots remain independently editable.
