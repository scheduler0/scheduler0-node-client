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

export interface AccountUpdateRequestBody {
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

// Log-derived view of one AI quota dimension (prompt or classify) for the current period.
export interface AIUsageDimension {
  limit: number;
  used: number;
  remaining: number;
}

// Authoritative, log-derived AI request usage for an account's current period. Replaces the
// removed classify-count/prompt-count models.
export interface AIUsage {
  accountId: number;
  periodStart: string;
  nextResetDate: string;
  prompt: AIUsageDimension;
  classify: AIUsageDimension;
  // Sum of estimated prompt-request USD cost for the current billing period (all statuses).
  estimatedCostUsd: number;
}

export interface AIUsageResponse {
  success: boolean;
  data: AIUsage;
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
  /**
   * Free-text description of what this executor does. Used by the /ai/schedule
   * endpoint to match an executor to a prompt's purpose and channels.
   */
  description?: string;
  /** Short labels describing the executor's purpose/channels (e.g. "email", "slack"). */
  tags?: string[];
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
  description?: string;
  tags?: string[];
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
  description?: string;
  tags?: string[];
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

// Test invocation types
// Optional body for testInvokeExecutor. All fields are optional; an empty body
// invokes the executor with a default synthetic job. Server-managed fields on
// `job` (id, accountId, executorId, dateCreated, lastExecutionDate) are ignored
// and overridden by the server.
export interface TestInvocationRequestBody {
  // Standard job attributes to include in the invocation payload.
  job?: Partial<Job>;
  // How old the synthetic job entry should appear, as a Go duration string
  // (e.g. "24h", "1h30m", "15m"). Sets the job's dateCreated and
  // lastExecutionDate to now-age.
  age?: string;
  // The moment the job is treated as executing at (RFC3339). Becomes the
  // payload's lastExecutionDateTime. Defaults to now.
  executionTime?: string;
}

export interface JobInvocationPayload {
  job: Job;
  lastExecutionDateTime?: string;
  lastExecutionStatus?: 'scheduled' | 'success' | 'failed';
}

export interface TestInvocationResult {
  test: boolean;
  executorId: number;
  executorType: string;
  success: boolean;
  error?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  payload: JobInvocationPayload;
}

export interface TestInvocationResponse {
  success: boolean;
  data: TestInvocationResult;
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

// AI Prompt Request Log Types
// A single persisted AI prompt execution (mirrors the AccountPromptRequest server model).
export interface PromptRequest {
  id: number;
  account_id: number;
  prompt: string;
  provider: string;
  model: string;
  output: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  duration_ms: number;
  estimated_cost_usd: number;
  status: string;
  error?: string;
  date_created: string;
}

export interface ListPromptRequestsParams {
  provider?: string;
  model?: string;
  status?: string;
  search?: string;
  start?: string; // RFC3339
  end?: string; // RFC3339
  order?: string; // ASC or DESC
  limit?: number;
  offset?: number;
}

export interface PromptRequestsResponse {
  success: boolean;
  data: {
    requests: PromptRequest[];
    total: number;
    limit: number;
    offset: number;
  };
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

// Schedule-from-prompt Types (POST /ai/schedule)
export interface ScheduleProjectInput {
  name?: string;
  description?: string;
}

export interface SchedulePromptRequest {
  prompt: string;
  purposes?: string[];
  events?: string[];
  recipients?: string[];
  channels?: string[];
  timezone?: string;
  locale?: string;
  /** Reuse an existing project. Takes precedence over `project`. */
  projectId?: number;
  /** Create-or-reuse a project by name when `projectId` is absent. */
  project?: ScheduleProjectInput;
  /** Pin a specific executor and skip LLM matching. */
  executorId?: number;
  /** Required; stamped on the created project and jobs. */
  createdBy: string;
}

export interface ScheduleResult {
  classification?: IntentClassification;
  project: Project;
  projectCreated: boolean;
  executor: Executor;
  /** One of "pinned" | "only" | "llm". */
  executorMatchedBy: string;
  /** The model's rationale when matched by "llm". */
  executorMatchReason?: string;
  jobs: Job[];
  provider?: string;
  model?: string;
}

// Conversation Suggestions Types
export interface SuggestionParticipant {
  id?: string;
  display_name?: string;
  timezone?: string;
}

export interface SuggestionMessage {
  id?: string;
  // Either a participant object or a bare display-name string (minimal shape).
  speaker: SuggestionParticipant | string;
  timestamp: string;
  message: string;
}

/**
 * Analysis options. `locale` is English only for the first release: it defaults
 * to `en` and only accepts `en*` values; any other locale is rejected by the API
 * with UNSUPPORTED_LOCALE.
 */
export interface SuggestionOptions {
  reference_time?: string;
  locale?: string;
  default_timezone?: string;
  minimum_confidence?: number;
  include_low_confidence?: boolean;
  include_resolved_obligations?: boolean;
  default_due_time?: string;
  default_deadline_time?: string;
}

export interface AnalyzeSuggestionsRequest {
  conversation_id?: string;
  messages: SuggestionMessage[];
  participants?: SuggestionParticipant[];
  options?: SuggestionOptions;
}

/**
 * The analyzer's response. Individual suggestions/obligations carry a rich,
 * evolving shape owned by the edge analyzer, so they are typed loosely.
 */
export interface AnalyzeSuggestionsResult {
  request_id?: string;
  conversation_id?: string;
  analyzed_at?: string;
  suggestions: Record<string, any>[];
  obligations: Record<string, any>[];
  warnings: Record<string, any>[];
  engine?: Record<string, any>;
}

// Send-Time Suggestions Types
// The engine is deterministic scheduling/time-zone math (no LLM). All keys are
// snake_case to match the API contract.

export interface SendTimeWorkingHours {
  days?: string[];
  start?: string;
  end?: string;
}

export interface SendTimeQuietHours {
  start?: string;
  end?: string;
}

export interface SendTimeParticipant {
  id?: string;
  display_name?: string;
  timezone: string;
  role?: string;
  working_hours?: SendTimeWorkingHours;
  quiet_hours?: SendTimeQuietHours;
}

export interface SendTimeMessage {
  channel?: string;
  priority?: string;
  intent?: string;
  text?: string;
  estimated_attention?: string;
}

export interface SendTimeConstraints {
  earliest_send_at?: string;
  latest_send_at?: string;
  minimum_delay_seconds?: number;
  working_hours_only?: boolean;
  avoid_weekends?: boolean;
  avoid_holidays?: boolean;
  respect_quiet_hours?: boolean;
  require_calendar_free?: boolean;
}

export interface SendTimeWindow {
  start: string;
  end: string;
}

export interface SendTimePreferences {
  preferred_recipient_windows?: SendTimeWindow[];
  avoid_recipient_windows?: SendTimeWindow[];
  prefer_sender_recipient_overlap?: boolean;
}

export interface SendTimeGroupPolicy {
  strategy?: string;
  minimum_recipient_coverage?: number;
}

export interface SendTimeOptions {
  reference_time?: string;
  suggestion_count?: number;
  candidate_interval_minutes?: number;
  locale?: string;
  include_score_breakdown?: boolean;
  include_rejected_summary?: boolean;
  search_horizon_days?: number;
  evaluate_send_now?: boolean;
  diversify_suggestions?: boolean;
  minimum_suggestion_spacing_minutes?: number;
}

export interface SendTimeHolidayPolicy {
  country?: string;
  region?: string;
  calendar_id?: string;
  dates?: string[];
}

export interface SendTimeBusyInterval {
  start: string;
  end: string;
}

export interface SendTimeAvailability {
  participant_id: string;
  busy_intervals?: SendTimeBusyInterval[];
}

export interface SendTimeSuggestionsRequest {
  sender?: SendTimeParticipant;
  recipients: SendTimeParticipant[];
  message?: SendTimeMessage;
  constraints?: SendTimeConstraints;
  preferences?: SendTimePreferences;
  group_policy?: SendTimeGroupPolicy;
  options?: SendTimeOptions;
  holiday_policy?: SendTimeHolidayPolicy;
  availability?: SendTimeAvailability[];
  metadata?: Record<string, any>;
}

/**
 * The send-time engine's response. The top-level fields are typed; individual
 * suggestions and the search/send_now blocks carry a rich, evolving shape, so
 * they are typed loosely.
 */
export interface SendTimeSuggestionsResult {
  request_id?: string;
  reference_time?: string;
  policy?: Record<string, any>;
  engine?: Record<string, any>;
  suggestions: Record<string, any>[];
  search?: Record<string, any>;
  rejected_summary?: Record<string, number>;
  no_suggestion?: Record<string, any>;
  send_now?: Record<string, any>;
  warnings: Record<string, any>[];
  metadata?: Record<string, any>;
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

