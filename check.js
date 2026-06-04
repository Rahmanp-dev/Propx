const { MongoClient } = require('mongodb');
async function check() {
    const client = new MongoClient('mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/?appName=Cluster0');
    await client.connect();
    const db = client.db('propx');
    
    const limra = await db.collection('Building').findOne({ name: /Limra/i });
    console.log('Building:', limra.name, limra._id);
    
    const flats = await db.collection('Flat').find({ buildingId: limra._id }).toArray();
    console.log(`Found ${flats.length} flats`);
    
    for (const f of flats) {
        const tenants = await db.collection('Tenant').find({ assignedFlatId: f._id }).toArray();
        for (const t of tenants) {
            console.log(`Flat ${f.flatNumber} Tenant: ${t.fullName} (isActive: ${t.isActive})`);
        }
    }
    await client.close();
}
check();
