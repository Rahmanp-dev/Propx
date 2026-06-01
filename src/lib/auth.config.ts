
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname === '/login';
            const isOnRegister = nextUrl.pathname.startsWith('/register');
            const isPublicRoute =
                isOnLogin ||
                isOnRegister ||
                nextUrl.pathname.startsWith('/api/auth') ||
                nextUrl.pathname.startsWith('/api/webhook') ||
                nextUrl.pathname.startsWith('/api/upload') ||
                nextUrl.pathname.startsWith('/tenant-portal') ||
                nextUrl.pathname.startsWith('/pay') ||
                nextUrl.pathname.startsWith('/inquiry') ||
                nextUrl.pathname === '/';

            if (isPublicRoute) {
                if (isOnLogin && isLoggedIn) {
                    // @ts-ignore
                    const role = auth?.user?.role;
                    if (role === 'SUPER_ADMIN') {
                        return Response.redirect(new URL('/super-admin/dashboard', nextUrl));
                    }
                    const userId = auth?.user?.id || 'user';
                    return Response.redirect(new URL(`/${userId}/dashboard`, nextUrl));
                }
                return true;
            }

            // Protect super-admin routes
            if (nextUrl.pathname.startsWith('/super-admin')) {
                if (!isLoggedIn) return false;
                // @ts-ignore
                const role = auth?.user?.role;
                if (role !== 'SUPER_ADMIN') {
                    const userId = auth?.user?.id || 'user';
                    return Response.redirect(new URL(`/${userId}/dashboard`, nextUrl));
                }
                return true;
            }

            // Intercept direct hits to /dashboard and redirect to user-specific dashboard
            if (nextUrl.pathname === '/dashboard' && isLoggedIn) {
                const userId = auth?.user?.id || 'user';
                return Response.redirect(new URL(`/${userId}/dashboard`, nextUrl));
            }

            if (!isLoggedIn) {
                return false;
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role;
            }
            if (session.user) {
                // @ts-ignore
                session.user.organizationId = token.organizationId ?? null;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.organizationId = user.organizationId ?? null;
            }
            return token;
        }
    },
    providers: [],
} satisfies NextAuthConfig;
