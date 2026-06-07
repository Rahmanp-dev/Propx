
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
            const isTenantLogin = nextUrl.pathname === '/tenant-portal/login';
            const isTenantProtectedRoute = nextUrl.pathname.startsWith('/tenant-portal') && !isTenantLogin;
            const isPublicRoute =
                isOnLogin ||
                isOnRegister ||
                nextUrl.pathname.startsWith('/api/auth') ||
                nextUrl.pathname.startsWith('/api/webhook') ||
                nextUrl.pathname.startsWith('/api/upload') ||
                isTenantLogin ||
                nextUrl.pathname.startsWith('/pay') ||
                nextUrl.pathname.startsWith('/inquiry') ||
                nextUrl.pathname.startsWith('/packages') ||
                nextUrl.pathname.startsWith('/discover') ||
                nextUrl.pathname === '/';

            if (isPublicRoute) {
                if ((isOnLogin || isTenantLogin) && isLoggedIn) {
                    // @ts-ignore
                    const role = auth?.user?.role;
                    if (role === 'TENANT') {
                        return Response.redirect(new URL('/tenant-portal/dashboard', nextUrl));
                    }
                    if (role === 'SUPER_ADMIN') {
                        return Response.redirect(new URL('/super-admin/dashboard', nextUrl));
                    }
                    const userId = auth?.user?.id || 'user';
                    return Response.redirect(new URL(`/${userId}/dashboard`, nextUrl));
                }
                return true;
            }

            // Protect tenant routes
            if (isTenantProtectedRoute) {
                if (!isLoggedIn) return Response.redirect(new URL('/tenant-portal/login', nextUrl));
                // @ts-ignore
                const role = auth?.user?.role;
                if (role !== 'TENANT') {
                    // Logged in as owner but trying to access tenant portal
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
                // @ts-ignore
                if (auth?.user?.role === 'SUPER_ADMIN') {
                    return Response.redirect(new URL('/super-admin/dashboard', nextUrl));
                }
                const userId = auth?.user?.id || 'user';
                return Response.redirect(new URL(`/${userId}/dashboard`, nextUrl));
            }

            if (!isLoggedIn) {
                return false;
            }

            // @ts-ignore
            const role = auth?.user?.role;
            if (role === 'TENANT') {
                return Response.redirect(new URL('/tenant-portal/dashboard', nextUrl));
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
                // @ts-ignore
                session.user.flatId = token.flatId ?? null;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.organizationId = user.organizationId ?? null;
                // @ts-ignore
                token.flatId = user.flatId ?? null;
            }
            return token;
        }
    },
    providers: [],
} satisfies NextAuthConfig;
