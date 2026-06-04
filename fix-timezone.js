const { MongoClient, ObjectId } = require('mongodb');

async function fixTimezones() {
    const uri = 'mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/?appName=Cluster0';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to DB');
        const db = client.db('propx');

        const payments = await db.collection('Payment').find({}).toArray();
        console.log(`Found ${payments.length} payments.`);

        let updated = 0;
        for (const p of payments) {
            // Check if month is at 18:30:00.000Z (IST midnight converted to UTC)
            if (p.month && p.month.toISOString().endsWith('18:30:00.000Z')) {
                // Add 5.5 hours to get it to UTC midnight
                const correctedDate = new Date(p.month.getTime() + (5.5 * 60 * 60 * 1000));
                await db.collection('Payment').updateOne(
                    { _id: p._id },
                    { $set: { month: correctedDate } }
                );
                updated++;
                console.log(`Updated payment ${p._id} month to ${correctedDate.toISOString()}`);
            }
        }
        console.log(`Successfully fixed ${updated} payment timezones.`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        console.log('Done');
    }
}

fixTimezones();
