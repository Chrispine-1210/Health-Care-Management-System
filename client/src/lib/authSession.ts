import type { User } from "@shared/schema";
import { getDefaultRouteForRole } from "@shared/roleCapabilities";
import { queryClient } from "@/lib/queryClient";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_REFRESH_TOKEN_KEY = "auth_refresh_token";
const AUTH_USER_QUERY_PREFIX = ["auth", "user"] as const;

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
}

export function getAuthUserQueryKey(token?: string | null) {
  return [...AUTH_USER_QUERY_PREFIX, token ?? "anonymous"] as const;
}

export function storeAuthenticatedSession(params: {
  token: string;
  refreshToken?: string | null;
  user?: User | null;
}) {
  const { token, refreshToken, user } = params;

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }

  queryClient.removeQueries({ queryKey: AUTH_USER_QUERY_PREFIX });
  if (user) {
    queryClient.setQueryData(getAuthUserQueryKey(token), user);
  }
}

export function clearAuthenticatedSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  queryClient.removeQueries({ queryKey: AUTH_USER_QUERY_PREFIX });
}

export function getPostLoginRoute(role?: string | null) {
  return getDefaultRouteForRole(role);
}
