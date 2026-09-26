import { Client } from '../src/client';

/**
 * Live contract checks against staging. No credentials: only the public
 * healthcheck and the unauthenticated error envelope. Authenticated job
 * flows stay in scheduler0-e2e, which provisions a Clerk user.
 *
 * Override the host with SCHEDULER0_E2E_BASE_URL.
 */
const baseURL = process.env.SCHEDULER0_E2E_BASE_URL ?? 'https://api.staging.scheduler0.com';

describe('staging API via the node client', () => {
  const client = new Client(baseURL);

  it('healthcheck returns a leader and raft stats', async () => {
    const res = await client.healthcheck();

    expect(res.success).toBe(true);
    expect(res.data.leaderId).toEqual(expect.any(String));
    expect(res.data.leaderId.length).toBeGreaterThan(0);
    expect(res.data.leaderAddress).toEqual(expect.any(String));
    expect(res.data.raftStats).toEqual(
      expect.objectContaining({
        state: expect.any(String),
        term: expect.any(String),
        commit_index: expect.any(String),
      })
    );
  });

  it('rejects an unauthenticated project list with the 401 envelope', async () => {
    await expect(client.listProjects({ limit: 1, offset: 0 })).rejects.toThrow(
      /API error: 401 - unauthorized request/
    );
  });

  it('rejects an unauthenticated job list with the 401 envelope', async () => {
    await expect(client.listJobs({ limit: 1, offset: 0 })).rejects.toThrow(/API error: 401 -/);
  });
});
