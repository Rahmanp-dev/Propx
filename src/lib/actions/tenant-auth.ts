'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function authenticateTenant(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const phone = formData.get('phone') as string
        const pin = formData.get('pin') as string

        await signIn('tenant-credentials', {
            phone,
            pin,
            redirectTo: '/tenant-portal/dashboard',
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid phone number or PIN.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}
