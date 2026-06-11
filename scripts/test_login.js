const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findUnique({ where: { email: 'demo@propx.com' } });
    console.log(user ? 'User exists' : 'User missing');
    if(user) {
        console.log('User Role:', user.role);
        console.log('Org ID:', user.organizationId);
        const match = await bcrypt.compare('DemoPassword123!', user.password);
        console.log('Match?', match);
    }
    await prisma.$disconnect();
}

run();
