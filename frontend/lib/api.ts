const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  removeCookie('accessToken');
}

async function tryRefresh(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('Refresh failed');

  const data = await res.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  setCookie('accessToken', data.accessToken);
  return data.accessToken;
}

async function request<T>(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const authToken = token ?? getStoredToken();
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !path.includes('/auth/')) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
              .then((r) => {
                if (!r.ok) throw new Error(`Request failed with status ${r.status}`);
                return r.json();
              })
              .then(resolve)
              .catch(reject);
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await tryRefresh();
      processQueue(null, newToken);
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retryRes.ok) {
        let message = `Request failed with status ${retryRes.status}`;
        try {
          const errorBody = await retryRes.json();
          const raw = errorBody.message;
          if (typeof raw === 'string') message = raw;
          else if (Array.isArray(raw)) message = raw.join('. ');
        } catch {}
        throw new Error(message);
      }
      return retryRes.json() as Promise<T>;
    } catch (err) {
      processQueue(err, null);
      clearAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const errorBody = await res.json();
      const raw = errorBody.message;
      if (typeof raw === 'string') message = raw;
      else if (Array.isArray(raw)) message = raw.join('. ');
      else if (raw?.message && Array.isArray(raw.message)) message = raw.message.join('. ');
      else if (raw?.message && typeof raw.message === 'string') message = raw.message;
    } catch {}
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>('GET', path, token),
  post: <T>(path: string, body?: unknown, token?: string) => request<T>('POST', path, token, body),
  put: <T>(path: string, body?: unknown, token?: string) => request<T>('PUT', path, token, body),
  patch: <T>(path: string, body?: unknown, token?: string) => request<T>('PATCH', path, token, body),
  delete: <T>(path: string, token?: string) => request<T>('DELETE', path, token),
};
