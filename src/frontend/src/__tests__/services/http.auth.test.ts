import { ApiError, http, setOnAuthFailure } from '@/services/http';
import { AuthService } from '@/services/authService';

jest.mock('@/services/authService', () => ({
  AuthService: {
    refreshToken: jest.fn(),
  },
}));

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

function createMockResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('http auth lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setOnAuthFailure(() => undefined);
  });

  it('single-flight: concurrent 401 responses trigger only one refresh request', async () => {
    localStorage.setItem('vp_access_token', 'old-access-token');
    localStorage.setItem('vp_refresh_token', 'refresh-token');

    mockAuthService.refreshToken.mockResolvedValue({
      token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(200, { data: { id: 1 } }))
      .mockResolvedValueOnce(createMockResponse(200, { data: { id: 2 } }));

    global.fetch = fetchMock as unknown as typeof fetch;

    const [first, second] = await Promise.all([http.get('/secure-a'), http.get('/secure-b')]);

    expect(first).toEqual({ id: 1 });
    expect(second).toEqual({ id: 2 });
    expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('retries original request once after successful refresh and returns data', async () => {
    localStorage.setItem('vp_access_token', 'old-access-token');
    localStorage.setItem('vp_refresh_token', 'refresh-token');

    mockAuthService.refreshToken.mockResolvedValue({ token: 'new-access-token' });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(200, { data: { ok: true } }));

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await http.get('/secure-resource');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryHeaders = fetchMock.mock.calls[1][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new-access-token');
  });

  it('failed refresh clears vp_access_token/vp_refresh_token and triggers auth-failure callback', async () => {
    localStorage.setItem('vp_access_token', 'old-access-token');
    localStorage.setItem('vp_refresh_token', 'refresh-token');

    const onAuthFailure = jest.fn();
    setOnAuthFailure(onAuthFailure);

    mockAuthService.refreshToken.mockRejectedValue(new Error('refresh failed'));

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } })) as unknown as typeof fetch;

    await expect(http.get('/secure-resource')).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem('vp_access_token')).toBeNull();
    expect(localStorage.getItem('vp_refresh_token')).toBeNull();
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });
});
