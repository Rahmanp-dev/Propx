'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function logScoutVisit(formData: FormData) {
    const session = await auth()
    if (!session || session.user?.role !== 'SCOUT') {
        throw new Error('Unauthorized')
    }

    const scoutId = session.user.id
    const buildingName = formData.get('buildingName') as string
    const ownerName = formData.get('ownerName') as string
    const ownerPhone = formData.get('ownerPhone') as string
    const notes = formData.get('notes') as string | null

    if (!buildingName || !ownerName || !ownerPhone) {
        throw new Error('Missing required fields')
    }

    await prisma.scoutLead.create({
        data: {
            scoutId,
            buildingName,
            ownerName,
            ownerPhone,
            notes,
            status: 'PENDING'
        }
    })

    revalidatePath('/scout-portal/dashboard')
    redirect('/scout-portal/dashboard')
}
