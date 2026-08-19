import { Client } from '../client';
import {
  AccountResponse,
  CredentialResponse,
  PaginatedCredentialsResponse,
  PaginatedExecutionsResponse,
  ExecutorResponse,
  PaginatedExecutorsResponse,
  ProjectResponse,
  PaginatedProjectsResponse,
  JobResponse,
  BatchJobResponse,
  PaginatedJobsResponse,
  AsyncTaskResponse,
  HealthcheckResponse,
  FeaturesResponse,
  PromptJobResponse,
  PromptResult,
  IntentClassification,
  DateRangeAnalyticsAPIResponse,
  ExecutionTotalsAPIResponse,
  CleanupOldLogsResponse,
  LocalExecutorRegisterResponse,
  LocalExecutorJobsResponse,
  ReportLocalExecutionsResponse,
} from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('Client', () => {
  const baseURL = 'http://localhost:7070';
  const apiKey = 'mock-api-key';
  const apiSecret = 'mock-api-secret';
  const accountId = '123';

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Client Initialization', () => {
    it('should create a client with API key authentication', () => {
      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      expect(client).toBeInstanceOf(Client);
    });

    it('should create a client with API key and account ID', () => {
      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      expect(client).toBeInstanceOf(Client);
    });

    it('should create a client with basic authentication', () => {
      const client = Client.newBasicAuthClient(baseURL, 'v1', 'username', 'password');
      expect(client).toBeInstanceOf(Client);
    });

    it('should create a client with options', () => {
      const client = new Client(baseURL, 'v1', {
        apiKey,
        apiSecret,
        accountId,
      });
      expect(client).toBeInstanceOf(Client);
    });
  });

  describe('Account Methods', () => {
    it('should create an account', async () => {
      const mockResponse: AccountResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Test Account',
          features: [],
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.createAccount({ name: 'Test Account' });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-Key': apiKey,
            'X-Secret-Key': apiSecret,
          }),
        })
      );
    });

    it('should get an account', async () => {
      const mockResponse: AccountResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Test Account',
          features: [],
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.getAccount('1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should update an account', async () => {
      const mockResponse: AccountResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Renamed Account',
          features: [],
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.updateAccount('1', { name: 'Renamed Account' });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should get account AI usage', async () => {
      const mockResponse = {
        success: true,
        data: {
          accountId: 123,
          periodStart: '2025-01-01T00:00:00Z',
          nextResetDate: '2025-02-01T00:00:00Z',
          prompt: { limit: 1000, used: 50, remaining: 950 },
          classify: { limit: 1000, used: 40, remaining: 960 },
          estimatedCostUsd: 1.23,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.getAIUsage('123');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts/123/ai/usage'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'X-Account-ID': '123' }),
        })
      );
    });

    it('should add feature to account', async () => {
      const mockResponse = {
        success: true,
        data: { featureId: 1 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.addFeatureToAccount('1', { featureId: 1 });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts/1/feature'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should list features', async () => {
      const mockResponse: FeaturesResponse = {
        success: true,
        data: [
          {
            id: 1,
            name: 'feature-1',
            dateCreated: '2025-01-01T00:00:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.listFeatures();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/features'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Credential Methods', () => {
    it('should list credentials', async () => {
      const mockResponse: PaginatedCredentialsResponse = {
        success: true,
        data: {
          total: 1,
          offset: 0,
          limit: 10,
          credentials: [
            {
              id: 1,
              accountId: 123,
              archived: false,
              apiKey: 'mock-key',
              dateCreated: '2025-01-01T00:00:00Z',
              createdBy: 'user-1',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.listCredentials({
        limit: 10,
        offset: 0,
        orderBy: 'date_created',
        orderByDirection: 'desc',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/credentials?limit=10&offset=0&orderBy=date_created&orderByDirection=desc'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Account-ID': accountId,
          }),
        })
      );
    });

    it('should create a credential', async () => {
      const mockResponse: CredentialResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          archived: false,
          apiKey: 'new-key',
          plaintextSecret: 'new-plaintext-secret',
          dateCreated: '2025-01-01T00:00:00Z',
          createdBy: 'user-1',
          expiresAt: '2025-04-01T00:00:00Z',
          scopes: ['read', 'write', 'execute'],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.createCredential({
        createdBy: 'user-1',
        scopes: ['read', 'write', 'execute'],
      });

      expect(result).toEqual(mockResponse);
      expect(result.data.expiresAt).toBe('2025-04-01T00:00:00Z');
      expect(result.data.scopes).toEqual(['read', 'write', 'execute']);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/credentials'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            createdBy: 'user-1',
            scopes: ['read', 'write', 'execute'],
          }),
        })
      );
    });

    it('should get a credential', async () => {
      const mockResponse: CredentialResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          archived: false,
          apiKey: 'get-key',
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getCredential('1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/credentials/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should update a credential', async () => {
      const mockResponse: CredentialResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          archived: true,
          apiKey: 'updated-key',
          dateCreated: '2025-01-01T00:00:00Z',
          modifiedBy: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.updateCredential('1', {
        archived: true,
        modifiedBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/credentials/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ archived: true, modifiedBy: 'user-1' }),
        })
      );
    });

    it('should delete a credential', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.deleteCredential('1', { deletedBy: 'user-1' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/credentials/1'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ deletedBy: 'user-1' }),
        })
      );
    });

    it('should archive a credential', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.archiveCredential('1', { archivedBy: 'user-1' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/credentials/1/archive'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ archivedBy: 'user-1' }),
        })
      );
    });
  });

  describe('Execution Methods', () => {
    it('should list executions', async () => {
      const mockResponse: PaginatedExecutionsResponse = {
        success: true,
        data: {
          total: 1,
          offset: 0,
          limit: 10,
          executions: [
            {
              id: 1,
              accountId: 123,
              uniqueId: 'unique-1',
              state: 1,
              nodeId: 1,
              jobId: 1,
              lastExecutionDatetime: '2025-01-01T00:00:00Z',
              nextExecutionDatetime: '2025-01-02T00:00:00Z',
              jobQueueVersion: 1,
              executionVersion: 1,
              dateCreated: '2025-01-01T00:00:00Z',
              dateModified: '2025-01-01T00:00:00Z',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.listExecutions({
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executions'),
        expect.objectContaining({
          method: 'GET',
        })
      );
      // Verify query parameters are present (order doesn't matter)
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('startDate=2025-01-01T00%3A00%3A00Z');
      expect(url).toContain('endDate=2025-12-31T23%3A59%3A59Z');
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
    });

    it('should list executions with optional parameters', async () => {
      const mockResponse: PaginatedExecutionsResponse = {
        success: true,
        data: {
          total: 1,
          offset: 0,
          limit: 10,
          executions: [
            {
              id: 1,
              accountId: 123,
              uniqueId: 'unique-1',
              state: 1,
              nodeId: 1,
              jobId: 1,
              lastExecutionDatetime: '2025-01-01T00:00:00Z',
              nextExecutionDatetime: '2025-01-02T00:00:00Z',
              jobQueueVersion: 1,
              executionVersion: 1,
              dateCreated: '2025-01-01T00:00:00Z',
              dateModified: '2025-01-01T00:00:00Z',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.listExecutions({
        limit: 10,
        offset: 0,
        state: 'success',
        orderBy: 'dateCreated',
        orderDirection: 'DESC',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executions?limit=10&offset=0&state=success&orderBy=dateCreated&orderDirection=DESC'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should get date range analytics', async () => {
      const mockResponse: DateRangeAnalyticsAPIResponse = {
        success: true,
        data: {
          accountId: 123,
          timezone: 'UTC',
          startDate: '2025-01-01',
          startTime: '00:00:00',
          endDate: '2025-01-01',
          endTime: '23:59:59',
          points: [
            {
              date: '2025-01-01',
              time: '00:00:00',
              scheduled: 10,
              success: 8,
              failed: 2,
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getDateRangeAnalytics({
        startDate: '2025-01-01',
        startTime: '00:00:00',
        accountId: 123,
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executions/analytics?startDate=2025-01-01&startTime=00%3A00%3A00'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Account-ID': accountId,
          }),
        })
      );
    });

    it('should get execution totals', async () => {
      const mockResponse: ExecutionTotalsAPIResponse = {
        success: true,
        data: {
          accountId: 123,
          scheduled: 100,
          success: 80,
          failed: 20,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getExecutionTotals(123);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executions/totals'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Account-ID': '123',
          }),
        })
      );
    });

    it('should cleanup old execution logs', async () => {
      const mockResponse: CleanupOldLogsResponse = {
        success: true,
        data: {
          message: 'Old execution logs cleaned up successfully for account 123',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.cleanupOldExecutionLogs('123', 6);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executions/cleanup-old-logs'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Account-ID': '123',
          }),
          body: JSON.stringify({
            accountId: '123',
            retentionMonths: 6,
          }),
        })
      );
    });
  });

  describe('Executor Methods', () => {
    it('should list executors', async () => {
      const mockResponse: PaginatedExecutorsResponse = {
        success: true,
        data: {
          total: 1,
          offset: 0,
          limit: 10,
          executors: [
            {
              id: 1,
              accountId: 123,
              name: 'webhook-executor',
              type: 'webhook_url',
              webhookUrl: 'https://example.com/webhook',
              webhookMethod: 'POST',
              dateCreated: '2025-01-01T00:00:00Z',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.listExecutors({
        limit: 10,
        offset: 0,
        orderBy: 'date_created',
        orderByDirection: 'desc',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executors?limit=10&offset=0&orderBy=date_created&orderByDirection=desc'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create an executor', async () => {
      const mockResponse: ExecutorResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          name: 'webhook-executor',
          type: 'webhook_url',
          webhookUrl: 'https://example.com/webhook',
          webhookMethod: 'POST',
          webhookSecret: 'secret-key',
          dateCreated: '2025-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.createExecutor({
        name: 'webhook-executor',
        type: 'webhook_url',
        webhookUrl: 'https://example.com/webhook',
        webhookMethod: 'POST',
        webhookSecret: 'secret-key',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executors'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should get an executor', async () => {
      const mockResponse: ExecutorResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          name: 'get-executor',
          type: 'webhook_url',
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getExecutor('1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executors/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should update an executor', async () => {
      const mockResponse: ExecutorResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          name: 'updated-executor',
          type: 'webhook_url',
          dateCreated: '2025-01-01T00:00:00Z',
          modifiedBy: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.updateExecutor('1', {
        name: 'updated-executor',
        modifiedBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executors/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should delete an executor', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.deleteExecutor('1', { deletedBy: 'user-1' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executors/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should test-invoke an executor', async () => {
      const mockResponse = {
        success: true,
        data: {
          test: true,
          executorId: 1,
          executorType: 'webhook_url',
          success: true,
          startedAt: '2024-01-15T02:00:00Z',
          finishedAt: '2024-01-15T02:00:00.142Z',
          durationMs: 142,
          payload: { job: { spec: '0 2 * * *' }, lastExecutionStatus: 'scheduled' },
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.testInvokeExecutor('1', {
        job: { spec: '0 2 * * *', data: '{}', timezone: 'UTC', retryMax: 2 },
        age: '24h',
      });

      expect(result).toEqual(mockResponse);
      expect(result.data.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/executors/1/test-invoke'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Project Methods', () => {
    it('should list projects', async () => {
      const mockResponse: PaginatedProjectsResponse = {
        success: true,
        data: {
          total: 1,
          offset: 0,
          limit: 10,
          projects: [
            {
              id: 1,
              accountId: 123,
              name: 'Test Project',
              description: 'Test Description',
              dateCreated: '2025-01-01T00:00:00Z',
              createdBy: 'user-1',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.listProjects({
        limit: 10,
        offset: 0,
        orderBy: 'date_created',
        orderByDirection: 'desc',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/projects?limit=10&offset=0&orderBy=date_created&orderByDirection=desc'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create a project', async () => {
      const mockResponse: ProjectResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          name: 'New Project',
          description: 'New Description',
          dateCreated: '2025-01-01T00:00:00Z',
          createdBy: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.createProject({
        name: 'New Project',
        description: 'New Description',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/projects'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should get a project', async () => {
      const mockResponse: ProjectResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          name: 'Get Project',
          description: 'Get Description',
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getProject('1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/projects/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should update a project', async () => {
      const mockResponse: ProjectResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          name: 'Updated Project',
          description: 'Updated Description',
          dateCreated: '2025-01-01T00:00:00Z',
          modifiedBy: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      return client.updateProject('1', {
        description: 'Updated Description',
        modifiedBy: 'user-1',
      }).then((result) => {
        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/projects/1'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should delete a project', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.deleteProject('1', { deletedBy: 'user-1' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/projects/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Job Methods', () => {
    it('should list jobs', async () => {
      const mockResponse: PaginatedJobsResponse = {
        success: true,
        data: {
          total: 1,
          offset: 0,
          limit: 10,
          jobs: [
            {
              id: 1,
              accountId: 123,
              projectId: 1,
              timezone: 'UTC',
              data: 'job data',
              spec: '0 30 * * * *',
              dateCreated: '2025-01-01T00:00:00Z',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.listJobs({
        limit: 10,
        offset: 0,
        orderBy: 'date_created',
        orderByDirection: 'desc',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/jobs?limit=10&offset=0&orderBy=date_created&orderByDirection=desc'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create a job', async () => {
      const mockResponse: BatchJobResponse = {
        success: true,
        data: 'request-id-123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({
          'content-type': 'application/json',
          location: '/async-tasks/request-id-123',
        }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.createJob({
        projectId: 1,
        timezone: 'UTC',
        data: 'New Job',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T00:00:00Z',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/jobs'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should batch create jobs', async () => {
      const mockResponse: BatchJobResponse = {
        success: true,
        data: 'request-id-123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({
          'content-type': 'application/json',
          location: '/async-tasks/request-id-123',
        }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.batchCreateJobs([
        {
          projectId: 1,
          timezone: 'UTC',
          data: 'job 1',
          createdBy: 'user-1',
        },
        {
          projectId: 1,
          timezone: 'UTC',
          data: 'job 2',
          createdBy: 'user-1',
        },
      ]);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/jobs'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should get a job', async () => {
      const mockResponse: JobResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          projectId: 1,
          timezone: 'UTC',
          data: 'get job',
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getJob('1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/jobs/1'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should update a job', async () => {
      const mockResponse: JobResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          projectId: 1,
          timezone: 'UTC',
          data: 'updated job',
          dateCreated: '2025-01-01T00:00:00Z',
          modifiedBy: 'user-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.updateJob('1', {
        data: 'updated job',
        modifiedBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/jobs/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should delete a job', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.deleteJob('1', { deletedBy: 'user-1' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/jobs/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Async Task Methods', () => {
    it('should get an async task', async () => {
      const mockResponse: AsyncTaskResponse = {
        success: true,
        data: {
          id: 1,
          requestId: 'request-id-123',
          input: 'input',
          output: 'output',
          service: 'service',
          state: 2,
          dateCreated: '2025-01-01T00:00:00Z',
          accountId: 1,
          dateModified: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.getAsyncTask('request-id-123');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/async-tasks/request-id-123'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Healthcheck Methods', () => {
    it('should get healthcheck', async () => {
      const mockResponse: HealthcheckResponse = {
        success: true,
        data: {
          leaderAddress: '127.0.0.1:7070',
          leaderId: '1',
          raftStats: {
            applied_index: '162',
            commit_index: '162',
            fsm_pending: '0',
            last_contact: '0',
            last_log_index: '162',
            last_log_term: '7',
            last_snapshot_index: '55',
            last_snapshot_term: '5',
            latest_configuration: '[{Suffrage:Voter ID:1 Address:127.0.0.1:7070}]',
            latest_configuration_index: '0',
            num_peers: '0',
            protocol_version: '3',
            protocol_version_max: '3',
            protocol_version_min: '0',
            snapshot_version_max: '1',
            snapshot_version_min: '0',
            state: 'Leader',
            term: '7',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      const result = await client.healthcheck();

      expect(result).toEqual(mockResponse);
      expect(result.data.leaderAddress).toBe('127.0.0.1:7070');
      expect(result.data.raftStats.state).toBe('Leader');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/healthcheck'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('AI Prompt Methods', () => {
    it('should create job from prompt', async () => {
      const mockResult: PromptResult = {
        providers: [
          {
            provider: 'openai',
            model: 'gpt-4.1-mini',
            jobs: [
              {
                kind: 'REMINDER',
                purpose: 'reminder',
                subject: 'Weekly Report',
                cronExpression: '0 9 * * 1',
                timezone: 'America/New_York',
                recipients: ['team@example.com'],
              },
            ],
            inputTokens: 200,
            outputTokens: 80,
            totalTokens: 280,
            durationMs: 450,
          },
        ],
        classification: {
          text: 'Send weekly reports every Monday at 9 AM',
          decision: 'allow',
          reason: 'request_with_temporal_signal',
        },
      };

      const envelope = { success: true, data: mockResult };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => envelope,
        text: async () => JSON.stringify(envelope),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.createJobFromPrompt({
        prompt: 'Send weekly reports every Monday at 9 AM',
        timezone: 'America/New_York',
      });

      expect(result).toEqual(mockResult);
      expect(result.providers).toHaveLength(1);
      expect(result.classification?.decision).toBe('allow');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ai/prompt'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should classify a prompt', async () => {
      const mockClassification: IntentClassification = {
        text: 'What is Kubernetes?',
        decision: 'reject',
        reason: 'informational_question_not_schedule_request',
      };

      const envelope = { success: true, data: { classification: mockClassification } };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => envelope,
        text: async () => JSON.stringify(envelope),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.classifyPrompt({ prompt: 'What is Kubernetes?' });

      expect(result).toEqual(mockClassification);
      expect(result.decision).toBe('reject');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ai/prompt/classify'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Suggestions Methods', () => {
    it('should analyze a conversation for suggestions', async () => {
      const envelope = {
        success: true,
        data: {
          request_id: 'req_1',
          conversation_id: 'conv_123',
          suggestions: [{ id: 'sug_001', type: 'COMMITMENT', status: 'OPEN', confidence: 0.95 }],
          obligations: [{ id: 'obl_001', status: 'OPEN', suggestion_id: 'sug_001' }],
          warnings: [],
          engine: { engine_version: '1.0.0' },
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => envelope,
        text: async () => JSON.stringify(envelope),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.analyzeSuggestions({
        conversation_id: 'conv_123',
        messages: [
          { speaker: 'Victor', timestamp: '2026-07-17T10:00:00-04:00', message: "I'll send the proposal tomorrow." },
        ],
        options: { locale: 'en', default_timezone: 'America/Toronto' },
      });

      expect(result.conversation_id).toBe('conv_123');
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].type).toBe('COMMITMENT');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ai/suggestions/analyze'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should recommend send times', async () => {
      const envelope = {
        success: true,
        data: {
          request_id: 'req_1',
          reference_time: '2026-07-17T17:45:00-04:00',
          policy: { id: 'default_send_time', version: '1.0.0' },
          engine: { version: '1.0.0' },
          suggestions: [{ id: 'sts_001', send_at: '2026-07-20T12:00:00-04:00', label: 'Monday morning', score: 0.94, rank: 1 }],
          search: { candidates_generated: 143, candidates_scored: 16 },
          warnings: [],
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => envelope,
        text: async () => JSON.stringify(envelope),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      const result = await client.sendTimeSuggestions({
        sender: { id: 'user_123', timezone: 'America/Toronto' },
        recipients: [{ id: 'user_456', timezone: 'America/Los_Angeles', role: 'primary' }],
        message: { priority: 'normal' },
      });

      expect(result.request_id).toBe('req_1');
      expect(result.reference_time).toBe('2026-07-17T17:45:00-04:00');
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].id).toBe('sts_001');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ai/suggestions/time'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should schedule jobs from a prompt', async () => {
      const envelope = {
        success: true,
        data: {
          classification: { text: 'remind the team every monday', decision: 'allow', reason: 'request_with_temporal_signal' },
          project: { id: 7, accountId: 123, name: 'Team reminders', description: 'auto', dateCreated: '2026-07-17T00:00:00Z' },
          projectCreated: true,
          executor: { id: 3, accountId: 123, name: 'Email sender', description: 'sends email', tags: ['email'], type: 'webhook_url', dateCreated: '2026-07-17T00:00:00Z' },
          executorMatchedBy: 'llm',
          executorMatchReason: 'matches email channel',
          jobs: [{ id: 11, accountId: 123, projectId: 7, executorId: 3, spec: '0 9 * * 1', timezone: 'UTC', status: 'active', dateCreated: '2026-07-17T00:00:00Z' }],
          provider: 'openai',
          model: 'gpt-4',
        },
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => envelope,
        text: async () => JSON.stringify(envelope),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(baseURL, 'v1', apiKey, apiSecret, accountId);
      const result = await client.scheduleFromPrompt({
        prompt: 'Remind the team every Monday at 9am',
        channels: ['email'],
        createdBy: 'victor',
      });

      expect(result.project.id).toBe(7);
      expect(result.projectCreated).toBe(true);
      expect(result.executor.id).toBe(3);
      expect(result.executorMatchedBy).toBe('llm');
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].id).toBe(11);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ai/schedule'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should list prompt requests with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          requests: [
            {
              id: 1,
              account_id: 123,
              prompt: 'Remind me every Monday',
              provider: 'openai',
              model: 'gpt-4.1-mini',
              output: '{}',
              input_tokens: 100,
              output_tokens: 50,
              total_tokens: 150,
              duration_ms: 420,
              estimated_cost_usd: 0.0001,
              status: 'success',
              date_created: '2025-01-01T00:00:00Z',
            },
          ],
          total: 1,
          limit: 25,
          offset: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(baseURL, 'v1', apiKey, apiSecret, accountId);
      const result = await client.listPromptRequests({ provider: 'openai', status: 'success', limit: 25, offset: 0 });

      expect(result).toEqual(mockResponse);
      expect(result.data.requests[0].total_tokens).toBe(150);
      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/api/v1/ai/prompt-requests');
      expect(calledUrl).toContain('provider=openai');
      expect(calledUrl).toContain('status=success');
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );

      await expect(client.createAccount({ name: 'Test' })).rejects.toThrow(
        'API error: 400'
      );
    });

    it('should handle 401 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );

      await expect(client.getAccount('1')).rejects.toThrow('API error: 401');
    });

    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
        headers: new Headers(),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );

      await expect(client.getAccount('999')).rejects.toThrow('API error: 404');
    });
  });

  describe('Authentication', () => {
    it('should include API key headers', async () => {
      const mockResponse: AccountResponse = {
        success: true,
        data: {
          id: 1,
          name: 'Test',
          features: [],
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClient(baseURL, 'v1', apiKey, apiSecret);
      await client.getAccount('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': apiKey,
            'X-Secret-Key': apiSecret,
          }),
        })
      );
    });

    it('should include basic auth headers', async () => {
      const mockResponse: HealthcheckResponse = {
        success: true,
        data: {
          leaderAddress: '127.0.0.1:7070',
          leaderId: '1',
          raftStats: {
            applied_index: '162',
            commit_index: '162',
            fsm_pending: '0',
            last_contact: '0',
            last_log_index: '162',
            last_log_term: '7',
            last_snapshot_index: '55',
            last_snapshot_term: '5',
            latest_configuration: '[]',
            latest_configuration_index: '0',
            num_peers: '0',
            protocol_version: '3',
            protocol_version_max: '3',
            protocol_version_min: '0',
            snapshot_version_max: '1',
            snapshot_version_min: '0',
            state: 'Leader',
            term: '7',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newBasicAuthClient(baseURL, 'v1', 'username', 'password');
      await client.healthcheck();

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers['Authorization']).toContain('Basic');
      expect(headers['X-Peer']).toBe('cmd');
    });

    it('should include account ID header when set', async () => {
      const mockResponse: CredentialResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 123,
          archived: false,
          apiKey: 'key',
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.getCredential('1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Account-ID': accountId,
          }),
        })
      );
    });

    it('should allow account ID override', async () => {
      const mockResponse: CredentialResponse = {
        success: true,
        data: {
          id: 1,
          accountId: 456,
          archived: false,
          apiKey: 'key',
          dateCreated: '2025-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(
        baseURL,
        'v1',
        apiKey,
        apiSecret,
        accountId
      );
      await client.getCredential('1', '456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Account-ID': '456',
          }),
        })
      );
    });
  });

  describe('Local Executor Methods', () => {
    it('should register a local executor', async () => {
      const mockResponse: LocalExecutorRegisterResponse = {
        success: true,
        data: { id: 42 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(baseURL, 'v1', apiKey, apiSecret, accountId);
      const result = await client.registerLocalExecutor({
        name: 'My Local Executor',
        command: '/usr/local/bin/process-job.sh',
        workingDir: '/home/deploy/app',
        createdBy: 'user-1',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/local-executors'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should pull jobs for a local executor', async () => {
      const mockResponse: LocalExecutorJobsResponse = {
        success: true,
        data: [
          {
            id: 1,
            accountId: 123,
            projectId: 456,
            executorId: 42,
            spec: '* * * * *',
            timezone: 'UTC',
            dateCreated: '2025-01-01T00:00:00Z',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(baseURL, 'v1', apiKey, apiSecret, accountId);
      const result = await client.pullLocalExecutorJobs(42);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/local-executors/42/jobs'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should report local executions', async () => {
      const mockResponse: ReportLocalExecutionsResponse = {
        success: true,
        data: { committed: 2 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const client = Client.newAPIClientWithAccount(baseURL, 'v1', apiKey, apiSecret, accountId);
      const result = await client.reportLocalExecutions(42, [
        {
          jobId: 1,
          uniqueId: 'exec-1',
          state: 1,
          lastExecutionTime: '2025-01-01T00:00:00Z',
          nextExecutionTime: '2025-01-02T00:00:00Z',
          executionVersion: 5,
          jobQueueVersion: 2,
        },
        {
          jobId: 2,
          uniqueId: 'exec-2',
          state: 2,
        },
      ]);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/local-executors/42/executions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify([
            {
              jobId: 1,
              uniqueId: 'exec-1',
              state: 1,
              lastExecutionTime: '2025-01-01T00:00:00Z',
              nextExecutionTime: '2025-01-02T00:00:00Z',
              executionVersion: 5,
              jobQueueVersion: 2,
            },
            { jobId: 2, uniqueId: 'exec-2', state: 2 },
          ]),
        })
      );
    });
  });
});

