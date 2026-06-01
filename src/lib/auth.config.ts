
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
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            // Protect super-admin routes
            if (nextUrl.pathname.startsWith('/super-admin')) {
                if (!isLoggedIn) return false;
                // @ts-ignore
                const role = auth?.user?.role;
                if (role !== 'SUPER_ADMIN') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
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
