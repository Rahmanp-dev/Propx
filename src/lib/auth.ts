
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
            id: 'credentials',
            async authorize(credentials) {
                console.log("AUTHORIZE CALLED WITH:", credentials);
                const parsedCredentials = z
                    .object({ email: z.string().trim().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                console.log("PARSED CREDENTIALS:", parsedCredentials);

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
                    let user;
                    try {
                        user = await prisma.user.findUnique({ where: { email } });
                    } catch (error) {
                        console.error('Database connection error:', error);
                        throw new Error('Database Connection Failed');
                    }
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
        Credentials({
            id: 'tenant-credentials',
            name: 'Tenant Login',
            credentials: {
                phone: { label: "Phone", type: "text" },
                pin: { label: "PIN", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ phone: z.string().min(10), pin: z.string().min(4) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { phone, pin } = parsedCredentials.data;

                    const tenant = await prisma.tenant.findFirst({ 
                        where: { phone, isActive: true },
                        include: { flat: { include: { building: true } } }
                    });
                    if (!tenant) return null;

                    const expectedPin = tenant.tenantPin || tenant.phone.slice(-4);
                    if (pin !== expectedPin) return null;

                    return {
                        id: tenant.id,
                        name: tenant.fullName,
                        phone: tenant.phone,
                        role: "TENANT",
                        flatId: tenant.assignedFlatId,
                        organizationId: tenant.flat?.building?.organizationId
                    } as any;
                }

                console.log('Invalid tenant credentials');
                return null;
            },
        }),
        Credentials({
            id: 'scout-credentials',
            name: 'Scout Login',
            credentials: {
                phone: { label: "Phone", type: "text" },
                pin: { label: "PIN", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ phone: z.string().min(10), pin: z.string().min(4) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { phone, pin } = parsedCredentials.data;

                    const scout = await prisma.scout.findUnique({ 
                        where: { phone }
                    });
                    
                    if (!scout || !scout.isActive) return null;

                    if (pin !== scout.pin) return null;

                    return {
                        id: scout.id,
                        name: scout.name,
                        phone: scout.phone,
                        role: "SCOUT"
                    } as any;
                }

                console.log('Invalid scout credentials');
                return null;
            }
        })
    ],
});
