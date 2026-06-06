const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/propx?appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('propx');
    const users = database.collection('User');
    const orgs = database.collection('Organization');

    const user = await users.findOne({ _id: new ObjectId("6a1dd6e71bebc81c9c192081") });
    if (!user) {
       console.log("User not found!");
       return;
    }
    console.log("User:", user.email, "Org ID:", user.organizationId);

    if (user.organizationId) {
       const org = await orgs.findOne({ _id: user.organizationId });
       if (org) {
         console.log("User's Org:", org.name, "BillingCycle:", org.billingCycle);
         if (org.billingCycle === "ANNUAL") {
            const res = await orgs.updateOne({ _id: org._id }, { $set: { billingCycle: "YEARLY" } });
            console.log("Updated to YEARLY:", res.modifiedCount);
         }
       } else {
         console.log("Org not found in DB.");
       }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
