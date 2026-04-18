/** In-memory JWT token store. */
let _token: string | null = null;

export function setToken(token: string): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

/**
 * Thin fetch wrapper that attaches the Authorization header and
 * throws a descriptive error on non-2xx responses.
 *
 * @param path  Relative URL path (e.g. '/api/auth/line')
 * @param init  Optional fetch RequestInit overrides
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      // Ignore JSON parse errors; keep the default message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
