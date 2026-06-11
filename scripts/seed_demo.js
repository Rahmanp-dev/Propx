const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting Demo Account Seed...");

    // 1. Check if demo user already exists
    const existingDemoUser = await prisma.user.findUnique({ where: { email: 'demo@propx.com' } });
    if (existingDemoUser) {
      console.log("Demo user already exists. Cleaning up old demo data...");
      // Clean up old demo organization if exists
      if (existingDemoUser.organizationId) {
          const orgId = existingDemoUser.organizationId;
          // Delete all related data safely
          await prisma.payment.deleteMany({ where: { tenant: { flat: { building: { organizationId: orgId } } } } });
          await prisma.tenant.deleteMany({ where: { flat: { building: { organizationId: orgId } } } });
          await prisma.flat.deleteMany({ where: { building: { organizationId: orgId } } });
          await prisma.floor.deleteMany({ where: { building: { organizationId: orgId } } });
          await prisma.building.deleteMany({ where: { organizationId: orgId } });
          await prisma.user.deleteMany({ where: { organizationId: orgId } });
          await prisma.organization.delete({ where: { id: orgId } });
      }
    }

    // 2. Create Organization
    console.log("Creating Organization...");
    const org = await prisma.organization.create({
      data: {
        name: "PropX Demo Properties",
        ownerName: "Demo Owner",
        email: "demo.org@propx.com",
        phone: "9876543210",
        city: "Hyderabad",
        plan: "PORTFOLIO",
        planStatus: "ACTIVE",
        isActive: true,
      }
    });

    // 3. Create User
    console.log("Creating User...");
    const hashedPassword = await bcrypt.hash("DemoPassword123!", 10);
    const user = await prisma.user.create({
      data: {
        name: "Demo User",
        email: "demo@propx.com",
        password: hashedPassword,
        phone: "9876543210",
        role: "OWNER",
        organizationId: org.id,
      }
    });

    // 4. Create Buildings
    console.log("Creating Buildings...");
    const building1 = await prisma.building.create({
      data: {
        organizationId: org.id,
        name: "Gachibowli Heights",
        address: "123 Tech Park Road",
        city: "Hyderabad",
        totalFloors: 4,
        totalFlats: 8,
        occupancyRate: 80,
        ratePerUnit: 12.5,
        defaultRentBHK1: 15000,
        defaultRentBHK2: 25000,
        defaultRentBHK3: 35000,
      }
    });

    const building2 = await prisma.building.create({
      data: {
        organizationId: org.id,
        name: "Jubilee Hills Residency",
        address: "Plot 45, Jubilee Hills",
        city: "Hyderabad",
        totalFloors: 3,
        totalFlats: 6,
        occupancyRate: 100,
        ratePerUnit: 15.0,
        defaultRentBHK1: 20000,
        defaultRentBHK2: 35000,
        defaultRentBHK3: 50000,
      }
    });

    const buildings = [building1, building2];

    // 5. Create Floors and Flats
    console.log("Creating Floors and Flats...");
    const createdFlats = [];
    for (const b of buildings) {
      for (let f = 1; f <= b.totalFloors; f++) {
        const floor = await prisma.floor.create({
          data: {
            buildingId: b.id,
            number: f,
            flatsCount: 2,
          }
        });

        // 2 Flats per floor
        for (let fl = 1; fl <= 2; fl++) {
          const isOccupied = Math.random() > 0.15; // 85% occupancy
          const rent = b.defaultRentBHK2;
          const flat = await prisma.flat.create({
            data: {
              buildingId: b.id,
              floorId: floor.id,
              flatNumber: `${f}0${fl}`,
              flatType: "BHK2",
              rentAmount: rent,
              maintenanceAmount: 2000,
              depositAmount: rent * 2,
              status: isOccupied ? "OCCUPIED" : "VACANT",
            }
          });
          if (isOccupied) createdFlats.push(flat);
        }
      }
    }

    // 6. Create Tenants
    console.log("Creating Tenants...");
    const tenants = [];
    const names = ["Rahul Sharma", "Priya Singh", "Amit Kumar", "Neha Reddy", "Vikram Patel", "Sneha Rao", "Rohan Gupta", "Kavya Menon", "Arjun Nair", "Pooja Desai", "Suresh Iyer", "Ananya Verma"];
    let nameIdx = 0;
    
    // We'll generate data for the last 5 months
    const today = new Date();
    const monthsData = [];
    for (let i = 4; i >= 0; i--) {
      monthsData.push(new Date(today.getFullYear(), today.getMonth() - i, 1));
    }

    for (const flat of createdFlats) {
      const tName = names[nameIdx % names.length];
      nameIdx++;
      
      const leaseStart = new Date(today.getFullYear(), today.getMonth() - 6, 5); // Leased 6 months ago
      const tenant = await prisma.tenant.create({
        data: {
          fullName: tName,
          phone: "987654" + Math.floor(1000 + Math.random() * 9000),
          email: `${tName.split(' ')[0].toLowerCase()}@example.com`,
          leaseStartDate: leaseStart,
          assignedFlatId: flat.id,
          isActive: true,
        }
      });
      tenants.push({ tenant, flat });
    }

    // 7. Create Payments (Ledgers)
    console.log("Creating 5 Months of Payment Ledgers...");
    for (const { tenant, flat } of tenants) {
      for (let i = 0; i < monthsData.length; i++) {
        const monthDate = monthsData[i];
        const isCurrentMonth = i === monthsData.length - 1;
        
        const rentDue = flat.rentAmount;
        const maintenanceDue = flat.maintenanceAmount;
        const totalDue = rentDue + maintenanceDue;
        
        let status = "PAID";
        let amountPaid = totalDue;
        let balance = 0;
        let paymentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 5 + Math.floor(Math.random() * 5)); // Paid between 5th and 10th
        
        // For current month, maybe some are pending or partial
        if (isCurrentMonth) {
          const rand = Math.random();
          if (rand > 0.7) {
            status = "PENDING";
            amountPaid = 0;
            balance = totalDue;
            paymentDate = null;
          } else if (rand > 0.5) {
            status = "PARTIAL";
            amountPaid = rentDue; // Paid rent, missed maintenance
            balance = maintenanceDue;
            paymentDate = new Date();
          }
        }

        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            flatId: flat.id,
            month: monthDate,
            rentDue,
            maintenanceDue,
            electricityDue: 0,
            totalDue,
            amountPaid,
            balance,
            status,
            paymentDate,
            paymentMethod: status !== "PENDING" ? "UPI" : null,
            createdAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), // Generated on 1st of month
          }
        });
      }
    }

    console.log("====================================");
    console.log("DEMO ACCOUNT CREATED SUCCESSFULLY!");
    console.log("Login Email: demo@propx.com");
    console.log("Password: DemoPassword123!");
    console.log("====================================");

  } catch (error) {
    console.error("Error generating demo account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
