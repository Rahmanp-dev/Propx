const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasourceUrl: 'mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/propx?appName=Cluster0'
});

async function main() {
  const email = 'pasha@limra.in';
  const password = 'owner123';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found!");
    return;
  }
  const match = await bcrypt.compare(password, user.password);
  console.log("Password match:", match);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
