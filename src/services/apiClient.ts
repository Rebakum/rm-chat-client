const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  }
  return process.env.API_BASE_URL || 'http://localhost:5000/api';
};

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
  errorMessages?: Array<{
    path: string;
    message: string;
  }>;
}

class ApiError extends Error {
  statusCode: number;
  errorMessages: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    statusCode: number,
    errorMessages: Array<{ path: string; message: string }> = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorMessages = errorMessages;
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${getBaseUrl()}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  const response = await fetch(url, config);
  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      response.status,
      data.errorMessages || []
    );
  }

  // The backend labels its pager "pagination"; the client reads "meta".
  // Mirror it so pagination.total works on every paginated endpoint.
  if (data.pagination && !data.meta) {
    data.meta = {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.totalPages,
      hasMore: data.pagination.hasMore,
      nextCursor: data.pagination.nextCursor,
    };
  }

  return data;
}

async function requestForm<T>(endpoint: string, body: FormData): Promise<ApiResponse<T>> {
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  const data: ApiResponse<T> = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || 'An error occurred', response.status, data.errorMessages || []);
  }
  return data;
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  postForm: <T>(endpoint: string, body: FormData) => requestForm<T>(endpoint, body),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse };