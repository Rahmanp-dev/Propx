import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongo';

export async function GET(request: Request) {
    try {
        const client = await clientPromise;
        const db = client.db('propx'); 

        const juneMonth = new Date(Date.UTC(2026, 5, 1)); // June 1, 2026 UTC
        const mayMonth = new Date(Date.UTC(2026, 4, 1));  // May 1, 2026 UTC

        // 1. Delete all June payments
        const deleteResult = await db.collection('Payment').deleteMany({
            month: juneMonth
        });

        // 2. Ensure every active tenant has a May payment
        const tenants = await db.collection('Tenant').find({ isActive: true }).toArray();
        let mayBackfilled = 0;

        for (const tenant of tenants) {
            if (!tenant.leaseStartDate || !tenant.assignedFlatId) continue;

            const leaseStart = new Date(tenant.leaseStartDate);
            
            // If they moved in on or after June 1, they don't get a May bill
            if (leaseStart >= juneMonth) continue;

            const existingMayPayment = await db.collection('Payment').findOne({
                tenantId: tenant._id,
                month: mayMonth
            });

            if (!existingMayPayment) {
                const flat = await db.collection('Flat').findOne({ _id: tenant.assignedFlatId });
                if (!flat) continue;

                const rentDue = flat.rentAmount || 0;
                const maintenanceDue = flat.maintenanceAmount || 0;
                const totalDue = rentDue + maintenanceDue;
                const now = new Date();

                await db.collection('Payment').insertOne({
                    flatId: flat._id,
                    tenantId: tenant._id,
                    month: mayMonth,
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
                mayBackfilled++;
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            message: `Successfully deleted ${deleteResult.deletedCount} June payments, and backfilled ${mayBackfilled} missing May payments.` 
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
