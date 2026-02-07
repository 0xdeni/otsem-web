import { NextResponse, type NextRequest } from 'next/server';

// JWT payload decoder (no verification — verification happens on the API)
function decodeJwtPayload(token: string): { sub: string; role: string; exp: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.sub || !payload.role || !payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

// UUID v4 format check
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Read token from localStorage-backed cookie or Authorization header
    // Since localStorage is client-only, we read from the cookie that the
    // HTTP client sets, or fall back to checking if the path is protected.
    const token =
        request.cookies.get('access_token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    const payload = token ? decodeJwtPayload(token) : null;
    const isExpired = payload ? payload.exp < Math.floor(Date.now() / 1000) : true;
    const isAuthenticated = !!payload && !isExpired;

    // --- Protected customer routes ---
    if (pathname.startsWith('/customer')) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', pathname);
            return NextResponse.redirect(loginUrl);
        }
        if (payload?.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    // --- Protected admin routes ---
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/admin-login', request.url));
        }
        if (payload?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/customer/dashboard', request.url));
        }
    }

    // --- Validate dynamic [id] route params are UUID format ---
    const idRouteMatch = pathname.match(/\/(?:admin|customer)\/[^/]+\/([^/]+)/);
    if (idRouteMatch) {
        const idParam = idRouteMatch[1];
        // Only validate if it looks like it should be a UUID (skip known sub-paths)
        const knownSubPaths = ['new', 'add-pix', 'settings', 'dashboard'];
        if (!knownSubPaths.includes(idParam) && idParam.length > 8 && !UUID_RE.test(idParam)) {
            return NextResponse.json({ error: 'Invalid resource ID format' }, { status: 400 });
        }
    }

    // --- Security: prevent redirect to authenticated routes if already logged in ---
    if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
        const dashPath = payload?.role === 'ADMIN' ? '/admin/dashboard' : '/customer/dashboard';
        return NextResponse.redirect(new URL(dashPath, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/customer/:path*',
        '/admin/:path*',
        '/login',
        '/register',
    ],
};
