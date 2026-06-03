const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: 'mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/propx?appName=Cluster0'
});

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'pasha@limra.in' } });
  console.log('User:', user);
  const org = await prisma.organization.findUnique({ where: { id: user?.organizationId } });
  console.log('Org:', org);
  const buildings = await prisma.building.count({ where: { organizationId: org?.id } });
  console.log('Buildings:', buildings);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
