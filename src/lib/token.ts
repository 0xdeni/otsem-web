// src/lib/token.ts
const ACCESS_TOKEN_KEY = '@otsem:access_token';
const REFRESH_TOKEN_KEY = '@otsem:refresh_token';
const COOKIE_NAME = 'access_token';

function setCookie(name: string, value: string, maxAge: number): void {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax;Secure`;
}

function deleteCookie(name: string): void {
    document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax;Secure`;
}

export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Sync to cookie so Next.js middleware can read the token server-side
    setCookie(COOKIE_NAME, accessToken, 7 * 24 * 60 * 60);
}

export function clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('@otsem:user');
    deleteCookie(COOKIE_NAME);
}

export function hasValidToken(): boolean {
    const token = getAccessToken();
    return !!token;
}
