const WHATSAPP_API_BASE = 'https://graph.facebook.com/v18.0'

export function isWhatsAppConfigured(): boolean {
    return !!(
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID
    )
}

export function getWhatsAppConfig() {
    return {
        configured: isWhatsAppConfigured(),
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        maskedToken: process.env.WHATSAPP_ACCESS_TOKEN
            ? `****${process.env.WHATSAPP_ACCESS_TOKEN.slice(-4)}`
            : '',
    }
}

function formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = `91${cleaned}`
    }
    return cleaned
}

type WhatsAppResult = {
    success: boolean
    messageId?: string
    error?: string
}

async function callWhatsAppAPI(
    body: Record<string, any>,
    accessToken?: string,
    phoneNumberId?: string
): Promise<WhatsAppResult> {
    const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneId) {
        return { success: false, error: 'WhatsApp API not configured' }
    }

    const url = `${WHATSAPP_API_BASE}/${phoneId}/messages`

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await res.json()

        if (!res.ok) {
            const errMsg = data?.error?.message || `HTTP ${res.status}`
            console.error('WhatsApp API error:', errMsg)
            return { success: false, error: errMsg }
        }

        const messageId = data?.messages?.[0]?.id
        return { success: true, messageId }
    } catch (err: any) {
        console.error('WhatsApp API request failed:', err)
        return { success: false, error: err.message || String(err) }
    }
}

export async function sendWhatsAppMessage(
    phone: string,
    message: string,
    accessToken?: string,
    phoneNumberId?: string
): Promise<WhatsAppResult> {
    return callWhatsAppAPI({
        messaging_product: 'whatsapp',
        to: formatPhoneNumber(phone),
        type: 'text',
        text: { body: message },
    }, accessToken, phoneNumberId)
}

export async function sendWhatsAppTemplate(
    phone: string,
    templateName: string,
    language: string,
    components?: any[],
    accessToken?: string,
    phoneNumberId?: string
): Promise<WhatsAppResult> {
    const template: Record<string, any> = {
        name: templateName,
        language: { code: language },
    }
    if (components?.length) {
        template.components = components
    }

    return callWhatsAppAPI({
        messaging_product: 'whatsapp',
        to: formatPhoneNumber(phone),
        type: 'template',
        template,
    }, accessToken, phoneNumberId)
}
