
'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
}

import { signOut } from "@/lib/auth"

export async function handleSignOut(redirectTo: string = '/login') {
    await signOut({ redirectTo })
}

export async function authenticateScout(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('scout-credentials', formData)
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
