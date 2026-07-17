import {
  AccountCreateRequestBody,
  AccountResponse,
  AccountExecutionCountResponse,
  AccountExecutionCountIncreaseResponse,
  AccountTokensResponse,
  AccountTokensAddResponse,
  AccountAISettings,
  AccountAISettingsResponse,
  AIModelsResponse,
  FeatureRequest,
  FeatureRequestResponse,
  FeaturesResponse,
  CredentialCreateRequestBody,
  CredentialArchiveRequestBody,
  CredentialUpdateRequestBody,
  CredentialDeleteRequestBody,
  CredentialResponse,
  PaginatedCredentialsResponse,
  ListCredentialsParams,
  RotateSecretRequest,
  RotateSecretResponse,
  ExecutionResponse,
  PaginatedExecutionsResponse,
  ListExecutionsParams,
  GetDateRangeAnalyticsParams,
  DateRangeAnalyticsAPIResponse,
  ExecutionTotalsAPIResponse,
  CleanupOldLogsRequestBody,
  CleanupOldLogsResponse,
  ExecutorCreateRequestBody,
  ExecutorUpdateRequestBody,
  ExecutorDeleteRequestBody,
  ExecutorResponse,
  PaginatedExecutorsResponse,
  ListExecutorsParams,
  JobCreateRequestBody,
  JobUpdateRequestBody,
  JobDeleteRequestBody,
  JobResponse,
  BatchJobResponse,
  PaginatedJobsResponse,
  ListJobsParams,
  ProjectCreateRequestBody,
  ProjectUpdateRequestBody,
  ProjectDeleteRequestBody,
  ProjectResponse,
  PaginatedProjectsResponse,
  ListProjectsParams,
  AsyncTaskResponse,
  HealthcheckResponse,
  PromptJobRequest,
  PromptResult,
  IntentClassification,
  ClassifyPromptRequest,
  AnalyzeSuggestionsRequest,
  AnalyzeSuggestionsResult,
  SendTimeSuggestionsRequest,
  SendTimeSuggestionsResult,
  BackupRestoreResponse,
  RestoreRequest,
  LocalExecutorRegisterRequest,
  LocalExecutorRegisterResponse,
  LocalExecutorJobsResponse,
  LocalExecutionReport,
  ReportLocalExecutionsResponse,
} from './types';

export interface ClientOptions {
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  username?: string;
  password?: string;
}

export class Client {
  private baseURL: string;
  private version: string;
  private apiKey?: string;
  private apiSecret?: string;
  private accountId?: string;
  private username?: string;
  private password?: string;

  constructor(baseURL: string, version: string = 'v1', options?: ClientOptions) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.version = version;
    if (options) {
      this.apiKey = options.apiKey;
      this.apiSecret = options.apiSecret;
      this.accountId = options.accountId;
      this.username = options.username;
      this.password = options.password;
    }
  }

  // Static factory methods
  static newAPIClient(
    baseURL: string,
    version: string,
    apiKey: string,
    apiSecret: string
  ): Client {
    return new Client(baseURL, version, { apiKey, apiSecret });
  }

  static newAPIClientWithAccount(
    baseURL: string,
    version: string,
    apiKey: string,
    apiSecret: string,
    accountId: string
  ): Client {
    return new Client(baseURL, version, { apiKey, apiSecret, accountId });
  }

  static newBasicAuthClient(
    baseURL: string,
    version: string,
    username: string,
    password: string
  ): Client {
    return new Client(baseURL, version, { username, password });
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string | number | undefined>,
    accountIdOverride?: string
  ): Promise<T> {
    const versionPrefix = `/api/${this.version}`;
    let url = `${this.baseURL}${versionPrefix}${endpoint}`;

    // Add query parameters
    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Set authentication
    if (this.username && this.password) {
      // Basic Auth for peer communication
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
      headers['X-Peer'] = 'cmd';
    } else if (this.apiKey && this.apiSecret) {
      // API Key + Secret authentication
      headers['X-API-Key'] = this.apiKey;
      headers['X-Secret-Key'] = this.apiSecret;
    }

    // Add account ID
    const accountID = accountIdOverride || this.accountId;
    if (accountID) {
      headers['X-Account-ID'] = accountID;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Get response text once (can only read body once)
    const responseText = await response.text();
    let responseData: any;

    // Try to parse as JSON if there's content
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // If JSON parsing fails, use the raw text
        responseData = responseText;
      }
    }

    // Handle error responses (status >= 400)
    if (response.status >= 400) {
      // If error response is JSON with success/data structure, extract the error message
      if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
        const errorMessage = typeof responseData.data === 'string' 
          ? responseData.data 
          : JSON.stringify(responseData.data);
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      // If it's a JSON object but not in the expected format, stringify it
      if (responseData && typeof responseData === 'object') {
        throw new Error(`API error: ${response.status} - ${JSON.stringify(responseData)}`);
      }
      // Otherwise use the raw response text
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    // For successful responses, validate and return the data
    if (responseData) {
      // All scheduler0 API responses should follow { success: bool, data: T } structure
      if (typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
        return responseData as T;
      }
      // If response doesn't have the expected structure, wrap it for consistency
      // This handles edge cases where the API might return data directly
      return { success: true, data: responseData } as T;
    }

    // Empty response (shouldn't happen for most endpoints, but handle gracefully)
    return { success: true, data: null } as T;
  }

  private resolveAccountID(body: any, accountIdOverride?: string): string | undefined {
    if (accountIdOverride) {
      return accountIdOverride;
    }

    // Try to extract from body
    if (body && typeof body === 'object') {
      if (Array.isArray(body) && body.length > 0) {
        return this.resolveAccountID(body[0]);
      }
      if (body.accountId !== undefined && body.accountId !== null && body.accountId !== '') {
        return String(body.accountId);
      }
    }

    return this.accountId;
  }

  // Account Methods
  async createAccount(body: AccountCreateRequestBody): Promise<AccountResponse> {
    return this.request<AccountResponse>('POST', '/accounts', body);
  }

  async getAccount(id: string): Promise<AccountResponse> {
    return this.request<AccountResponse>('GET', `/accounts/${id}`);
  }

  async getAccountExecutionCount(accountId: string): Promise<AccountExecutionCountResponse> {
    return this.request<AccountExecutionCountResponse>('GET', `/accounts/${accountId}/execution-count`);
  }

  async increaseAccountExecutionCount(accountId: string, count: number): Promise<AccountExecutionCountIncreaseResponse> {
    return this.request<AccountExecutionCountIncreaseResponse>('PUT', `/accounts/${accountId}/execution-count`, { count });
  }

  async addFeatureToAccount(accountId: string, body: FeatureRequest): Promise<FeatureRequestResponse> {
    return this.request<FeatureRequestResponse>('PUT', `/accounts/${accountId}/feature`, body);
  }

  async removeFeatureFromAccount(accountId: string, body: FeatureRequest): Promise<void> {
    return this.request<void>('DELETE', `/accounts/${accountId}/feature`, body);
  }

  async addAllFeaturesToAccount(accountId: string): Promise<{ success: boolean; data: { message: string } }> {
    return this.request<{ success: boolean; data: { message: string } }>('PUT', `/accounts/${accountId}/features/all`);
  }

  async removeAllFeaturesFromAccount(accountId: string): Promise<{ success: boolean; data: { message: string } }> {
    return this.request<{ success: boolean; data: { message: string } }>('DELETE', `/accounts/${accountId}/features/all`);
  }

  // Feature Methods
  async listFeatures(): Promise<FeaturesResponse> {
    return this.request<FeaturesResponse>('GET', '/features');
  }

  // Credential Methods
  async listCredentials(params: ListCredentialsParams): Promise<PaginatedCredentialsResponse> {
    const accountIdOverride = params.accountId ? String(params.accountId) : undefined;
    const queryParams: Record<string, string | number> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.orderBy) {
      queryParams.orderBy = params.orderBy;
    }
    if (params.orderByDirection) {
      queryParams.orderByDirection = params.orderByDirection;
    }
    return this.request<PaginatedCredentialsResponse>(
      'GET',
      '/credentials',
      undefined,
      queryParams,
      accountIdOverride
    );
  }

  async createCredential(body: CredentialCreateRequestBody, accountIdOverride?: string): Promise<CredentialResponse> {
    return this.request<CredentialResponse>('POST', '/credentials', body, undefined, accountIdOverride);
  }

  async getCredential(id: string, accountIdOverride?: string): Promise<CredentialResponse> {
    return this.request<CredentialResponse>('GET', `/credentials/${id}`, undefined, undefined, accountIdOverride);
  }

  async updateCredential(id: string, body: CredentialUpdateRequestBody, accountIdOverride?: string): Promise<CredentialResponse> {
    return this.request<CredentialResponse>('PUT', `/credentials/${id}`, body, undefined, accountIdOverride);
  }

  async deleteCredential(id: string, body: CredentialDeleteRequestBody, accountIdOverride?: string): Promise<void> {
    return this.request<void>('DELETE', `/credentials/${id}`, body, undefined, accountIdOverride);
  }

  async archiveCredential(id: string, body: CredentialArchiveRequestBody, accountIdOverride?: string): Promise<void> {
    return this.request<void>('POST', `/credentials/${id}/archive`, body, undefined, accountIdOverride);
  }

  /**
   * Re-encrypt all secrets stored under the server's SecretKey — credential api
   * secrets, executor cloud provider credentials, and per-account AI provider keys —
   * from `oldSecretKey` to the server's currently-loaded (new) SecretKey.
   *
   * A credential's `api_secret` is stored encrypted and verified by
   * decrypt-then-compare, so it is re-encrypted too; the `api_key` is a stable
   * identifier that is left unchanged, so rotation does not invalidate any credential.
   *
   * **Self-Hosting Only.** The operator must update `SecretKey` in the secrets
   * source and reload/restart the server before calling this method, then pass the
   * previous key as `oldSecretKey`. Requires a basic-auth client instance (created
   * with `username` + `password` options). The operation is idempotent and resumable.
   */
  async rotateSecret(oldSecretKey: string): Promise<RotateSecretResponse> {
    const body: RotateSecretRequest = { oldSecretKey };
    return this.request<RotateSecretResponse>('POST', '/account/rotate-secret', body);
  }

  // Execution Methods
  async listExecutions(params: ListExecutionsParams): Promise<PaginatedExecutionsResponse> {
    const accountIdOverride = params.accountId ? String(params.accountId) : undefined;
    const queryParams: Record<string, string | number> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.startDate) {
      queryParams.startDate = params.startDate;
    }
    if (params.endDate) {
      queryParams.endDate = params.endDate;
    }
    if (params.projectId !== undefined) {
      queryParams.projectId = params.projectId;
    }
    if (params.jobId !== undefined) {
      queryParams.jobId = params.jobId;
    }
    if (params.state) {
      queryParams.state = params.state;
    }
    if (params.orderBy) {
      queryParams.orderBy = params.orderBy;
    }
    if (params.orderDirection) {
      queryParams.orderDirection = params.orderDirection;
    }
    return this.request<PaginatedExecutionsResponse>(
      'GET',
      '/executions',
      undefined,
      queryParams,
      accountIdOverride
    );
  }

  async getDateRangeAnalytics(
    params: GetDateRangeAnalyticsParams,
    accountIdOverride?: string
  ): Promise<DateRangeAnalyticsAPIResponse> {
    const accountID = accountIdOverride || (params.accountId ? String(params.accountId) : undefined);
    const queryParams: Record<string, string> = {
      startDate: params.startDate,
      startTime: params.startTime,
    };
    return this.request<DateRangeAnalyticsAPIResponse>(
      'GET',
      '/executions/analytics',
      undefined,
      queryParams,
      accountID
    );
  }

  async getExecutionTotals(
    accountId: number,
    accountIdOverride?: string
  ): Promise<ExecutionTotalsAPIResponse> {
    const accountID = accountIdOverride || String(accountId);
    return this.request<ExecutionTotalsAPIResponse>(
      'GET',
      '/executions/totals',
      undefined,
      undefined,
      accountID
    );
  }

  async cleanupOldExecutionLogs(
    accountId: string,
    retentionMonths: number,
    accountIdOverride?: string
  ): Promise<CleanupOldLogsResponse> {
    const accountID = accountIdOverride || accountId;
    const body: CleanupOldLogsRequestBody = {
      accountId,
      retentionMonths,
    };
    return this.request<CleanupOldLogsResponse>(
      'POST',
      '/executions/cleanup-old-logs',
      body,
      undefined,
      accountID
    );
  }

  // Executor Methods
  async listExecutors(params: ListExecutorsParams): Promise<PaginatedExecutorsResponse> {
    const accountIdOverride = params.accountId ? String(params.accountId) : undefined;
    const queryParams: Record<string, string | number> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.orderBy) {
      queryParams.orderBy = params.orderBy;
    }
    if (params.orderByDirection) {
      queryParams.orderByDirection = params.orderByDirection;
    }
    return this.request<PaginatedExecutorsResponse>(
      'GET',
      '/executors',
      undefined,
      queryParams,
      accountIdOverride
    );
  }

  async createExecutor(body: ExecutorCreateRequestBody, accountIdOverride?: string): Promise<ExecutorResponse> {
    return this.request<ExecutorResponse>('POST', '/executors', body, undefined, accountIdOverride);
  }

  async getExecutor(id: string, accountIdOverride?: string): Promise<ExecutorResponse> {
    return this.request<ExecutorResponse>('GET', `/executors/${id}`, undefined, undefined, accountIdOverride);
  }

  async updateExecutor(id: string, body: ExecutorUpdateRequestBody, accountIdOverride?: string): Promise<ExecutorResponse> {
    return this.request<ExecutorResponse>('PUT', `/executors/${id}`, body, undefined, accountIdOverride);
  }

  async deleteExecutor(id: string, body: ExecutorDeleteRequestBody, accountIdOverride?: string): Promise<void> {
    return this.request<void>('DELETE', `/executors/${id}`, body, undefined, accountIdOverride);
  }

  // Project Methods
  async listProjects(params: ListProjectsParams): Promise<PaginatedProjectsResponse> {
    const accountIdOverride = params.accountId ? String(params.accountId) : undefined;
    const queryParams: Record<string, string | number> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.orderBy) {
      queryParams.orderBy = params.orderBy;
    }
    if (params.orderByDirection) {
      queryParams.orderByDirection = params.orderByDirection;
    }
    return this.request<PaginatedProjectsResponse>(
      'GET',
      '/projects',
      undefined,
      queryParams,
      accountIdOverride
    );
  }

  async createProject(body: ProjectCreateRequestBody, accountIdOverride?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('POST', '/projects', body, undefined, accountIdOverride);
  }

  async getProject(id: string, accountIdOverride?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('GET', `/projects/${id}`, undefined, undefined, accountIdOverride);
  }

  async updateProject(id: string, body: ProjectUpdateRequestBody, accountIdOverride?: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('PUT', `/projects/${id}`, body, undefined, accountIdOverride);
  }

  async deleteProject(id: string, body: ProjectDeleteRequestBody, accountIdOverride?: string): Promise<void> {
    return this.request<void>('DELETE', `/projects/${id}`, body, undefined, accountIdOverride);
  }

  // Job Methods
  async listJobs(params: ListJobsParams): Promise<PaginatedJobsResponse> {
    const accountIdOverride = params.accountId ? String(params.accountId) : undefined;
    const queryParams: Record<string, string | number> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.projectId) {
      queryParams.projectId = params.projectId;
    }
    if (params.orderBy) {
      queryParams.orderBy = params.orderBy;
    }
    if (params.orderByDirection) {
      queryParams.orderByDirection = params.orderByDirection;
    }
    return this.request<PaginatedJobsResponse>(
      'GET',
      '/jobs',
      undefined,
      queryParams,
      accountIdOverride
    );
  }

  async createJob(body: JobCreateRequestBody, accountIdOverride?: string): Promise<BatchJobResponse> {
    // Single job creation wraps the job in an array for batch processing
    return this.batchCreateJobs([body], accountIdOverride);
  }

  async batchCreateJobs(jobs: JobCreateRequestBody[], accountIdOverride?: string): Promise<BatchJobResponse> {
    return this.request<BatchJobResponse>('POST', '/jobs', jobs, undefined, accountIdOverride);
  }

  async getJob(id: string, accountIdOverride?: string): Promise<JobResponse> {
    return this.request<JobResponse>('GET', `/jobs/${id}`, undefined, undefined, accountIdOverride);
  }

  async updateJob(id: string, body: JobUpdateRequestBody, accountIdOverride?: string): Promise<JobResponse> {
    return this.request<JobResponse>('PUT', `/jobs/${id}`, body, undefined, accountIdOverride);
  }

  async deleteJob(id: string, body: JobDeleteRequestBody, accountIdOverride?: string): Promise<void> {
    return this.request<void>('DELETE', `/jobs/${id}`, body, undefined, accountIdOverride);
  }

  // Async Task Methods
  async getAsyncTask(id: string, accountIdOverride?: string): Promise<AsyncTaskResponse> {
    return this.request<AsyncTaskResponse>('GET', `/async-tasks/${id}`, undefined, undefined, accountIdOverride);
  }

  // Healthcheck Methods
  async healthcheck(): Promise<HealthcheckResponse> {
    return this.request<HealthcheckResponse>('GET', '/healthcheck');
  }

  // AI Prompt Methods
  async createJobFromPrompt(body: PromptJobRequest, accountIdOverride?: string): Promise<PromptResult> {
    const versionPrefix = `/api/${this.version}`;
    const url = `${this.baseURL}${versionPrefix}/ai/prompt`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.username && this.password) {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
      headers['X-Peer'] = 'cmd';
    } else if (this.apiKey && this.apiSecret) {
      headers['X-API-Key'] = this.apiKey;
      headers['X-Secret-Key'] = this.apiSecret;
    }

    const accountID = accountIdOverride || this.accountId;
    if (accountID) {
      headers['X-Account-ID'] = accountID;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      const responseText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }

      if (errorData && typeof errorData === 'object' && 'success' in errorData && 'data' in errorData) {
        const errorMessage = typeof errorData.data === 'string'
          ? errorData.data
          : JSON.stringify(errorData.data);
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      return { providers: [] };
    }

    try {
      const envelope = JSON.parse(responseText) as { success: boolean; data: PromptResult };
      return envelope.data ?? { providers: [] };
    } catch (e) {
      throw new Error(`Failed to parse response: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async classifyPrompt(body: ClassifyPromptRequest, accountIdOverride?: string): Promise<IntentClassification> {
    const versionPrefix = `/api/${this.version}`;
    const url = `${this.baseURL}${versionPrefix}/ai/prompt/classify`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.username && this.password) {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
      headers['X-Peer'] = 'cmd';
    } else if (this.apiKey && this.apiSecret) {
      headers['X-API-Key'] = this.apiKey;
      headers['X-Secret-Key'] = this.apiSecret;
    }

    const accountID = accountIdOverride || this.accountId;
    if (accountID) {
      headers['X-Account-ID'] = accountID;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      const responseText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }
      if (errorData && typeof errorData === 'object' && 'success' in errorData && 'data' in errorData) {
        const errorMessage = typeof errorData.data === 'string'
          ? errorData.data
          : JSON.stringify(errorData.data);
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    const responseText = await response.text();
    const envelope = JSON.parse(responseText) as { success: boolean; data: { classification: IntentClassification } };
    return envelope.data.classification;
  }

  /**
   * Analyze a conversation and return structured, explainable suggestions
   * (commitments, requests, deadlines, follow-ups, etc.) plus the obligations
   * they map to.
   *
   * English only: a non-`en*` locale in `options` is rejected by the API with
   * UNSUPPORTED_LOCALE (400).
   */
  async analyzeSuggestions(body: AnalyzeSuggestionsRequest, accountIdOverride?: string): Promise<AnalyzeSuggestionsResult> {
    const versionPrefix = `/api/${this.version}`;
    const url = `${this.baseURL}${versionPrefix}/ai/suggestions/analyze`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.username && this.password) {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
      headers['X-Peer'] = 'cmd';
    } else if (this.apiKey && this.apiSecret) {
      headers['X-API-Key'] = this.apiKey;
      headers['X-Secret-Key'] = this.apiSecret;
    }

    const accountID = accountIdOverride || this.accountId;
    if (accountID) {
      headers['X-Account-ID'] = accountID;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      const responseText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }
      if (errorData && typeof errorData === 'object' && 'success' in errorData && 'data' in errorData) {
        const errorMessage = typeof errorData.data === 'string'
          ? errorData.data
          : JSON.stringify(errorData.data);
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    const responseText = await response.text();
    const envelope = JSON.parse(responseText) as { success: boolean; data: AnalyzeSuggestionsResult };
    return envelope.data;
  }

  /**
   * Recommend suitable future send times for a message given sender/recipient
   * time zones, working hours, quiet hours, weekends, priority, and coverage
   * rules. The engine is deterministic and does not send the message or create
   * a job.
   */
  async sendTimeSuggestions(body: SendTimeSuggestionsRequest, accountIdOverride?: string): Promise<SendTimeSuggestionsResult> {
    const versionPrefix = `/api/${this.version}`;
    const url = `${this.baseURL}${versionPrefix}/ai/send-time-suggestions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.username && this.password) {
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
      headers['X-Peer'] = 'cmd';
    } else if (this.apiKey && this.apiSecret) {
      headers['X-API-Key'] = this.apiKey;
      headers['X-Secret-Key'] = this.apiSecret;
    }

    const accountID = accountIdOverride || this.accountId;
    if (accountID) {
      headers['X-Account-ID'] = accountID;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      const responseText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = responseText;
      }
      if (errorData && typeof errorData === 'object' && 'success' in errorData && 'data' in errorData) {
        const errorMessage = typeof errorData.data === 'string'
          ? errorData.data
          : JSON.stringify(errorData.data);
        throw new Error(`API error: ${response.status} - ${errorMessage}`);
      }
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    const responseText = await response.text();
    const envelope = JSON.parse(responseText) as { success: boolean; data: SendTimeSuggestionsResult };
    return envelope.data;
  }

  // Account AI Settings Methods

  async getAccountAISettings(accountIdOverride?: string): Promise<AccountAISettingsResponse> {
    return this.request<AccountAISettingsResponse>('GET', '/ai/settings', undefined, undefined, accountIdOverride);
  }

  async upsertAccountAISettings(body: AccountAISettings, accountIdOverride?: string): Promise<{ success: boolean; data: { message: string } }> {
    return this.request<{ success: boolean; data: { message: string } }>('PUT', '/ai/settings', body, undefined, accountIdOverride);
  }

  async getAIModels(): Promise<AIModelsResponse> {
    return this.request<AIModelsResponse>('GET', '/ai/models', undefined, undefined, undefined);
  }

  // Account Tokens Methods

  async getAccountTokens(accountId: string): Promise<AccountTokensResponse> {
    return this.request<AccountTokensResponse>('GET', `/accounts/${accountId}/tokens`, undefined, undefined, accountId);
  }

  async addAccountTokens(accountId: string, amount: number): Promise<AccountTokensAddResponse> {
    return this.request<AccountTokensAddResponse>('PUT', `/accounts/${accountId}/tokens/add`, { amount }, undefined, accountId);
  }

  // Backup/Restore methods

  /**
   * Initiate an automatic timestamped backup
   */
  async backupDatabase(): Promise<BackupRestoreResponse> {
    return this.request<BackupRestoreResponse>('POST', '/cluster/backup');
  }

  /**
   * Initiate a restore from a backup file.
   * fileName is the backup file name (S3 object key when S3 configured, or local path).
   */
  async restoreDatabase(fileName: string): Promise<BackupRestoreResponse> {
    const body: RestoreRequest = { filePath: fileName };
    return this.request<BackupRestoreResponse>('POST', '/cluster/restore', body);
  }

  // Local Executor Methods

  /**
   * Register a new local executor. The server sets the executor type to "local".
   * POST /local-executors
   */
  async registerLocalExecutor(
    body: LocalExecutorRegisterRequest,
    accountIdOverride?: string
  ): Promise<LocalExecutorRegisterResponse> {
    return this.request<LocalExecutorRegisterResponse>('POST', '/local-executors', body, undefined, accountIdOverride);
  }

  /**
   * Pull the active jobs assigned to a local executor. Each call also renews the
   * executor's lease (heartbeat) and records a pull-log entry server-side.
   * GET /local-executors/{id}/jobs
   */
  async pullLocalExecutorJobs(
    executorId: string | number,
    accountIdOverride?: string
  ): Promise<LocalExecutorJobsResponse> {
    return this.request<LocalExecutorJobsResponse>('GET', `/local-executors/${executorId}/jobs`, undefined, undefined, accountIdOverride);
  }

  /**
   * Report a batch of local execution results. The events are committed via Raft
   * and counted toward the account's execution quota.
   * POST /local-executors/{id}/executions
   */
  async reportLocalExecutions(
    executorId: string | number,
    reports: LocalExecutionReport[],
    accountIdOverride?: string
  ): Promise<ReportLocalExecutionsResponse> {
    return this.request<ReportLocalExecutionsResponse>('POST', `/local-executors/${executorId}/executions`, reports, undefined, accountIdOverride);
  }
}

