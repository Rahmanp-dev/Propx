const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasourceUrl: 'mongodb+srv://rp:Rahman%402005@cluster0.ypavype.mongodb.net/propx?appName=Cluster0'
});

async function main() {
  console.log('Connecting to MongoDB...');
  
  const email = 'pasha@limra.in';
  const password = 'owner123';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });
  let orgId;

  if (user) {
    console.log('User found. Updating password...');
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    orgId = user.organizationId;
    if (!orgId) {
       console.log('User has no organization. Creating one...');
       const org = await prisma.organization.create({
         data: {
           name: 'Limra Properties',
           ownerName: 'Pasha',
           email: email,
           phone: '9876543210',
           isActive: true,
           plan: 'PORTFOLIO'
         }
       });
       orgId = org.id;
       await prisma.user.update({ where: { email }, data: { organizationId: orgId } });
    }
  } else {
    console.log('User not found. Creating user and organization...');
    const org = await prisma.organization.create({
      data: {
        name: 'Limra Properties',
        ownerName: 'Pasha',
        email: email,
        phone: '9876543210',
        isActive: true,
        plan: 'PORTFOLIO'
      }
    });
    orgId = org.id;
    user = await prisma.user.create({
      data: {
        name: 'Pasha',
        email,
        password: hashedPassword,
        role: 'OWNER',
        organizationId: orgId
      }
    });
  }

  console.log('Clearing old data for this organization...');
  const oldBuildings = await prisma.building.findMany({ where: { organizationId: orgId } });
  for (const b of oldBuildings) {
    const flats = await prisma.flat.findMany({ where: { buildingId: b.id } });
    const flatIds = flats.map(f => f.id);
    if (flatIds.length > 0) {
      await prisma.payment.deleteMany({ where: { flatId: { in: flatIds } } });
      await prisma.meterReading.deleteMany({ where: { flatId: { in: flatIds } } });
      await prisma.tenant.deleteMany({ where: { assignedFlatId: { in: flatIds } } });
    }
    await prisma.flat.deleteMany({ where: { buildingId: b.id } });
    await prisma.floor.deleteMany({ where: { buildingId: b.id } });
    await prisma.building.delete({ where: { id: b.id } });
  }

  console.log('Creating 5 buildings...');
  const buildingNames = ["Limra Towers", "Limra Heights", "Limra Residency", "Limra Enclave", "Limra Pearl"];
  const tenantNames = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya",
    "Atharv", "Advik", "Pranav", "Kabir", "Ritvik", "Dhruv", "Kian", "Darsh", "Veer", "Aadil",
    "Diya", "Saanvi", "Aanya", "Ananya", "Pari", "Kavya", "Myra", "Avni", "Riya", "Aarohi",
    "Isha", "Aditi", "Navya", "Meera", "Zara", "Sara", "Kiara", "Prisha", "Nidhi", "Tanya",
    "Rohan", "Rahul", "Karan", "Vikas", "Manish", "Amit", "Raj", "Sanjay", "Sunil", "Anil",
    "Vijay", "Ajay", "Mohit", "Pooja", "Neha", "Sneha", "Kriti", "Shruti", "Swati", "Divya"
  ];
  let tenantIndex = 0;

  for (const bName of buildingNames) {
    console.log(`Creating ${bName}...`);
    const building = await prisma.building.create({
      data: {
        organizationId: orgId,
        name: bName,
        address: `${bName} Road, Hyderabad`,
        totalFloors: 3,
        totalFlats: 12,
        occupancyRate: 100,
        ratePerUnit: 10,
        defaultRentBHK2: 15000,
      }
    });

    for (let f = 1; f <= 3; f++) {
      const floor = await prisma.floor.create({
        data: {
          buildingId: building.id,
          number: f,
          flatsCount: 4
        }
      });

      for (let num = 1; num <= 4; num++) {
        const flatNumber = `${f}0${num}`;
        const flat = await prisma.flat.create({
          data: {
            buildingId: building.id,
            floorId: floor.id,
            flatNumber,
            flatType: 'BHK2',
            rentAmount: 15000,
            maintenanceAmount: 1000,
            status: 'OCCUPIED'
          }
        });

        const tenant = await prisma.tenant.create({
          data: {
            fullName: tenantNames[tenantIndex++ % tenantNames.length] + ' Reddy',
            phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
            leaseStartDate: new Date('2025-01-01T00:00:00.000Z'),
            assignedFlatId: flat.id,
            isActive: true
          }
        });

        let currentReading = Math.floor(Math.random() * 100) + 500;

        // March (Paid)
        let units = Math.floor(Math.random() * 80) + 40;
        currentReading += units;
        await prisma.meterReading.create({
          data: { flatId: flat.id, reading: currentReading, month: 3, year: 2026, readingDate: new Date('2026-03-01T00:00:00.000Z') }
        });
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            flatId: flat.id,
            month: new Date('2026-03-01T00:00:00.000Z'),
            rentDue: 15000,
            maintenanceDue: 1000,
            electricityDue: units * 10,
            totalDue: 15000 + 1000 + units * 10,
            amountPaid: 15000 + 1000 + units * 10,
            balance: 0,
            status: 'PAID',
            paymentDate: new Date('2026-03-05T00:00:00.000Z'),
            paymentMethod: 'UPI'
          }
        });

        // April (Paid)
        units = Math.floor(Math.random() * 80) + 40;
        currentReading += units;
        await prisma.meterReading.create({
          data: { flatId: flat.id, reading: currentReading, month: 4, year: 2026, readingDate: new Date('2026-04-01T00:00:00.000Z') }
        });
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            flatId: flat.id,
            month: new Date('2026-04-01T00:00:00.000Z'),
            rentDue: 15000,
            maintenanceDue: 1000,
            electricityDue: units * 10,
            totalDue: 15000 + 1000 + units * 10,
            amountPaid: 15000 + 1000 + units * 10,
            balance: 0,
            status: 'PAID',
            paymentDate: new Date('2026-04-05T00:00:00.000Z'),
            paymentMethod: 'UPI'
          }
        });

        // May (Pending)
        units = Math.floor(Math.random() * 80) + 40;
        currentReading += units;
        await prisma.meterReading.create({
          data: { flatId: flat.id, reading: currentReading, month: 5, year: 2026, readingDate: new Date('2026-05-01T00:00:00.000Z') }
        });
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            flatId: flat.id,
            month: new Date('2026-05-01T00:00:00.000Z'),
            rentDue: 15000,
            maintenanceDue: 1000,
            electricityDue: units * 10,
            totalDue: 15000 + 1000 + units * 10,
            amountPaid: 0,
            balance: 15000 + 1000 + units * 10,
            status: 'PENDING'
          }
        });
      }
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
