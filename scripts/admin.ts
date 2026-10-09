import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { checkbox, select } from '@inquirer/prompts';

const execFileAsync = promisify(execFile);
const callbackUri = process.env.COGNITO_CLI_REDIRECT_URI;
const hostedUiDomain =
  process.env.COGNITO_HOSTED_UI_DOMAIN ?? 'https://auth.open-house.studio';
const environments = {
  local: {
    apiUrl: process.env.ADMIN_API_LOCAL ?? 'http://localhost:3000',
    clientId:
      process.env.COGNITO_CLIENT_ID_LOCAL ?? '27aqgqq5fiqak5bubmql7nifdu',
  },
  qa: {
    apiUrl: process.env.ADMIN_API_QA ?? 'https://api-qa.open-house.studio',
    clientId: process.env.COGNITO_CLIENT_ID_QA ?? '5lqcfc938nqjp20ogp05splr9l',
  },
  production: {
    apiUrl: process.env.ADMIN_API_PRODUCTION,
    clientId: process.env.COGNITO_CLIENT_ID_PRODUCTION,
  },
} as const;

type EnvironmentName = keyof typeof environments;
type AdminApi = (path: string, init?: RequestInit) => Promise<any>;

function requiredCallback(): URL {
  if (!callbackUri) {
    throw new Error(
      'Set COGNITO_CLI_REDIRECT_URI to an HTTP localhost callback registered on each Cognito app client.',
    );
  }
  const uri = new URL(callbackUri);
  if (
    uri.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(uri.hostname) ||
    !uri.port ||
    Number(uri.port) < 1024
  ) {
    throw new Error(
      'COGNITO_CLI_REDIRECT_URI must use HTTP, an explicit port >= 1024, and localhost or 127.0.0.1.',
    );
  }
  return uri;
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const command =
    platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  await execFileAsync(command, args);
}

async function authenticate(clientId: string): Promise<string> {
  const redirect = requiredCallback();
  const port = Number(redirect.port || 80);
  const pathname = redirect.pathname;
  const state = randomBytes(24).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  let resolveCode!: (code: string) => void;
  let rejectCode!: (error: Error) => void;
  const code = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const server = createServer((request, response) => {
    const incoming = new URL(request.url ?? '/', redirect.origin);
    if (incoming.pathname !== pathname) {
      response.writeHead(404).end('Not found');
      return;
    }
    if (incoming.searchParams.get('state') !== state) {
      response
        .writeHead(400)
        .end('Authorization state mismatch. You may close this tab.');
      rejectCode(new Error('Cognito authorization state did not match.'));
      return;
    }
    const error = incoming.searchParams.get('error');
    if (error) {
      response
        .writeHead(400)
        .end(
          'Cognito authorization was not completed. You may close this tab.',
        );
      rejectCode(new Error(`Cognito authorization failed: ${error}`));
      return;
    }
    const authorizationCode = incoming.searchParams.get('code');
    if (!authorizationCode) {
      response
        .writeHead(400)
        .end('Authorization code missing. You may close this tab.');
      rejectCode(new Error('Cognito did not return an authorization code.'));
      return;
    }
    response
      .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      .end(
        '<!doctype html><title>Admin CLI</title><p>Sign-in complete. You may close this tab and return to the terminal.</p>',
      );
    resolveCode(authorizationCode);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, redirect.hostname, () => resolve());
  });

  try {
    const authorize = new URL('/oauth2/authorize', hostedUiDomain);
    authorize.search = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirect.toString(),
      scope: 'openid email',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();
    await openBrowser(authorize.toString());
    const authorizationCode = await code;
    const tokenResponse = await fetch(
      new URL('/oauth2/token', hostedUiDomain),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code: authorizationCode,
          redirect_uri: redirect.toString(),
          code_verifier: verifier,
        }),
      },
    );
    if (!tokenResponse.ok) {
      throw new Error(
        `Cognito token exchange failed (${tokenResponse.status}).`,
      );
    }
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token)
      throw new Error('Cognito returned no access token.');
    return tokens.access_token;
  } finally {
    server.close();
  }
}

async function askChoice(title: string, options: string[]): Promise<number> {
  return select({
    message: title,
    choices: options.map((name, value) => ({ name, value })),
  });
}

async function askMultiChoice(
  title: string,
  options: string[],
): Promise<number[]> {
  return checkbox({
    message: title,
    instructions: 'Use arrow keys to move, Space to toggle, Enter to confirm.',
    choices: options.map((name, value) => ({ name, value })),
  });
}

async function confirm(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
): Promise<boolean> {
  return (await rl.question(`${prompt} [y/N] `)).trim().toLowerCase() === 'y';
}

async function confirmMutation(
  rl: ReturnType<typeof createInterface>,
  environment: EnvironmentName,
  summary: string,
): Promise<boolean> {
  stdout.write(`\nTarget: ${environment.toUpperCase()}\n${summary}\n`);
  if (
    environment === 'production' &&
    !(await confirm(rl, 'This will change PRODUCTION. Continue'))
  ) {
    return false;
  }
  return confirm(rl, 'Confirm mutation');
}

function makeApi(baseUrl: string, accessToken: string): AdminApi {
  return async (path, init = {}) => {
    const response = await fetch(new URL(`/platform-admin${path}`, baseUrl), {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    const body = await response.text();
    const result = body ? JSON.parse(body) : null;
    if (!response.ok) {
      const detail =
        typeof result?.message === 'string'
          ? result.message
          : `HTTP ${response.status}`;
      throw new Error(detail);
    }
    return result;
  };
}

async function promptCreateInvitation(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
  environment: EnvironmentName,
) {
  const email = (await rl.question('Invited email: ')).trim();
  const accountTypeIndex = await askChoice('Account type', [
    'Agent',
    'Agency administrator',
  ]);
  const expiresInput = (
    await rl.question('Expires in hours (default 72): ')
  ).trim();
  const expiresInHours = expiresInput ? Number(expiresInput) : 72;
  if (
    !email ||
    !Number.isInteger(expiresInHours) ||
    expiresInHours < 1 ||
    expiresInHours > 720
  ) {
    throw new Error('Enter a valid email and expiry between 1 and 720 hours.');
  }
  const accountType = accountTypeIndex === 0 ? 'AGENT' : 'AGENCY';
  if (
    !(await confirmMutation(
      rl,
      environment,
      `Create ${accountType} invitation for ${email}, expiring in ${expiresInHours} hours.`,
    ))
  )
    return;
  const invitation = await api('/invitations', {
    method: 'POST',
    body: JSON.stringify({ email, accountType, expiresInHours }),
  });
  stdout.write(
    `\nInvitation created. Share this link securely; the token is shown only once:\n${portalInviteUrl(invitation.token, environment)}\n`,
  );
}

function portalInviteUrl(token: string, environment: EnvironmentName): string {
  const defaults = {
    local: 'http://localhost:4200',
    qa: 'https://qa.open-house.studio',
    production: 'https://open-house.studio',
  };
  const base =
    process.env[`ADMIN_PORTAL_URL_${environment.toUpperCase()}`] ??
    defaults[environment];
  return `${base.replace(/\/$/, '')}/setup-agent#invite=${encodeURIComponent(token)}`;
}

async function selectUser(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
) {
  const users = (await api('/users')) as Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    entitlements: Array<{
      type: string;
      status: string;
      expiresAt: string | null;
    }>;
  }>;
  if (!users.length) throw new Error('No users found.');
  const selected = await askChoice(
    'Users',
    users.map(
      (user) => `${user.email} | ${user.role} | ${user.status} | ${user.id}`,
    ),
  );
  return users[selected];
}

async function promptApproval(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
  environment: EnvironmentName,
) {
  const user = await selectUser(rl, api);
  const accessType = await askChoice('Access type', ['BETA', 'PAID']);
  const expiry = (
    await rl.question('Access expiry ISO date (blank = no expiry): ')
  ).trim();
  if (expiry && Number.isNaN(Date.parse(expiry)))
    throw new Error('Enter a valid ISO date.');
  const body = {
    type: accessType === 0 ? 'BETA' : 'PAID',
    ...(expiry && { expiresAt: new Date(expiry).toISOString() }),
  };
  if (
    !(await confirmMutation(
      rl,
      environment,
      `Activate ${user.email} and grant ${body.type} access${expiry ? ` through ${expiry}` : ' with no expiry'}.`,
    ))
  )
    return;
  await api(`/users/${encodeURIComponent(user.id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  await api(`/users/${encodeURIComponent(user.id)}/access`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  stdout.write(`Activated and granted ${body.type} access to ${user.email}.\n`);
}

async function promptStatus(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
  environment: EnvironmentName,
  status: 'ACTIVE' | 'SUSPENDED',
) {
  const user = await selectUser(rl, api);
  if (
    !(await confirmMutation(
      rl,
      environment,
      `Set ${user.email} account status to ${status}.`,
    ))
  )
    return;
  await api(`/users/${encodeURIComponent(user.id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  stdout.write(`${user.email} is now ${status}.\n`);
}

async function promptGrantAccess(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
  environment: EnvironmentName,
) {
  const targetKind = await askChoice('Grant access to', ['User', 'Agency']);
  if (targetKind === 0) {
    const user = await selectUser(rl, api);
    const type =
      (await askChoice('Access type', ['BETA', 'PAID'])) === 0
        ? 'BETA'
        : 'PAID';
    const expiresAt = (
      await rl.question('Access expiry ISO date (blank = no expiry): ')
    ).trim();
    if (expiresAt && Number.isNaN(Date.parse(expiresAt)))
      throw new Error('Enter a valid ISO date.');
    const body = {
      type,
      ...(expiresAt && { expiresAt: new Date(expiresAt).toISOString() }),
    };
    if (
      !(await confirmMutation(
        rl,
        environment,
        `Grant ${type} access to ${user.email}${expiresAt ? ` until ${expiresAt}` : ' without expiry'}.`,
      ))
    )
      return;
    await api(`/users/${encodeURIComponent(user.id)}/access`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    stdout.write(`Granted ${type} access to ${user.email}.\n`);
    return;
  }

  const agencies = (await api('/agencies')) as Array<{
    id: string;
    name: string;
  }>;
  if (!agencies.length) throw new Error('No agencies found.');
  const agencyIndex = await askChoice(
    'Agencies',
    agencies.map((agency) => `${agency.name} | ${agency.id}`),
  );
  const agency = agencies[agencyIndex];
  const type =
    (await askChoice('Access type', ['BETA', 'PAID'])) === 0 ? 'BETA' : 'PAID';
  const expiresAt = (
    await rl.question('Access expiry ISO date (blank = no expiry): ')
  ).trim();
  if (expiresAt && Number.isNaN(Date.parse(expiresAt)))
    throw new Error('Enter a valid ISO date.');
  const body = {
    type,
    ...(expiresAt && { expiresAt: new Date(expiresAt).toISOString() }),
  };
  if (
    !(await confirmMutation(
      rl,
      environment,
      `Grant ${type} access to agency ${agency.name}${expiresAt ? ` until ${expiresAt}` : ' without expiry'}.`,
    ))
  )
    return;
  await api(`/agencies/${encodeURIComponent(agency.id)}/access`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  stdout.write(`Granted ${type} access to agency ${agency.name}.\n`);
}

async function promptRevokeAccess(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
  environment: EnvironmentName,
) {
  const target = await askChoice('Revoke access for', ['User', 'Agency']);
  const entries =
    target === 0
      ? (
          (await api('/users')) as Array<{
            email: string;
            entitlements: Array<{
              id: string;
              type: string;
              status: string;
              expiresAt: string | null;
            }>;
          }>
        ).flatMap((user) =>
          user.entitlements
            .filter((item) => item.status === 'ACTIVE')
            .map((item) => ({ ...item, owner: user.email })),
        )
      : (
          (await api('/agencies')) as Array<{
            name: string;
            entitlements: Array<{
              id: string;
              type: string;
              status: string;
              expiresAt: string | null;
            }>;
          }>
        ).flatMap((agency) =>
          agency.entitlements
            .filter((item) => item.status === 'ACTIVE')
            .map((item) => ({ ...item, owner: `Agency: ${agency.name}` })),
        );
  if (!entries.length)
    throw new Error('No active entitlements found for that target type.');
  const index = await askChoice(
    'Active entitlements',
    entries.map(
      (item) =>
        `${item.owner} | ${item.type} | ${item.expiresAt ?? 'no expiry'} | ${item.id}`,
    ),
  );
  const entitlement = entries[index];
  if (
    !(await confirmMutation(
      rl,
      environment,
      `Revoke ${entitlement.type} access for ${entitlement.owner}.`,
    ))
  )
    return;
  await api(`/access/${encodeURIComponent(entitlement.id)}/revoke`, {
    method: 'PATCH',
  });
  stdout.write(
    `Revoked ${entitlement.type} access for ${entitlement.owner}.\n`,
  );
}

async function listInvitations(api: AdminApi) {
  const invitations = (await api('/invitations')) as Array<
    Record<string, unknown>
  >;
  if (!invitations.length) stdout.write('No invitations found.\n');
  else stdout.write(`${JSON.stringify(invitations, null, 2)}\n`);
}

async function promptRevokeInvitation(
  rl: ReturnType<typeof createInterface>,
  api: AdminApi,
  environment: EnvironmentName,
) {
  const invitations = (await api('/invitations')) as Array<{
    id: string;
    email: string;
    accountType: string;
    expiresAt: string;
    revokedAt: string | null;
    redeemedAt: string | null;
  }>;
  const openInvitations = invitations.filter(
    (invite) =>
      !invite.revokedAt &&
      !invite.redeemedAt &&
      Date.parse(invite.expiresAt) > Date.now(),
  );
  if (!openInvitations.length) throw new Error('No usable invitations found.');
  const index = await askChoice(
    'Usable invitations',
    openInvitations.map(
      (invite) =>
        `${invite.email} | ${invite.accountType} | expires ${invite.expiresAt} | ${invite.id}`,
    ),
  );
  const invite = openInvitations[index];
  if (
    !(await confirmMutation(
      rl,
      environment,
      `Revoke invitation ${invite.id} for ${invite.email}.`,
    ))
  )
    return;
  await api(`/invitations/${encodeURIComponent(invite.id)}/revoke`, {
    method: 'PATCH',
  });
  stdout.write(`Revoked invitation for ${invite.email}.\n`);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  let accessToken: string | undefined;
  try {
    const envIndex = await askChoice('Choose API environment', [
      `Local (${environments.local.apiUrl})`,
      `QA (${environments.qa.apiUrl})`,
      `Production (${environments.production.apiUrl ?? 'ADMIN_API_PRODUCTION required'})`,
    ]);
    const environment = (['local', 'qa', 'production'] as const)[envIndex];
    const config = environments[environment];
    if (!config.apiUrl || !config.clientId) {
      throw new Error(
        'Set ADMIN_API_PRODUCTION and COGNITO_CLIENT_ID_PRODUCTION before selecting Production.',
      );
    }

    accessToken = await authenticate(config.clientId);
    const api = makeApi(config.apiUrl, accessToken);
    stdout.write(
      `Authenticated. Token remains in memory and will be discarded at exit.\n`,
    );

    const actions = [
      'Create invitation',
      'List invitations',
      'Revoke invitation',
      'List users',
      'Approve existing user and grant beta/paid access',
      'Grant beta/paid access',
      'Revoke user access',
      'Suspend account',
      'Reactivate account',
      'List agencies',
      'List audit logs',
      'Change environment',
      'Exit',
    ];

    let activeEnvironment = environment;
    let activeApi = api;
    while (true) {
      const action = await askChoice(
        `Admin actions (${activeEnvironment.toUpperCase()})`,
        actions,
      );
      try {
        switch (action) {
          case 0:
            await promptCreateInvitation(rl, activeApi, activeEnvironment);
            break;
          case 1:
            await listInvitations(activeApi);
            break;
          case 2:
            await promptRevokeInvitation(rl, activeApi, activeEnvironment);
            break;
          case 3:
            stdout.write(
              `${JSON.stringify(await activeApi('/users'), null, 2)}\n`,
            );
            break;
          case 4:
            await promptApproval(rl, activeApi, activeEnvironment);
            break;
          case 5:
            await promptGrantAccess(rl, activeApi, activeEnvironment);
            break;
          case 6:
            await promptRevokeAccess(rl, activeApi, activeEnvironment);
            break;
          case 7:
            await promptStatus(rl, activeApi, activeEnvironment, 'SUSPENDED');
            break;
          case 8:
            await promptStatus(rl, activeApi, activeEnvironment, 'ACTIVE');
            break;
          case 9:
            stdout.write(
              `${JSON.stringify(await activeApi('/agencies'), null, 2)}\n`,
            );
            break;
          case 10:
            stdout.write(
              `${JSON.stringify(await activeApi('/audit'), null, 2)}\n`,
            );
            break;
          case 11: {
            const nextIndex = await askChoice('Choose API environment', [
              `Local (${environments.local.apiUrl})`,
              `QA (${environments.qa.apiUrl})`,
              `Production (${environments.production.apiUrl ?? 'ADMIN_API_PRODUCTION required'})`,
            ]);
            const nextEnvironment = (['local', 'qa', 'production'] as const)[
              nextIndex
            ];
            const nextConfig = environments[nextEnvironment];
            if (!nextConfig.apiUrl || !nextConfig.clientId)
              throw new Error(
                'Configure the selected environment URLs and client ID first.',
              );
            accessToken = await authenticate(nextConfig.clientId);
            activeEnvironment = nextEnvironment;
            activeApi = makeApi(nextConfig.apiUrl, accessToken);
            break;
          }
          case 12:
            return;
        }
      } catch (error) {
        stdout.write(
          `\nOperation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
        );
      }
    }
  } finally {
    accessToken = undefined;
    rl.close();
  }
}

main().catch((error: unknown) => {
  stdout.write(
    `Admin CLI could not start: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
  );
  process.exitCode = 1;
});
