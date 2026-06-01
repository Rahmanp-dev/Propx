'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

const COOKIE_NAME = 'propx_tenant_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

// Use NEXTAUTH_SECRET or AUTH_SECRET for encryption, fallback for dev
const ENCRYPTION_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development_only_123456789'
// Ensure the secret is exactly 32 bytes for AES-256
const secretKey = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest()

interface TenantSession {
    tenantId: string
    phone: string
    name: string
    exp: number
}

function encryptSession(session: TenantSession): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv)
    let encrypted = cipher.update(JSON.stringify(session), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

function decryptSession(encryptedValue: string): TenantSession | null {
    try {
        const parts = encryptedValue.split(':')
        if (parts.length !== 3) return null

        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]

        const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, iv)
        decipher.setAuthTag(authTag)
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        
        return JSON.parse(decrypted) as TenantSession
    } catch {
        return null
    }
}

export async function loginTenant(
    phone: string,
    pin: string
): Promise<{ success: boolean; tenantId?: string; error?: string }> {
    try {
        const cleaned = phone.replace(/[\s\-\(\)+]/g, '')
        const searchPhone = cleaned.startsWith('91') ? cleaned.substring(2) : cleaned

        if (!pin || pin.length !== 4) {
            return { success: false, error: 'Please enter a valid 4-digit PIN' }
        }

        const tenant = await prisma.tenant.findFirst({
            where: {
                phone: { contains: searchPhone },
                isActive: true,
            },
            select: { id: true, phone: true, fullName: true, tenantPin: true },
        })

        if (!tenant || !tenant.tenantPin) {
            return { success: false, error: 'No active tenant found or PIN not setup' }
        }

        if (pin !== tenant.tenantPin) {
            return { success: false, error: 'Invalid PIN. Please check with your landlord.' }
        }

        // Set session cookie
        const session: TenantSession = {
            tenantId: tenant.id,
            phone: tenant.phone,
            name: tenant.fullName,
            exp: Date.now() + SESSION_MAX_AGE * 1000
        }

        const encryptedSessionValue = encryptSession(session)

        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, encryptedSessionValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE,
            path: '/',
        })

        return { success: true, tenantId: tenant.id }
    } catch (error: any) {
        return { success: false, error: error.message || 'Login failed' }
    }
}

export async function getTenantSession(): Promise<TenantSession | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(COOKIE_NAME)
        if (!sessionCookie?.value) return null
        
        const session = decryptSession(sessionCookie.value)
        if (!session || session.exp < Date.now()) return null

        return session
    } catch {
        return null
    }
}

export async function logoutTenant(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
