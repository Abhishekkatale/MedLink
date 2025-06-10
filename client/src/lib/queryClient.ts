import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  token?: string | null, // Add token parameter
): Promise<Response> {
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    // credentials: "include", // Typically not needed when using token-based auth
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      // credentials: "include", // Typically not needed when using token-based auth
    });

    if (res.status === 401 || res.status === 403) {
      // Token is invalid or expired.
      // Trigger a logout. A simple way is to dispatch a custom event that AuthContext listens to.
      // Or, for now, we can let the error be thrown and handled by useQuery's onError.
      // The global logout will be refined in AuthContext part.
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // This specific 'returnNull' behavior for 401 might need re-evaluation
        // in context of global logout. For now, keeping original logic if specified.
        return null;
      }
      // For 'throw' behavior, or any other 401/403, let throwIfResNotOk handle it.
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }), // Default on401 behavior is to throw
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Consider adjusting staleTime based on application needs
      retry: false,
      onError: (error: any) => { // Global error handler for queries
        if (error && (error.message?.startsWith('401') || error.message?.startsWith('403'))) {
          console.error("Global query error handler detected auth error:", error);
          window.dispatchEvent(new CustomEvent('auth-error'));
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => { // Global error handler for mutations
        if (error && (error.message?.startsWith('401') || error.message?.startsWith('403'))) {
          console.error("Global mutation error handler detected auth error:", error);
          window.dispatchEvent(new CustomEvent('auth-error'));
        }
      },
    },
  },
});
