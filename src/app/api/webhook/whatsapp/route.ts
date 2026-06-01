import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongo'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'propx-whatsapp-webhook-2026'

// GET — Meta webhook verification challenge
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST — Receive delivery status updates
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const entry = body?.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value

        // Handle delivery status updates
        if (value?.statuses?.[0]) {
            const status = value.statuses[0]
            const waMessageId = status.id
            const newStatus = status.status?.toUpperCase() // sent, delivered, read, failed

            if (waMessageId && newStatus) {
                const validStatuses = ['SENT', 'DELIVERED', 'READ', 'FAILED']
                if (validStatuses.includes(newStatus)) {
                    const client = await clientPromise
                    const db = client.db('propx')

                    // Update all matching logs (there might be retries)
                    await db.collection('WhatsAppLog').updateMany(
                        { 'messageId': waMessageId },
                        {
                            $set: {
                                status: newStatus,
                                ...(newStatus === 'SENT' ? { sentAt: new Date() } : {}),
                                ...(newStatus === 'FAILED' ? { error: status.errors?.[0]?.title || 'Delivery failed' } : {}),
                            }
                        }
                    )
                }
            }
        }

        // Always return 200 (Meta requires it)
        return NextResponse.json({ status: 'ok' }, { status: 200 })
    } catch (err) {
        console.error('WhatsApp webhook error:', err)
        return NextResponse.json({ status: 'ok' }, { status: 200 })
    }
}
