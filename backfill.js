const { MongoClient, ObjectId } = require('mongodb');

async function backfill() {
    const uri = 'mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/?appName=Cluster0';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to DB');
        const db = client.db('propx');

        const tenants = await db.collection('Tenant').find({ isActive: true }).toArray();
        console.log(`Found ${tenants.length} active tenants.`);

        for (const tenant of tenants) {
            if (!tenant.leaseStartDate || !tenant.assignedFlatId) continue;

            const leaseStart = new Date(tenant.leaseStartDate);
            // First day of the lease start month
            const paymentMonth = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);

            const existingPayment = await db.collection('Payment').findOne({
                tenantId: tenant._id,
                month: paymentMonth
            });

            if (!existingPayment) {
                // Get flat details for rent/maintenance
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
                console.log(`Backfilled payment for tenant ${tenant.fullName} for month ${paymentMonth.toISOString()}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        console.log('Done');
    }
}

backfill();
