# Scheduler0 Node.js Client

A Node.js/TypeScript client library for interacting with the [Scheduler0 API](https://scheduler0.com). This client provides a convenient way to manage accounts, credentials, executions, executors, projects, jobs, features, create jobs from AI prompts, and monitor the health of your Scheduler0 cluster.

## Features

- **Account Management** *(Self-hosted only)*
  - Create accounts
  - Get account details
  - Rename/update accounts
  - Add/remove features from accounts
  - Get/increase the monthly execution count
  - Get/increase the monthly AI classify-request and prompt-request quotas
  - Get/add platform tokens
  - Configure per-account AI provider settings (BYOK)
  - *Note: These APIs are for users running Scheduler0 in their own infrastructure who need granular control over team access and resource usage.*

- **Feature Management** *(Self-hosted only)*
  - List available features
  - Add/remove all features for an account
  - *Note: These APIs are for users running Scheduler0 in their own infrastructure who need granular control over team access and resource usage.*

- **Credentials Management**
  - List credentials with pagination and ordering
  - Create new credentials
  - Get credential details
  - Update credentials
  - Delete credentials
  - Archive credentials
  - Rotate the server secret key

- **Executions Management**
  - List job executions with date filtering
  - Filter by project ID and job ID
  - View execution details and logs
  - Date-range analytics and lifetime totals
  - Clean up old execution logs

- **Executors Management**
  - List executors with pagination and ordering
  - Create new executors (webhook, cloud function)
  - Get executor details
  - Update executors
  - Delete executors
  - Test-invoke an executor with a synthetic job

- **Local Executors Management**
  - Register local executors
  - Pull assigned jobs for a local executor
  - Report local execution results in batches

- **Backup & Restore** *(Self-hosted only)*
  - Start an online database backup
  - Restore from a backup file

- **Projects Management**
  - List projects with pagination
  - Create new projects
  - Get project details
  - Update projects
  - Delete projects

- **Jobs Management**
  - List jobs with pagination and ordering
  - Create new jobs with comprehensive scheduling options
  - Batch create multiple jobs in a single request
  - Get job details
  - Update jobs
  - Delete jobs

- **AI-Powered Job Creation**
  - Create job configurations from natural language prompts
  - AI generates cron expressions, scheduling, and job metadata
  - Supports purposes, events, recipients, and channels
  - Schedule jobs directly from a prompt in one call (`scheduleFromPrompt`)
  - Classify a prompt's intent without invoking a model (`classifyPrompt`)
  - Analyze conversations for suggestions and recommend send times (`analyzeSuggestions` / `sendTimeSuggestions`)
  - Retrieve the account's AI prompt-request log (`listPromptRequests`)

- **Async Tasks Management** *(Self-hosted only)*
  - Get async task status by request ID
  - *Note: These APIs are for users running Scheduler0 in their own infrastructure who need granular control over team access and resource usage.*

- **Health Monitoring**
  - Check cluster health
  - View raft statistics
  - Monitor leader status

## Installation

```bash
npm install @scheduler0/scheduler0-node-client
```

## API Documentation

- **OpenAPI Specification**: [openapi.json](https://api-reference.scheduler0.com) - Complete API specification

## Authentication

The Scheduler0 Node.js client supports multiple authentication methods:

### 1. API Key + Secret Authentication (Default)
Most endpoints require API Key and Secret authentication with an Account ID. These credentials are created through the credentials API:

```typescript
import { Client } from '@scheduler0/scheduler0-node-client';

const client = Client.newAPIClientWithAccount(
  'http://localhost:7070',  // Base URL
  'v1',                     // API Version
  'your-api-key',           // API Key
  'your-api-secret',        // API Secret
  '123'                     // Account ID
);
```

If you do not have a default Account ID (for example, when you supply the account per request via a parameter override), use `newAPIClient`, which omits the Account ID:

```typescript
const client = Client.newAPIClient(
  'http://localhost:7070',  // Base URL
  'v1',                     // API Version
  'your-api-key',           // API Key
  'your-api-secret'         // API Secret
);
```

### 2. Basic Authentication (Self-hosted Infrastructure)
For users running Scheduler0 on their own infrastructure, you can authenticate using a username and password that was set during infrastructure setup. This is typically used for administrative operations and peer-to-peer communication:

```typescript
const client = Client.newBasicAuthClient(
  'http://localhost:7070',  // Base URL
  'v1',                     // API Version
  'username',               // Username (set during infrastructure setup)
  'password'                // Password (set during infrastructure setup)
);
```

**Note**: Basic authentication is primarily for self-hosted deployments where you have configured username/password credentials during your infrastructure setup.

### 3. Options Pattern
For more flexibility, use the options pattern:

```typescript
const client = new Client(
  'http://localhost:7070',  // Base URL
  'v1',                     // API Version
  {
    apiKey: 'api-key',
    apiSecret: 'api-secret',
    accountId: '123'
  }
);
```

Or for basic authentication:

```typescript
const client = new Client(
  'http://localhost:7070',  // Base URL
  'v1',                     // API Version
  {
    username: 'username',   // Set during infrastructure setup
    password: 'password'     // Set during infrastructure setup
  }
);
```

## Usage

### Managing Accounts

```typescript
// Create a new account
const account = await client.createAccount({
  name: 'My Account'
});

// Get account details
const accountDetails = await client.getAccount('account-id');

// Add feature to account
await client.addFeatureToAccount('account-id', {
  featureId: 1
});

// Remove feature from account
await client.removeFeatureFromAccount('account-id', {
  featureId: 1
});

// Rename an account
await client.updateAccount('account-id', { name: 'New Name' });

// Get / increase the account's monthly execution count
const count = await client.getAccountExecutionCount('account-id');
const increased = await client.increaseAccountExecutionCount('account-id', 10000);

// Get the account's log-derived AI usage for the current period
// (prompt + classify limits/used/remaining, and estimated cost in USD)
const usage = await client.getAIUsage('account-id');

// Get / add platform tokens
const tokens = await client.getAccountTokens('account-id');
const added = await client.addAccountTokens('account-id', 1000);
```

> **Note:** Account, token, and execution-count endpoints are account/cluster-level operations. They require a credential carrying the **`admin`** scope, or Basic Authentication (operator bootstrap).

### AI Provider Settings (Bring Your Own Key)

Configure an ordered list of active models (primary + fallbacks) per account. When `createJobFromPrompt` is called, the primary model is tried first; if it fails the next fallback is tried. Supported providers: `openai`, `anthropic`, `bedrock`, `openrouter`. Credential fields are encrypted at rest and never returned in plaintext.

Use `getAIModels()` to fetch the per-provider approved model catalog from the server before configuring settings.

```typescript
// Fetch the approved model catalog
const catalog = await client.getAIModels();
// catalog.data = { openai: [{id, display_name, default}, ...], anthropic: [...], ... }

// Read current settings (keys are redacted)
const settings = await client.getAccountAISettings();

// Save settings with primary + fallback
await client.upsertAccountAISettings({
  active_models: [
    { provider: 'openai', model: 'gpt-4.1-mini' },     // primary
    { provider: 'anthropic', model: 'claude-sonnet-4-5' } // fallback
  ],
  openai_api_key: 'sk-...',
  anthropic_api_key: 'sk-ant-...'
});
```

### AI Prompt Request Log

Retrieve the account's AI prompt-request history with optional filters and pagination.

```typescript
const log = await client.listPromptRequests({
  provider: 'openai',
  status: 'success',
  search: 'reminder',
  limit: 25,
  offset: 0,
});
// log.data = { requests: PromptRequest[], total, limit, offset }
for (const req of log.data.requests) {
  console.log(req.model, req.total_tokens, req.estimated_cost_usd, req.status);
}
```

### Managing Features

```typescript
// List all available features
const features = await client.listFeatures();

// Add or remove every feature for an account (self-hosting)
await client.addAllFeaturesToAccount('account-id');
await client.removeAllFeaturesFromAccount('account-id');
```

### Managing Credentials

```typescript
// List credentials with pagination and ordering
const credentials = await client.listCredentials({
  limit: 10,
  offset: 0,
  orderBy: 'date_created',
  orderByDirection: 'desc'
});

// Create a new credential. `scopes` is required (a non-empty subset of
// read/write/execute/admin). Optionally pass `expiresInSeconds` for a shorter TTL
// (the server clamps it). Granting 'admin' requires an operator or an existing
// admin credential.
const credential = await client.createCredential({
  createdBy: 'user-id',
  scopes: ['read', 'write', 'execute'],
  expiresInSeconds: 8 * 60 * 60, // optional (8 hours)
});

// Get a specific credential
const credentialDetails = await client.getCredential('credential-id');

// Update a credential
const updatedCredential = await client.updateCredential('credential-id', {
  modifiedBy: 'user-id'
});

// Delete a credential
await client.deleteCredential('credential-id', {
  deletedBy: 'user-id'
});

// Archive a credential
await client.archiveCredential('credential-id', {
  archivedBy: 'user-id'
});

// Re-encrypt stored secrets (credential secrets + executor cloud keys + AI provider
// keys) with a new server secret key (self-hosting). Update the server's SecretKey and
// reload it first, then call this with the previous key.
const rotated = await client.rotateSecret('<old-hex-secret-key>');
// rotated.data.credentialsRotated, rotated.data.executorsRotated, rotated.data.aiSettingsRotated
```

### Managing Executions

```typescript
// List executions with date filtering
const executions = await client.listExecutions({
  startDate: '2024-01-01T00:00:00Z',  // Required: Start date (RFC3339 format)
  endDate: '2024-12-31T23:59:59Z',    // Required: End date (RFC3339 format)
  projectId: 0,                        // Optional: Project ID (0 for all)
  jobId: 0,                            // Optional: Job ID (0 for all)
  limit: 10,                            // Required: Maximum number of items
  offset: 0                             // Required: Number of items to skip
});

// Execution counts grouped into per-minute buckets for a time window
const analytics = await client.getDateRangeAnalytics({
  startDate: '2024-01-01', // YYYY-MM-DD
  startTime: '00:00:00'    // HH:MM:SS or HH:MM
});

// Lifetime totals (scheduled / success / failed) for the account
const totals = await client.getExecutionTotals(123);

// Delete execution logs older than a retention window (self-hosting; peer auth)
const cleanup = await client.cleanupOldExecutionLogs('123', 6); // retentionMonths
```

### Backup and Restore

Database backup/restore for self-hosted clusters (requires an `admin`-scoped credential, or Basic Authentication).

```typescript
// Start an online backup
const backup = await client.backupDatabase();

// Restore from a backup file (S3 object key when S3 is configured, else local path)
const restore = await client.restoreDatabase('backup-2024-01-01.db');
```

### Managing Executors

```typescript
// List executors with pagination and ordering
const executors = await client.listExecutors({
  limit: 10,
  offset: 0,
  orderBy: 'date_created',
  orderByDirection: 'desc'
});

// Create a webhook executor
const executor = await client.createExecutor({
  name: 'webhook-executor',
  type: 'webhook_url',
  webhookUrl: 'https://example.com/webhook',
  webhookMethod: 'POST',
  webhookSecret: 'secret-key',
  createdBy: 'user-id'
});

// Create a cloud function executor
const cloudExecutor = await client.createExecutor({
  name: 'cloud-function-executor',
  type: 'cloud_function',
  region: 'us-west-1',
  cloudProvider: 'aws',
  cloudResourceUrl: 'https://example.com/function',
  cloudApiKey: 'api-key',
  cloudApiSecret: 'api-secret',
  createdBy: 'user-id'
});

// Get a specific executor
const executorDetails = await client.getExecutor('executor-id');

// Update an executor
const updatedExecutor = await client.updateExecutor('executor-id', {
  name: 'updated-executor',
  modifiedBy: 'user-id'
});

// Delete an executor
await client.deleteExecutor('executor-id', {
  deletedBy: 'user-id'
});

// Test-invoke an executor with a synthetic job — fires immediately (no waiting
// for the cron spec/start date) and has no side effects (nothing is persisted
// or rescheduled). The body is optional; omit it to use a default synthetic job.
const testResult = await client.testInvokeExecutor('executor-id', {
  job: { spec: '0 2 * * *', data: JSON.stringify({ action: 'process_data' }), timezone: 'UTC', retryMax: 2 },
  age: '24h',                        // how old the synthetic entry should appear
  executionTime: '2024-01-15T02:00:00Z', // optional; defaults to now
});
// HTTP 200 even when the target fails; check testResult.data.success.
console.log('invocation succeeded:', testResult.data.success);
```

### Managing Local Executors

Local executors run jobs as shell commands on a machine you control. Register one, then the `scheduler0-cli` process pulls assigned jobs and reports results back.

```typescript
// Register a local executor (the server sets the type to "local")
const reg = await client.registerLocalExecutor({
  name: 'My Local Executor',
  command: '/usr/local/bin/process-job.sh',
  workingDir: '/home/deploy/app',
  createdBy: 'user-1'
});
const executorId = reg.data.id;

// Pull the active jobs assigned to a local executor (also renews its lease)
const { data: jobs } = await client.pullLocalExecutorJobs(executorId);

// Report a batch of execution results (state: 0=scheduled, 1=success, 2=failed)
const result = await client.reportLocalExecutions(executorId, [
  {
    jobId: 1,
    uniqueId: 'exec-1',
    state: 1,
    lastExecutionTime: '2025-01-01T00:00:00Z',
    nextExecutionTime: '2025-01-02T00:00:00Z'
  }
]);
console.log(`${result.data.committed} executions committed`);
```

### Managing Projects

```typescript
// List projects with pagination and ordering
const projects = await client.listProjects({
  limit: 10,
  offset: 0,
  orderBy: 'date_created',
  orderByDirection: 'desc'
});

// Create a new project
const project = await client.createProject({
  name: 'My Project',
  description: 'Project description',
  createdBy: 'user-id'
});

// Get a specific project
const projectDetails = await client.getProject('project-id');

// Update a project
const updatedProject = await client.updateProject('project-id', {
  description: 'Updated description',
  modifiedBy: 'user-id'
});

// Delete a project
await client.deleteProject('project-id', {
  deletedBy: 'user-id'
});
```

### Managing Jobs

```typescript
// List jobs with pagination and ordering
const jobs = await client.listJobs({
  projectId: '',              // Optional: Project ID to filter by (empty string for all)
  limit: 10,
  offset: 0,
  orderBy: 'date_created',
  orderByDirection: 'desc'
});

// Create a single job
const job = await client.createJob({
  projectId: 123,              // Required
  timezone: 'UTC',              // Required
  executorId: 456,              // Optional
  data: 'job payload data',     // Optional
  spec: '0 30 * * * *',          // Optional
  startDate: '2024-01-01T00:00:00Z', // Optional
  endDate: '2024-12-31T23:59:59Z',   // Optional
  timezoneOffset: 0,           // Optional
  retryMax: 3,                  // Optional
  status: 'active',             // Optional
  createdBy: 'user-id'          // Required
});

// Create multiple jobs in a single batch request
const batchResult = await client.batchCreateJobs([
  {
    projectId: 123,
    timezone: 'UTC',
    data: 'job 1 payload',
    spec: '0 30 * * * *',
    startDate: '2024-01-01T00:00:00Z',
    retryMax: 3,
    createdBy: 'user-id'
  },
  {
    projectId: 123,
    timezone: 'UTC',
    data: 'job 2 payload',
    spec: '0 0 * * * *',
    startDate: '2024-01-01T00:00:00Z',
    retryMax: 5,
    createdBy: 'user-id'
  }
]);

// Get a specific job
const jobDetails = await client.getJob('job-id');

// Update a job
const updatedJob = await client.updateJob('job-id', {
  data: 'updated payload',
  spec: '0 0 * * * *',
  status: 'inactive',
  modifiedBy: 'user-id'
});

// Delete a job
await client.deleteJob('job-id', {
  deletedBy: 'user-id'
});
```

### AI-Powered Job Creation

Create job configurations from natural language prompts using AI:

```typescript
// Create job configurations from a natural language prompt
const promptRequest = {
  prompt: 'Send weekly reports every Monday at 9 AM',
  purposes: ['reporting', 'communication'],
  events: ['weekly_cycle'],
  recipients: ['team@example.com', 'manager@example.com'],
  channels: ['email'],
  timezone: 'America/New_York' // Optional IANA timezone; defaults to "UTC" when omitted.
};

// Generate job configurations from the prompt.
// Returns a PromptResult: { providers: PromptProviderResult[], classification?: IntentClassification }
const promptResult = await client.createJobFromPrompt(promptRequest);

// Inspect the intent classification
if (promptResult.classification) {
  console.log('Decision:', promptResult.classification.decision); // 'allow' | 'clarify' | 'reject'
  console.log('Reason:', promptResult.classification.reason);
}

// Process each provider's job configurations
for (const provider of promptResult.providers) {
  console.log(`Provider: ${provider.provider} / ${provider.model}`);
  console.log(`Tokens used: ${provider.totalTokens}`);
  for (const config of provider.jobs) {
    console.log(`Kind: ${config.kind}`);
    console.log(`Cron Expression: ${config.cronExpression}`);
    if (config.nextRunAt) {
      console.log(`Next Run At: ${config.nextRunAt}`);
    }
    
    // Use the generated configuration to create actual jobs
    const job = await client.createJob({
      projectId: 123,
      timezone: config.timezone || 'UTC',
      spec: config.cronExpression || '',
      createdBy: 'ai-prompt',
      ...(config.startDate && { startDate: config.startDate }),
      ...(config.endDate && { endDate: config.endDate }),
      ...(config.subject && {
        data: JSON.stringify({
          subject: config.subject,
          recipients: config.recipients
        })
      })
    });
    
    console.log(`Job created with request ID: ${job.data}`);
  }
}
```

### Classifying a Prompt (without AI execution)

Run only the intent classifier against a prompt — no model is invoked and no credits are consumed:

```typescript
const classification = await client.classifyPrompt({ prompt: 'What is Kubernetes?' });

console.log('Decision:', classification.decision); // 'reject'
console.log('Reason:', classification.reason);     // 'informational_question_not_schedule_request'
```

### Analyzing a Conversation for Suggestions

Analyze an ordered set of conversation messages to detect commitments, requests, deadlines, and follow-ups. The analysis is deterministic and **English only** (a non-`en*` locale returns `UNSUPPORTED_LOCALE`):

```typescript
const result = await client.analyzeSuggestions({
  conversation_id: 'conv_123',
  messages: [
    { speaker: 'Victor', timestamp: '2026-07-17T10:00:00-04:00', message: "I'll send the proposal tomorrow." },
  ],
  options: { locale: 'en', default_timezone: 'America/Toronto' },
});

for (const suggestion of result.suggestions) {
  console.log(suggestion.type, suggestion.reason);
}
```

### Recommending Send Times

Recommend suitable future send times for a message given sender/recipient time zones, working hours, quiet hours, weekends, priority, and coverage rules. The engine is deterministic and does not send the message or create a job:

```typescript
const result = await client.sendTimeSuggestions({
  sender: { id: 'user_123', timezone: 'America/Toronto' },
  recipients: [
    { id: 'user_456', timezone: 'America/Los_Angeles', role: 'primary' },
  ],
  message: { priority: 'normal' },
});

for (const suggestion of result.suggestions) {
  console.log(suggestion.send_at, suggestion.score, suggestion.label);
}
```

### Scheduling from a Prompt

Turn a natural-language prompt into actually-scheduled jobs in one call. The server runs the prompt pipeline (intent guardrail + generation), resolves or creates a project, picks the executor whose `description`/`tags` best match the prompt (or uses a pinned `executorId` / the account's only executor), and creates the jobs synchronously:

```typescript
const result = await client.scheduleFromPrompt({
  prompt: 'Remind the sales team every Monday at 9am to review the pipeline',
  channels: ['email'],
  createdBy: 'victor',
  // Optional: pin a project or executor, otherwise they are resolved/created for you.
  // project: { name: 'Sales reminders' },
  // executorId: 3,
});

console.log(
  `project ${result.project.id} (created=${result.projectCreated}), ` +
  `executor ${result.executor.id} matched by ${result.executorMatchedBy}, ` +
  `${result.jobs.length} jobs created`
);
```

Executor selection uses each executor's `description` and `tags` (set them on `createExecutor` / `updateExecutor`). When the account has more than one executor and no `executorId` is pinned, the model picks the best match; if it cannot confidently match, the call throws with a `409` error (pin an `executorId` or refine descriptions/tags). A prompt rejected by the intent guardrail throws a `422` error.

**Note**: The AI prompt endpoint requires:
- Valid API credentials (API Key + Secret)
- Account ID header
- Sufficient credits (1 credit per prompt execution)

The `timezone` field is optional. When omitted, the AI assumes `UTC`. When set to an IANA name (e.g. `'America/New_York'`), the AI interprets relative phrases like *"9am tomorrow"* in that timezone and emits `nextRunAt` / `startDate` / `endDate` with the matching numeric offset. Invalid timezone strings are rejected by the API with `400 Bad Request`. In a browser, you can pass `Intl.DateTimeFormat().resolvedOptions().timeZone` to schedule in the user's local time.

### Managing Async Tasks

```typescript
// Get async task status
const task = await client.getAsyncTask('request-id');
```

### Health Monitoring

```typescript
// Check cluster health (no authentication required)
const health = await client.healthcheck();
console.log(`Leader: ${health.data.leaderAddress}`);
console.log(`Raft State: ${health.data.raftStats.state}`);
```

## Data Types

### Job Status
- `"active"` - Job is active and will be executed
- `"inactive"` - Job is inactive and will not be executed

### Executor Types
- `"webhook_url"` - HTTP webhook executor
- `"cloud_function"` - Cloud function executor
- `"local"` - Local (pull-based) executor; runs jobs on a machine you control (set by the server when registering via `registerLocalExecutor`)

### Webhook Methods
- `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`

### Job Creation Behavior
- **Single Job Creation**: `createJob()` internally uses batch creation with a single job
- **Batch Job Creation**: `batchCreateJobs()` allows creating multiple jobs in one API call
- **Backend API**: The `/api/v1/jobs` POST endpoint expects an array of jobs for batch processing
- **Response Format**: Job creation returns `BatchJobResponse` with HTTP 202 Accepted status and a `Data` field containing the request ID (string) for async task tracking
- **Async Tracking**: Use the request ID with `getAsyncTask()` to track job creation status

## Error Handling

The client throws errors for API errors. Check the error message for details:

```typescript
try {
  const result = await client.createJob(job);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('API error: 400')) {
      // Handle bad request
    } else if (error.message.includes('API error: 401')) {
      // Handle unauthorized
    } else if (error.message.includes('API error: 403')) {
      // Handle forbidden
    } else if (error.message.includes('API error: 404')) {
      // Handle not found
    }
    console.error(error.message);
  }
}
```

## Account ID Requirements

Most endpoints require the `X-Account-ID` header. The following endpoints require account ID:
- `/api/v1/jobs/*`
- `/api/v1/projects/*`
- `/api/v1/credentials/*`
- `/api/v1/executors/*`
- `/api/v1/async-tasks/*`
- `/api/v1/executions`
- `/api/v1/local-executors/*`
- `/api/v1/ai/prompt` (AI prompt endpoint)
- `/api/v1/ai/prompt/classify` (prompt intent classifier)
- `/api/v1/ai/schedule` (prompt-to-scheduled-jobs endpoint)
- `/api/v1/ai/suggestions/analyze` (conversation suggestions)
- `/api/v1/ai/suggestions/time` (send-time suggestions)
- `/api/v1/ai/settings` (per-account AI provider settings)
- `/api/v1/ai/prompt-requests` (AI prompt-request log)

Account endpoints (`/api/v1/accounts/*`) and features (`/api/v1/features`) do not require account ID.

### Per-Request Account ID Override

You can override the Account ID set during client initialization on a per-request basis:

```typescript
// Override Account ID for a specific request
const projects = await client.listProjects({
  accountId: 456,  // Overrides the client's default Account ID
  limit: 10,
  offset: 0
});

// Or pass as a parameter for other methods
const credential = await client.createCredential(
  { createdBy: 'user-id' },
  '456'  // Account ID override
);
```

## Credits and AI Features

The AI prompt endpoint (`/api/v1/ai/prompt`) requires:
- **Credits**: 1 credit per prompt execution
- **Authentication**: Valid API Key + Secret credentials
- **Account ID**: Required header for credit deduction

Credits are automatically deducted when the prompt is successfully processed. If the prompt processing fails after credit deduction, credits are not refunded.

## TypeScript Support

This library is written in TypeScript and includes full type definitions. All types are exported from the main module:

```typescript
import { Client, Job, Project, Executor } from '@scheduler0/scheduler0-node-client';
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (for TypeScript projects)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build
```

