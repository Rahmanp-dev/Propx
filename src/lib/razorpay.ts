/**
 * Razorpay Payment Gateway Client
 * DEPRECATED: PropX now uses UPI-first payments with screenshot verification.
 * This module is kept for backward compatibility but returns null by default.
 * Install 'razorpay' package if you want to re-enable Razorpay gateway.
 */

export function isRazorpayConfigured(): boolean {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export async function getRazorpayClient(): Promise<any> {
    if (!isRazorpayConfigured()) return null

    try {
        // Dynamic import — only works if razorpay package is installed
        const mod = await (Function('return import("razorpay")')() as Promise<any>)
        const Razorpay = mod.default
        return new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })
    } catch {
        console.warn('Razorpay package not installed. UPI-first payments are the default.')
        return null
    }
}

export async function verifyRazorpaySignature(body: string, signature: string): Promise<boolean> {
    const crypto = await import('crypto')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) return false

    const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

    return expected === signature
}
