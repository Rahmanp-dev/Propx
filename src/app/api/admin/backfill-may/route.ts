import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';

export async function GET(request: Request) {
    try {
        const client = await clientPromise;
        const db = client.db('propx'); // using 'propx' to match Native driver DB

        const tenants = await db.collection('Tenant').find({ isActive: true }).toArray();
        let backfilled = 0;

        for (const tenant of tenants) {
            if (!tenant.leaseStartDate || !tenant.assignedFlatId) continue;

            const leaseStart = new Date(tenant.leaseStartDate);
            // Use UTC Date for the month to match Vercel's timezone expectation
            const paymentMonth = new Date(Date.UTC(leaseStart.getFullYear(), leaseStart.getMonth(), 1));

            const existingPayment = await db.collection('Payment').findOne({
                tenantId: tenant._id,
                month: paymentMonth
            });

            if (!existingPayment) {
                const flat = await db.collection('Flat').findOne({ _id: tenant.assignedFlatId });
                if (!flat) continue;

                const rentDue = flat.rentAmount || 0;
                const maintenanceDue = flat.maintenanceAmount || 0;
                const totalDue = rentDue + maintenanceDue;
                const now = new Date();

                await db.collection('Payment').insertOne({
                    flatId: flat._id,
                    tenantId: tenant._id,
                    month: paymentMonth,
                    rentDue,
                    maintenanceDue,
                    electricityDue: 0,
                    arrears: 0,
                    customDues: 0,
                    totalDue,
                    balance: totalDue,
                    status: 'PENDING',
                    amountPaid: 0,
                    createdAt: now,
                    updatedAt: now
                });
                backfilled++;
            }
        }
        
        return NextResponse.json({ success: true, message: `Successfully backfilled ${backfilled} missing initial payments.` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
