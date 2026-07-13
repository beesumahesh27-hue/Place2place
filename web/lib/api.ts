const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type FetchOptions = RequestInit & { token?: string };

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(init.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Request failed");
  return data.data as T;
}

export const api = {
  get:    <T>(path: string, token?: string)                    => request<T>(path, { method: "GET", token }),
  post:   <T>(path: string, body: unknown, token?: string)     => request<T>(path, { method: "POST",  body: JSON.stringify(body), token }),
  put:    <T>(path: string, body: unknown, token?: string)     => request<T>(path, { method: "PUT",   body: JSON.stringify(body), token }),
  delete: <T>(path: string, token?: string)                    => request<T>(path, { method: "DELETE", token }),
  upload: <T>(path: string, form: FormData, token?: string)    => request<T>(path, { method: "POST",  body: form, token }),
  uploadPut: <T>(path: string, form: FormData, token?: string) => request<T>(path, { method: "PUT",   body: form, token }),
};
