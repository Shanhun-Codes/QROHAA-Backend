jest.mock('@inquirer/prompts', () => ({
  select: jest.fn(),
  input: jest.fn(),
  confirm: jest.fn(),
}));
import { select, input, confirm } from '@inquirer/prompts';
import {
  promptApproval,
  promptStatus,
  promptGrantAccess,
  promptRevokeAccess,
  promptCreateInvitation,
  promptRevokeInvitation,
  makeApi,
} from '../../scripts/admin';
const choose = select as jest.Mock;
const answer = input as jest.Mock;
const accept = confirm as jest.Mock;
const user = {
  id: 'user-1',
  email: 'portaltester@example.com',
  status: 'PENDING',
  role: 'AGENT',
  entitlements: [] as Array<{ type: string; status: string }>,
};

describe('admin CLI mutations', () => {
  let api: jest.Mock;
  let output: jest.SpyInstance;
  beforeEach(() => {
    jest.resetAllMocks();
    choose.mockResolvedValue(0);
    answer.mockResolvedValue('');
    accept.mockResolvedValue(true);
    api = jest.fn().mockResolvedValue({});
    output = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });
  afterEach(() => jest.restoreAllMocks());
  it('completes approval after selection, blank expiry and confirmation, then reads saved state', async () => {
    api
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce({ status: 'ACTIVE' })
      .mockResolvedValueOnce({ type: 'BETA' })
      .mockResolvedValueOnce([
        {
          ...user,
          status: 'ACTIVE',
          entitlements: [{ type: 'BETA', status: 'ACTIVE' }],
        },
      ]);
    await promptApproval(api, 'local');
    expect(
      (api.mock.calls as [string, RequestInit?][]).map(([path, init]) => [
        path,
        init?.method,
      ]),
    ).toEqual([
      ['/users', undefined],
      ['/users/user-1/status', 'PATCH'],
      ['/users/user-1/access', 'POST'],
      ['/users', undefined],
    ]);
    expect(api).toHaveBeenCalledWith('/users/user-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    expect(api).toHaveBeenCalledWith('/users/user-1/access', {
      method: 'POST',
      body: JSON.stringify({ type: 'BETA' }),
    });
    expect(output).toHaveBeenCalledWith(expect.stringContaining('Verified:'));
  });
  it('clearly cancels without making a mutation', async () => {
    api.mockResolvedValue([user]);
    accept.mockResolvedValue(false);
    await promptApproval(api, 'local');
    expect(api).toHaveBeenCalledTimes(1);
    expect(output).toHaveBeenCalledWith(expect.stringContaining('Cancelled'));
  });
  it('does not report success when an API mutation fails', async () => {
    api
      .mockResolvedValueOnce([user])
      .mockRejectedValueOnce(new Error('Forbidden'));
    await expect(promptApproval(api, 'local')).rejects.toThrow('Forbidden');
    expect(api).toHaveBeenCalledTimes(2);
  });
  it('rejects an unchanged account returned after approval', async () => {
    api
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([user]);
    await expect(promptApproval(api, 'local')).rejects.toThrow(
      'could not be verified',
    );
  });
  it.each(['ACTIVE', 'SUSPENDED'] as const)(
    'saves account status %s',
    async (status) => {
      api.mockResolvedValueOnce([user]);
      await promptStatus(api, 'local', status);
      expect(api).toHaveBeenLastCalledWith('/users/user-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  );
  it.each([0, 1])('grants access to target kind %s', async (target) => {
    choose
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    api.mockResolvedValueOnce(
      target ? [{ id: 'agency-1', name: 'Agency' }] : [user],
    );
    await promptGrantAccess(api, 'local');
    expect(api).toHaveBeenLastCalledWith(
      target ? '/agencies/agency-1/access' : '/users/user-1/access',
      { method: 'POST', body: JSON.stringify({ type: 'PAID' }) },
    );
  });
  it.each([0, 1])('revokes access for target kind %s', async (target) => {
    choose.mockResolvedValueOnce(target).mockResolvedValueOnce(0);
    api.mockResolvedValueOnce([
      {
        ...user,
        name: 'Agency',
        entitlements: [
          { id: 'access-1', type: 'BETA', status: 'ACTIVE', expiresAt: null },
        ],
      },
    ]);
    await promptRevokeAccess(api, 'local');
    expect(api).toHaveBeenLastCalledWith('/access/access-1/revoke', {
      method: 'PATCH',
    });
  });
  it('creates an invitation with the selected role and default expiry', async () => {
    answer.mockResolvedValueOnce('agent@example.com').mockResolvedValueOnce('');
    choose.mockResolvedValue(1);
    api.mockResolvedValue({ token: 'token' });
    await promptCreateInvitation(api, 'local');
    expect(api).toHaveBeenCalledWith('/invitations', {
      method: 'POST',
      body: JSON.stringify({
        email: 'agent@example.com',
        accountType: 'AGENCY',
        expiresInHours: 72,
      }),
    });
  });
  it('revokes an open invitation', async () => {
    api.mockResolvedValueOnce([
      {
        id: 'invite-1',
        email: user.email,
        expiresAt: '2099-01-01',
        revokedAt: null,
        redeemedAt: null,
      },
    ]);
    await promptRevokeInvitation(api, 'local');
    expect(api).toHaveBeenLastCalledWith('/invitations/invite-1/revoke', {
      method: 'PATCH',
    });
  });
  it('requires both production confirmations before mutation', async () => {
    api.mockResolvedValueOnce([user]);
    accept.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await promptStatus(api, 'production', 'ACTIVE');
    expect(api).toHaveBeenCalledTimes(1);
    expect(accept).toHaveBeenCalledTimes(2);
  });
  it('surfaces backend validation messages', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: ['status must be valid'] }), {
        status: 400,
      }),
    );
    await expect(
      makeApi('http://localhost:3000', 'test-token')('/users'),
    ).rejects.toThrow('status must be valid');
  });
});
