const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const u = await prisma.user.findUnique({ where: { email: 'pasha@limra.in' } });
  console.log('User Org:', u.organizationId);
  const org = await prisma.organization.findUnique({ where: { id: u.organizationId }});
  console.log('Org:', org?.name);
  const b = await prisma.building.findMany({ where: { organizationId: u.organizationId } });
  console.log('Buildings count:', b.length);
  if (b.length > 0) {
      console.log('Building 1:', b[0].name);
      const f = await prisma.flat.findMany({ where: { buildingId: b[0].id } });
      console.log('Flats in Building 1:', f.length);
  }
  const p = await prisma.payment.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log('Sample payment month:', p?.month);
}

check().finally(() => prisma.$disconnect());
