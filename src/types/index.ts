// Backup/Restore Types
export interface BackupRestoreResponse {
  success: boolean;
  data: {
    status: string;
    requestId?: string;
  };
}

export interface RestoreRequest {
  filePath: string; // Backup file name (S3 object key when S3 configured, or local path)
}

// Account Types
export interface Account {
  id: number;
  name: string;
  features: AccountFeature[];
  dateCreated: string;
  dateModified?: string;
}

export interface AccountFeature {
  accountId: number;
  featureId: number;
  feature: string;
}

export interface AccountCreateRequestBody {
  name: string;
}

export interface AccountResponse {
  success: boolean;
  data: Account;
}

export interface AccountJobExecutionsCount {
  id: number;
  accountId: number;
  executionCount: number;
  tokens: number;
  dateCreated: string;
  dateModified: string;
  nextResetDate: string;
}

export interface AccountTokensResponse {
  success: boolean;
  data: {
    tokens: number;
  };
}

export interface AccountTokensAddResponse {
  success: boolean;
  data: {
    newBalance: number;
  };
}

export interface AccountExecutionCountResponse {
  success: boolean;
  data: AccountJobExecutionsCount;
}

export interface AccountExecutionCountIncreaseResponse {
  success: boolean;
  data: {
    newExecutionCount: number;
  };
}

// Feature Types
export interface Feature {
  id: number;
  name: string;
  dateCreated: string;
  dateModified?: string;
}

export interface FeatureRequest {
  featureId: number;
}

export interface FeatureRequestResponse {
  success: boolean;
  data: FeatureRequest;
}

export interface FeaturesResponse {
  success: boolean;
  data: Feature[];
}

// Credential Types
//
// The `admin` scope authorizes account- and cluster-level operations and can only
// be granted by an operator or an existing admin credential.
export type CredentialScope = 'read' | 'write' | 'execute' | 'admin';

export interface Credential {
  id: number;
  accountId: number;
  archived: boolean;
  apiKey: string;
  /**
   * Returned exactly once, in the 201 create response.
   * The server stores only the encrypted form and cannot return it again.
   * Save this value immediately in your secret manager.
   */
  plaintextSecret?: string;
  dateCreated: string;
  dateModified?: string;
  dateDeleted?: string;
  createdBy?: string;
  modifiedBy?: string;
  deletedBy?: string;
  archivedBy?: string;
  expiresAt?: string;
  scopes?: CredentialScope[];
}

export interface CredentialCreateRequestBody {
  archived?: boolean;
  createdBy: string;
  // Required by the API. Must be a non-empty subset of {read, write, execute, admin}.
  scopes: CredentialScope[];
  // Optional shorter lifetime in seconds. The server clamps it to its allowed
  // range; omit to use the default expiry.
  expiresInSeconds?: number;
}

export interface CredentialArchiveRequestBody {
  archivedBy: string;
}

export interface CredentialUpdateRequestBody {
  archived?: boolean;
  modifiedBy: string;
}

export interface CredentialDeleteRequestBody {
  deletedBy: string;
}

export interface CredentialResponse {
  success: boolean;
  data: Credential;
}

export interface PaginatedCredentialsResponse {
  success: boolean;
  data: {
    total: number;
    offset: number;
    limit: number;
    credentials: Credential[];
  };
}

export interface ListCredentialsParams {
  accountId?: number;
  limit: number;
  offset: number;
  orderBy?: 'date_created' | 'date_modified' | 'created_by' | 'modified_by' | 'deleted_by';
  orderByDirection?: 'asc' | 'desc';
}

export interface RotateSecretRequest {
  /**
   * The previous SecretKey (hex-encoded AES key) used to decrypt existing secrets
   * before they are re-encrypted with the server's currently-loaded SecretKey.
   */
  oldSecretKey: string;
}

export interface RotateSecretResponse {
  success: boolean;
  data: {
    /** Number of credential rows whose api_secret was re-encrypted. */
    credentialsRotated: number;
    /** Number of executor rows whose cloud provider credentials were re-encrypted. */
    executorsRotated: number;
    /** Number of account AI-settings rows whose provider keys were re-encrypted. */
    aiSettingsRotated: number;
  };
}

// Execution Types
export interface Execution {
  id: number;
  accountId: number;
  uniqueId: string;
  state: number; // 0: scheduled, 1: success, 2: failed
  nodeId: number;
  jobId: number;
  lastExecutionDatetime: string;
  nextExecutionDatetime: string;
  jobQueueVersion: number;
  executionVersion: number;
  dateCreated: string;
  dateModified: string;
}

export interface ExecutionResponse {
  success: boolean;
  data: Execution;
}

export interface PaginatedExecutionsResponse {
  success: boolean;
  data: {
    total: number;
    offset: number;
    limit: number;
    executions: Execution[];
  };
}

export interface ListExecutionsParams {
  accountId?: number;
  startDate?: string; // RFC3339 format (optional)
  endDate?: string; // RFC3339 format (optional)
  projectId?: number;
  jobId?: number;
  state?: 'scheduled' | 'success' | 'failed';
  orderBy?: 'dateCreated' | 'lastExecutionDateTime' | 'nextExecutionDateTime';
  orderDirection?: 'ASC' | 'DESC';
  limit: number;
  offset: number;
}

// Executor Types
export interface Executor {
  id: number;
  accountId: number;
  name: string;
  type: 'cloud_function' | 'webhook_url';
  region?: string;
  cloudProvider?: string;
  cloudResourceUrl?: string;
  /**
   * Secret. The server stores it encrypted and only returns it once, in the
   * createExecutor response. It is always absent on getExecutor, listExecutors
   * and updateExecutor responses.
   */
  cloudApiKey?: string;
  /** See cloudApiKey: only returned once in the createExecutor response. */
  cloudApiSecret?: string;
  webhookUrl?: string;
  /** See cloudApiKey: only returned once in the createExecutor response. */
  webhookSecret?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  dateCreated: string;
  dateModified?: string;
  dateDeleted?: string;
  createdBy?: string;
  modifiedBy?: string;
  deletedBy?: string;
}

export interface ExecutorResponse {
  success: boolean;
  data: Executor;
}

export interface ExecutorCreateRequestBody {
  name?: string;
  type?: 'cloud_function' | 'webhook_url';
  region?: string;
  cloudProvider?: string;
  cloudResourceUrl?: string;
  cloudApiKey?: string;
  cloudApiSecret?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  createdBy: string;
}

export interface ExecutorUpdateRequestBody {
  name?: string;
  type?: 'cloud_function' | 'webhook_url';
  region?: string;
  cloudProvider?: string;
  cloudResourceUrl?: string;
  cloudApiKey?: string;
  cloudApiSecret?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  modifiedBy: string;
}

export interface ExecutorDeleteRequestBody {
  deletedBy: string;
}

export interface PaginatedExecutorsResponse {
  success: boolean;
  data: {
    total: number;
    offset: number;
    limit: number;
    executors: Executor[];
  };
}

export interface ListExecutorsParams {
  accountId?: number;
  limit: number;
  offset: number;
  orderBy?: 'date_created' | 'date_modified' | 'created_by' | 'modified_by' | 'deleted_by';
  orderByDirection?: 'asc' | 'desc';
}

// Job Types
export interface Job {
  id: number;
  accountId: number;
  projectId: number;
  executorId?: number;
  data?: string;
  spec?: string;
  startDate?: string;
  endDate?: string;
  lastExecutionDate?: string;
  timezone: string;
  timezoneOffset?: number;
  retryMax?: number;
  executionId?: string;
  status?: 'active' | 'inactive';
  dateCreated: string;
  dateModified?: string;
  createdBy?: string;
  modifiedBy?: string;
  deletedBy?: string;
}

export interface JobResponse {
  success: boolean;
  data: Job;
}

export interface BatchJobResponse {
  success: boolean;
  data: string; // Request ID for async task tracking
}

export interface JobCreateRequestBody {
  projectId: number;
  timezone: string;
  executorId?: number;
  data?: string;
  spec?: string;
  startDate?: string;
  endDate?: string;
  timezoneOffset?: number;
  retryMax?: number;
  status?: 'active' | 'inactive';
  createdBy: string;
}

export interface JobUpdateRequestBody {
  projectId?: number;
  executorId?: number;
  data?: string;
  spec?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  timezoneOffset?: number;
  retryMax?: number;
  status?: 'active' | 'inactive';
  modifiedBy: string;
}

export interface JobDeleteRequestBody {
  deletedBy: string;
}

export interface PaginatedJobsResponse {
  success: boolean;
  data: {
    total: number;
    offset: number;
    limit: number;
    jobs: Job[];
  };
}

export interface ListJobsParams {
  accountId?: number;
  projectId?: string; // Empty string for all projects
  limit: number;
  offset: number;
  orderBy?: 'date_created' | 'date_modified' | 'created_by' | 'modified_by' | 'deleted_by';
  orderByDirection?: 'asc' | 'desc';
}

// Project Types
export interface Project {
  id: number;
  accountId: number;
  name: string;
  description?: string;
  dateCreated: string;
  dateModified?: string;
  createdBy?: string;
  modifiedBy?: string;
  deletedBy?: string;
}

export interface ProjectResponse {
  success: boolean;
  data: Project;
}

export interface ProjectCreateRequestBody {
  name?: string;
  description?: string;
  createdBy: string;
}

export interface ProjectUpdateRequestBody {
  description?: string;
  modifiedBy: string;
}

export interface ProjectDeleteRequestBody {
  deletedBy: string;
}

export interface PaginatedProjectsResponse {
  success: boolean;
  data: {
    total: number;
    offset: number;
    limit: number;
    projects: Project[];
  };
}

export interface ListProjectsParams {
  accountId?: number;
  limit: number;
  offset: number;
  orderBy?: 'date_created' | 'date_modified' | 'created_by' | 'modified_by' | 'deleted_by';
  orderByDirection?: 'asc' | 'desc';
}

// Async Task Types
export interface AsyncTask {
  id: number;
  requestId: string;
  input: string;
  output: string;
  service: string;
  state: 0 | 1 | 2 | 3; // 0: Not Started, 1: In Progress, 2: Success, 3: Fail
  dateCreated: string;
}

export interface AsyncTaskResponse {
  success: boolean;
  data: AsyncTask;
}

// Healthcheck Types
export interface RaftStats {
  applied_index: string;
  commit_index: string;
  fsm_pending: string;
  last_contact: string;
  last_log_index: string;
  last_log_term: string;
  last_snapshot_index: string;
  last_snapshot_term: string;
  latest_configuration: string;
  latest_configuration_index: string;
  num_peers: string;
  protocol_version: string;
  protocol_version_max: string;
  protocol_version_min: string;
  snapshot_version_max: string;
  snapshot_version_min: string;
  state: string;
  term: string;
}

export interface HealthcheckData {
  leaderAddress: string;
  leaderId: string;
  raftStats: RaftStats;
}

export interface HealthcheckResponse {
  success: boolean;
  data: HealthcheckData;
}

// Account AI Settings Types
export interface ActiveModel {
  provider: string;
  model: string;
}

export interface ModelInfo {
  id: string;
  display_name: string;
  default?: boolean;
}

export interface AccountAISettings {
  account_id?: number;
  provider?: string;
  model?: string;
  active_models?: ActiveModel[];
  openai_api_key?: string;
  anthropic_api_key?: string;
  bedrock_access_key_id?: string;
  bedrock_secret_key?: string;
  bedrock_region?: string;
  openrouter_api_key?: string;
  date_created?: string;
  date_modified?: string;
}

export interface AccountAISettingsResponse {
  success: boolean;
  data: AccountAISettings;
}

export interface AIModelsResponse {
  success: boolean;
  data: Record<string, ModelInfo[]>;
}

// AI Prompt Types
export interface PromptJobRequest {
  prompt: string;
  purposes?: string[]; // Max 5 items, each max 36 characters
  events?: string[]; // Max 5 items, each max 36 characters
  recipients?: string[]; // Max 5 items, each max 36 characters
  channels?: string[]; // Max 5 items, each max 36 characters
  timezone?: string;
  // Optional BCP-47 locale (e.g. "en-US", "es-ES") forwarded to the AI model;
  // omitted falls back to "en".
  locale?: string;
}

export interface PromptJobResponse {
  kind: 'FOLLOW_UP' | 'REMINDER' | 'DIGEST';
  purpose?: string;
  subject?: string;
  nextRunAt?: string;
  recurrence?: 'every minute' | 'every hour' | 'every day' | 'every week' | 'every month' | 'every year' | 'none';
  event?: string;
  delivery?: string;
  cronExpression?: string;
  channel?: string;
  recipients?: string[];
  startDate?: string;
  endDate?: string;
  timezone?: string;
  metadata?: Record<string, any>;
}

export interface PromptProviderResult {
  provider: string;
  model: string;
  jobs: PromptJobResponse[];
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
}

export interface IntentClassification {
  text: string;
  decision: 'allow' | 'clarify' | 'reject';
  reason: string;
}

export interface PromptResult {
  providers: PromptProviderResult[];
  classification?: IntentClassification;
}

export interface ClassifyPromptRequest {
  prompt: string;
  // Optional BCP-47 locale. Only English (en*) is currently supported; other
  // locales are rejected by the server with a 400.
  locale?: string;
}

// Execution Analytics Types
export interface DateRangeAnalyticsPoint {
  date: string;
  time: string;
  scheduled: number;
  success: number;
  failed: number;
}

export interface DateRangeAnalyticsResponse {
  accountId: number;
  timezone: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  points: DateRangeAnalyticsPoint[];
}

export interface DateRangeAnalyticsAPIResponse {
  success: boolean;
  data: DateRangeAnalyticsResponse;
}

export interface GetDateRangeAnalyticsParams {
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM:SS or HH:MM format
  accountId?: number;
}

export interface ExecutionTotalsResponse {
  accountId: number;
  scheduled: number;
  success: number;
  failed: number;
}

export interface ExecutionTotalsAPIResponse {
  success: boolean;
  data: ExecutionTotalsResponse;
}

export interface CleanupOldLogsRequestBody {
  accountId: string;
  retentionMonths: number;
}

export interface CleanupOldLogsResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// Local Executor Types

export interface LocalExecutorRegisterRequest {
  name: string;
  command: string;
  workingDir?: string;
  createdBy?: string;
}

export interface LocalExecutorRegisterResponse {
  success: boolean;
  data: {
    id: number;
  };
}

export interface LocalExecutorJobsResponse {
  success: boolean;
  data: Job[];
}

export interface LocalExecutionReport {
  jobId: number;
  uniqueId: string;
  state: number; // 0 = scheduled, 1 = success, 2 = failed
  lastExecutionTime?: string; // RFC3339
  nextExecutionTime?: string; // RFC3339
  executionVersion?: number;
  jobQueueVersion?: number;
}

export interface ReportLocalExecutionsResponse {
  success: boolean;
  data: {
    committed: number;
  };
}

