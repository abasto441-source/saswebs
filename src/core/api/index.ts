export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export async function fetchEdgeApi<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const response = await fetch(endpoint, { method, headers, body });
  if (!response.ok) {
    throw new Error(`Edge API error: ${response.statusText} (${response.status})`);
  }
  return response.json() as Promise<T>;
}
