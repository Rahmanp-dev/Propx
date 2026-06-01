
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    // 1. Check Hardcoded Admin Env Vars First
                    if (
                        process.env.ADMIN_EMAIL &&
                        process.env.ADMIN_PASSWORD &&
                        email === process.env.ADMIN_EMAIL &&
                        password === process.env.ADMIN_PASSWORD
                    ) {
                        return {
                            id: "admin-env-var",
                            name: "Platform Admin",
                            email: email,
                            role: "SUPER_ADMIN",
                            organizationId: null,
                        } as any;
                    }

                    // 2. Fallback to Database for other users
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            organizationId: user.organizationId,
                        } as any;
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
