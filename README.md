# Scheduler0 Node.js Client

Node.js/TypeScript client for the [Scheduler0](https://scheduler0.com) HTTP API. It covers every public `/api/v1` route: projects, jobs, executors, local executors, credentials, executions, async tasks, features, the AI endpoints, and the self-hosting account/cluster endpoints.

- Documentation: [docs.scheduler0.com](https://docs.scheduler0.com)
- API reference (OpenAPI): [api-reference.scheduler0.com](https://api-reference.scheduler0.com)

## Installation

```bash
npm install @scheduler0/scheduler0-node-client
```

Requires Node.js >= 18 (the client uses the global `fetch`). Type definitions are bundled.

## Configuration and authentication

The constructor takes the base URL (no trailing path), the API version segment (`'v1'`), and auth options. There is no default base URL; the hosted API is `https://api.scheduler0.com`.

```typescript
import { Client } from '@scheduler0/scheduler0-node-client';

const client = new Client('https://api.scheduler0.com', 'v1', {
  apiKey: process.env.SCHEDULER0_API_KEY!,
  apiSecret: process.env.SCHEDULER0_API_SECRET!,
  accountId: process.env.SCHEDULER0_ACCOUNT_ID!,
});
```

Every request (except `healthcheck`) is sent with three headers: `X-API-Key`, `X-Secret-Key`, and `X-Account-ID`. The server requires all three and returns `401` when the account ID is missing or does not match the credential. Two factory methods are equivalent to the constructor:

```typescript
// Same as the constructor call above.
const withAccount = Client.newAPIClientWithAccount(
  'https://api.scheduler0.com',
  'v1',
  'your-api-key',
  'your-api-secret',
  '123'
);

// No default account ID. Every method that talks to the API accepts an
// account ID (as a trailing `accountIdOverride` argument or an `accountId`
// param) — you must supply it on each call or requests fail with 401.
const withoutAccount = Client.newAPIClient(
  'https://api.scheduler0.com',
  'v1',
  'your-api-key',
  'your-api-secret'
);
const projects = await withoutAccount.listProjects({ accountId: 123, limit: 10, offset: 0 });
```

### Basic auth (self-hosting only)

When you run Scheduler0 yourself, the operator username/password can be used instead of an API credential. The client then sends `Authorization: Basic …` and `X-Peer: cmd`. This is the bootstrap path for creating the first account and credential, and for cluster operations.

```typescript
const operator = Client.newBasicAuthClient('http://127.0.0.1:9091', 'v1', 'admin', 'admin');
```

### Scopes

A credential carries `scopes: ('read' | 'write' | 'execute' | 'admin')[]`. Each request needs one of them; `admin` satisfies everything. A missing scope returns `403 credential missing required scope: <scope>`; an expired credential returns `401`.

| Scope | Grants |
|-------|--------|
| `read` | All `GET`s: jobs, projects, credentials, executors, executions, async tasks, features, `ai/settings`, `ai/models`, `ai/prompt-requests`, `local-executors/{id}/jobs` |
| `write` | `POST`/`PUT`/`DELETE` on jobs, projects, credentials, executors, `ai/settings`; registering local executors |
| `execute` | `ai/prompt`, `ai/prompt/classify`, `ai/schedule`, `ai/suggestions/*`, `executions/cleanup-old-logs`, `executors/{id}/test-invoke`, `local-executors/{id}/executions` |
| `admin` | `accounts/*`, `account/rotate-secret`, `cluster/*` (self-hosting). Only an admin credential or basic auth can grant `admin`. |

## Responses and errors

Every server response is an envelope `{ success: boolean, data: T }`. Most methods resolve with that envelope (for example `PaginatedJobsResponse` is `{ success, data: { total, offset, limit, jobs } }`). `204 No Content` responses resolve with an empty object.

The AI methods `createJobFromPrompt`, `scheduleFromPrompt`, `analyzeSuggestions`, and `sendTimeSuggestions` return `data` directly, and `classifyPrompt` returns `data.classification`.

On any `4xx`/`5xx` the client throws a plain `Error` whose message is `API error: <status> - <server message>`. There is no custom error class, no retry, no timeout, and no rate-limit handling; wrap calls yourself if you need those.

```typescript
try {
  await client.getJob('42');
} catch (err) {
  if (err instanceof Error && err.message.startsWith('API error: 404')) {
    // not found
  } else {
    throw err;
  }
}
```

Statuses you will see: `400` invalid body/params, `401` bad or expired credential / missing account ID, `403` missing scope, `404` not found, `409` (`ai/schedule` could not match an executor or produced no jobs), `422` malformed JSON or a prompt rejected by the intent guardrail, `429` list `limit` above 100 or an exhausted monthly AI quota, `402` platform AI credits exhausted.

## Usage

### Projects

`name` must be unique per account. Only `description` can be updated; the name is immutable. Deleting a project deletes its jobs.

```typescript
const created = await client.createProject({
  name: 'billing',
  description: 'Billing jobs',
  createdBy: 'victor',
});
const projectId = created.data.id;

const page = await client.listProjects({
  limit: 10,
  offset: 0,
  orderBy: 'date_created', // id | name | description | date_created | account_id
  orderByDirection: 'desc',
});
console.log(page.data.total, page.data.projects.length);

await client.getProject(String(projectId));
await client.updateProject(String(projectId), { description: 'Invoices and dunning', modifiedBy: 'victor' });
await client.deleteProject(String(projectId), { deletedBy: 'victor' });
```

### Jobs

`POST /jobs` always takes an array and is asynchronous: it returns `202` with `data` set to a request ID. `createJob` wraps a single job in an array; `batchCreateJobs` sends several. Poll `getAsyncTask(requestId)` to learn the outcome (it blocks server-side until the task finishes). `spec` is a six-field cron expression with a leading seconds field (`sec min hour dom month dow`; `@every 1h`-style descriptors also work). Always write all six fields: a five-field expression is accepted but read as `sec min hour dom month`, so `0 9 * * 1` means minute 9 of every hour in January, not Monday 09:00. An empty `spec` creates a one-time job that fires at `startDate`.

```typescript
const accepted = await client.createJob({
  projectId: 7,
  timezone: 'UTC',
  spec: '0 0 9 * * 1', // every Monday 09:00 (sec min hour dom month dow)
  executorId: 3,
  data: JSON.stringify({ report: 'weekly' }),
  startDate: '2026-01-01T00:00:00Z',
  retryMax: 3,
  status: 'active',
  createdBy: 'victor',
});
const requestId = accepted.data; // string

const task = await client.getAsyncTask(requestId);
// task.data.state: 0 not started | 1 in progress | 2 success | 3 failed
// task.data.output is a JSON string: the created jobs on success, the error on failure

const batch = await client.batchCreateJobs([
  { projectId: 7, timezone: 'UTC', spec: '0 */5 * * * *', createdBy: 'victor' },
  { projectId: 7, timezone: 'UTC', startDate: '2026-02-01T09:00:00Z', createdBy: 'victor' }, // one-time
]);

const jobs = await client.listJobs({
  projectId: 7, // omit to list across all projects
  limit: 10,
  offset: 0,
  orderBy: 'date_created',
  orderByDirection: 'desc',
});
console.log(jobs.data.jobs.map((j) => j.id));

await client.getJob('42');
await client.updateJob('42', { spec: '0 0 10 * * 1', status: 'inactive', modifiedBy: 'victor' }); // modifiedBy required
await client.deleteJob('42', { deletedBy: 'victor' });
```

`orderBy` for jobs accepts `id | project_id | spec | date_created | timezone | account_id | date_modified | modified_by | deleted_by | executor_id | start_date | end_date | retry_max`. `limit` defaults to 10 and values above 100 are rejected with `429`.

### Executors

`type` is `webhook_url`, `cloud_function`, or `local`. Webhook executors require `webhookUrl` and `webhookMethod`; local executors require `command`. The create response is the only place `cloudApiKey`, `cloudApiSecret`, and `webhookSecret` are returned; reads never include them.

```typescript
const webhook = await client.createExecutor({
  name: 'notify',
  description: 'Posts to the internal notifications service', // used by scheduleFromPrompt to match executors
  tags: ['email', 'slack'],
  type: 'webhook_url',
  webhookUrl: 'https://example.com/hooks/scheduler0',
  webhookMethod: 'POST',
  webhookSecret: 'shared-secret',
  payloadAggregation: false,
  createdBy: 'victor',
});

const fn = await client.createExecutor({
  name: 'lambda',
  type: 'cloud_function',
  cloudProvider: 'aws',
  region: 'us-east-1',
  cloudResourceUrl: 'https://lambda.us-east-1.amazonaws.com/2015-03-31/functions/my-fn/invocations',
  cloudApiKey: 'AKIA...',
  cloudApiSecret: '...',
  createdBy: 'victor',
});

const list = await client.listExecutors({ limit: 10, offset: 0, orderBy: 'date_created', orderByDirection: 'desc' });
console.log(list.data.executors ?? []); // the server omits `executors`, `total`, etc. when empty/zero

await client.getExecutor(String(webhook.data.id));
await client.updateExecutor(String(webhook.data.id), { description: 'Updated', modifiedBy: 'victor' });
await client.deleteExecutor(String(fn.data.id), { deletedBy: 'victor' });
```

`testInvokeExecutor` fires a synthetic job through an executor synchronously with no side effects (nothing is created, logged, or rescheduled). The body is optional. The call returns `200` even when the target fails; check `data.success`. Local executors cannot be test-invoked (`400`).

```typescript
const test = await client.testInvokeExecutor('executor-id', {
  job: { spec: '0 0 2 * * *', data: JSON.stringify({ action: 'process' }), timezone: 'UTC' },
  age: '24h', // Go duration; how old the synthetic job should look
  executionTime: '2026-01-15T02:00:00Z', // defaults to now
});
console.log(test.data.success, test.data.durationMs, test.data.error);
```

### Local executors

Local executors run a command on a machine you control. Register one, then pull the jobs assigned to it and report results. This is the protocol the `scheduler0` CLI implements; use these methods only if you are building your own runner.

```typescript
const reg = await client.registerLocalExecutor({
  name: 'build-box',
  command: '/usr/local/bin/run-job.sh',
  workingDir: '/srv/app',
  createdBy: 'victor',
});
const executorId = reg.data.id;

// Active jobs assigned to this executor. Each call also renews the executor's lease.
const assigned = await client.pullLocalExecutorJobs(executorId);
console.log(assigned.data.length);

const report = await client.reportLocalExecutions(executorId, [
  {
    jobId: 42,
    uniqueId: 'run-2026-01-01T09:00:00Z-42',
    state: 1, // 0 scheduled | 1 success | 2 failed
    lastExecutionTime: '2026-01-01T09:00:00Z',
    nextExecutionTime: '2026-01-08T09:00:00Z',
  },
]);
console.log(report.data.committed);
```

### Credentials

`scopes` is required (non-empty, no duplicates). The secret is returned once, as `plaintextSecret` in the create response; store it immediately. `expiresAt` defaults to 90 days and `expiresInSeconds` can only shorten it. To rotate a credential, create a new one and archive the old one.

```typescript
const cred = await client.createCredential({
  createdBy: 'victor',
  scopes: ['read', 'write', 'execute'],
  expiresInSeconds: 30 * 24 * 60 * 60, // optional
});
console.log(cred.data.apiKey, cred.data.plaintextSecret, cred.data.expiresAt);

const creds = await client.listCredentials({
  limit: 10,
  offset: 0,
  orderBy: 'expires_at', // id | date_created | date_modified | created_by | modified_by | deleted_by | expires_at
  orderByDirection: 'asc',
});

await client.getCredential(String(cred.data.id));
await client.archiveCredential(String(cred.data.id), { archivedBy: 'victor' });
await client.deleteCredential(String(cred.data.id), { deletedBy: 'victor' });
```

`updateCredential(id, { archived, modifiedBy })` calls `PUT /credentials/{id}`. Only `archived` and `modifiedBy` can change; `apiKey`, `apiSecret`, `scopes` and `expiresAt` are fixed at creation and the server rejects attempts to change the key or secret with `400`. An omitted `archived` is treated as `false` (un-archive). Servers older than the credential-update fix answer every call with HTTP 200 `{ success: false, data: "api_key or api_secret cannot be empty" }`, so check `success` if you target one.

### Executions

```typescript
const execs = await client.listExecutions({
  limit: 50, // default 50, no maximum
  offset: 0,
  startDate: '2026-01-01T00:00:00Z', // optional, RFC3339
  endDate: '2026-01-31T23:59:59Z', // optional
  projectId: 7, // optional
  jobId: 42, // optional
  state: 'failed', // optional: scheduled | success | failed
  orderBy: 'dateCreated', // dateCreated | lastExecutionDateTime | nextExecutionDateTime
  orderDirection: 'DESC', // note: orderDirection, not orderByDirection
});
for (const e of execs.data.executions) {
  console.log(e.jobId, e.state /* 0 scheduled | 1 success | 2 failed */, e.lastExecutionDatetime);
}

// Per-minute counts for a window starting at the given date/time (UTC).
const analytics = await client.getDateRangeAnalytics({ startDate: '2026-01-01', startTime: '09:00' });
console.log(analytics.data.points);

// Lifetime totals. The argument is the account ID (also sent as X-Account-ID).
const totals = await client.getExecutionTotals(123);
console.log(totals.data.scheduled, totals.data.success, totals.data.failed);

// Delete execution logs older than N months. `accountId` must equal the X-Account-ID. Needs `execute`.
await client.cleanupOldExecutionLogs('123', 6);
```

### Async tasks

```typescript
const task = await client.getAsyncTask('request-id-from-createJob');
if (task.data.state === 2) {
  console.log('created:', task.data.output);
} else if (task.data.state === 3) {
  console.error('failed:', task.data.output);
}
```

### Features

```typescript
const features = await client.listFeatures(); // needs `read`
console.log(features.data.map((f) => f.name));
```

### AI

The AI endpoints need the `execute` scope (reads such as `listPromptRequests`, `getAIModels`, `getAccountAISettings` need `read`; `upsertAccountAISettings` needs `write`). `createJobFromPrompt` and `scheduleFromPrompt` count against the account's monthly prompt quota (`429` when exhausted, `402` when platform credits are exhausted). `classifyPrompt` and `analyzeSuggestions` count against the classify quota. `sendTimeSuggestions` is deterministic and consumes nothing.

#### Generate job definitions from a prompt

```typescript
const result = await client.createJobFromPrompt({
  prompt: 'Send the weekly sales report every Monday at 9am',
  channels: ['email'], // purposes/events/recipients/channels: optional hints, max 5 items each
  timezone: 'America/New_York', // optional IANA zone; defaults to UTC
  locale: 'en', // optional
});

for (const provider of result.providers) {
  for (const job of provider.jobs) {
    console.log(job.kind, job.cronExpression, job.nextRunAt, job.timezone);
  }
}
```

A prompt the intent guardrail rejects throws `API error: 422 - …`; the response body includes the classification.

#### Schedule jobs directly from a prompt

Runs the same pipeline, then resolves or creates a project, picks an executor (pinned `executorId`, the account's only executor, or the best `description`/`tags` match chosen by the model) and creates the jobs synchronously.

```typescript
const scheduled = await client.scheduleFromPrompt({
  prompt: 'Remind the sales team every Monday at 9am to review the pipeline',
  createdBy: 'victor',
  project: { name: 'Sales reminders' }, // or projectId: 7
  // executorId: 3, // pin an executor and skip matching
});
console.log(
  scheduled.project.id,
  scheduled.projectCreated,
  scheduled.executor.id,
  scheduled.executorMatchedBy, // 'pinned' | 'only' | 'llm'
  scheduled.jobs.length
);
```

Throws `409` when there are no executors, no executor could be matched, or the prompt produced no schedulable jobs; `422` when the guardrail rejects the prompt (nothing is created).

#### Classify a prompt

Runs only the intent classifier. English only (`locale` must be `en*`, otherwise `400`); returns `503` when the classifier is not configured.

```typescript
const classification = await client.classifyPrompt({ prompt: 'What is Kubernetes?' });
console.log(classification.decision, classification.reason); // 'allow' | 'clarify' | 'reject'
```

#### Analyze a conversation

Request and response bodies use snake_case. English only.

```typescript
const analysis = await client.analyzeSuggestions({
  conversation_id: 'conv_123',
  messages: [
    { speaker: 'Victor', timestamp: '2026-07-17T10:00:00-04:00', message: "I'll send the proposal tomorrow." },
  ],
  options: { locale: 'en', default_timezone: 'America/Toronto' },
});
console.log(analysis.suggestions.length, analysis.obligations.length);
```

#### Recommend send times

```typescript
const times = await client.sendTimeSuggestions({
  sender: { id: 'u1', timezone: 'America/Toronto' },
  recipients: [{ id: 'u2', timezone: 'America/Los_Angeles', role: 'primary' }],
  message: { priority: 'normal' },
  options: { suggestion_count: 3 },
});
for (const s of times.suggestions) {
  console.log(s.send_at, s.score);
}
```

#### Prompt-request log, model catalog, and provider settings (bring your own key)

```typescript
const log = await client.listPromptRequests({ provider: 'openai', status: 'success', limit: 25, offset: 0, order: 'DESC' });
for (const r of log.data.requests) {
  console.log(r.model, r.total_tokens, r.estimated_cost_usd, r.status);
}

const catalog = await client.getAIModels();
// catalog.data = { openai: [{ id, display_name, default? }], anthropic: [...], ... }

const settings = await client.getAccountAISettings();
// settings.data.active_models, provider keys are masked

await client.upsertAccountAISettings({
  active_models: [
    { provider: 'openai', model: 'gpt-4.1-mini' }, // primary
    { provider: 'anthropic', model: 'claude-sonnet-4-5' }, // fallback
  ],
  openai_api_key: 'sk-...',
  anthropic_api_key: 'sk-ant-...',
});
```

Models must come from `getAIModels()`, and every provider in `active_models` needs a key already stored or supplied in the same request.

### Accounts (self-hosting)

These need the `admin` scope or basic auth. With an API credential, `{id}` must equal the `X-Account-ID`.

```typescript
const account = await operator.createAccount({ name: 'acme' });
const id = String(account.data.id);

await operator.getAccount(id);
await operator.updateAccount(id, { name: 'acme-inc' });

await operator.getAccountExecutionCount(id); // { executionCount, tokens, nextResetDate, ... }
await operator.increaseAccountExecutionCount(id, 1000); // { newExecutionCount }
await operator.getAIUsage(id); // { prompt: { limit, used, remaining }, classify: {...}, estimatedCostUsd, ... }
await operator.getAccountTokens(id); // { tokens }
await operator.addAccountTokens(id, 500); // { newBalance }

await operator.addFeatureToAccount(id, { featureId: 1 });
await operator.removeFeatureFromAccount(id, { featureId: 1 });
await operator.addAllFeaturesToAccount(id);
await operator.removeAllFeaturesFromAccount(id);

// After changing the server's SecretKey and restarting, re-encrypt stored secrets from the old key.
const rotated = await operator.rotateSecret('<previous-hex-secret-key>');
console.log(rotated.data.credentialsRotated, rotated.data.executorsRotated, rotated.data.aiSettingsRotated);
```

### Cluster, backup and restore (self-hosting)

Raft membership and diagnostics. `admin` scope or basic auth.

```typescript
await operator.listClusterNodes();
await operator.addClusterNode(2, '127.0.0.1:7072', 'http://127.0.0.1:9092');
await operator.promoteClusterNode(2);
await operator.demoteClusterNode(2);
await operator.removeClusterNode(2);
await operator.transferClusterLeadership();
await operator.addSelfToCluster();
await operator.removeSelfFromCluster();
await operator.forceRebuildCluster(1); // seed node only
await operator.resetRaft(); // the node exits after responding

await operator.dumpScheduleQueue();
await operator.dumpJobExecutionsCache();
await operator.dumpJobQueues();
await operator.dumpJobQueueVersions();

const backup = await operator.backupDatabase(); // 202 { status, requestId }
const restore = await operator.restoreDatabase('backup-2026-01-01.db'); // 202 { status, requestId }
console.log(backup.data.requestId, restore.data.status);
```

### Health

No authentication required.

```typescript
const health = await client.healthcheck();
console.log(health.data.leaderAddress, health.data.raftStats.state);
```

## Enumerations

| Field | Values |
|-------|--------|
| Credential `scopes[]` | `read`, `write`, `execute`, `admin` |
| Executor `type` | `webhook_url`, `cloud_function`, `local` |
| Executor `webhookMethod` | `GET`, `POST`, `PUT`, `DELETE` |
| Job `status` | `active`, `inactive` |
| Execution `state` | `0` scheduled, `1` success, `2` failed (the `state` query filter uses the words) |
| Async task `state` | `0` not started, `1` in progress, `2` success, `3` failed |
| `ScheduleResult.executorMatchedBy` | `pinned`, `only`, `llm` |
| `IntentClassification.decision` | `allow`, `clarify`, `reject` |
| `PromptJobResponse.kind` | `FOLLOW_UP`, `REMINDER`, `DIGEST` |

## Development

```bash
npm test          # jest
npm run build     # tsc -> dist/
```

## License

MIT. See [LICENSE](LICENSE).
