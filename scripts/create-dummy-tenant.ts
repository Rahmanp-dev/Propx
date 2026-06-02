import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Finding or creating a dummy organization/building/flat for the tenant...')
  
  // Find super admin or any user
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
  
  // Create an org just for this
  let org = await prisma.organization.findFirst()
  if (!org) {
      org = await prisma.organization.create({
          data: {
              name: 'Test Organization',
              ownerName: 'Test Owner',
              email: 'test@owner.com',
              phone: '1234567890',
              isActive: true
          }
      })
  }

  // Create a building
  let building = await prisma.building.findFirst({ where: { organizationId: org.id } })
  if (!building) {
      building = await prisma.building.create({
          data: {
              organizationId: org.id,
              name: 'Test Building',
              address: '123 Test St',
              city: 'Hyderabad',
          }
      })
  }

  // Create a floor
  let floor = await prisma.floor.findFirst({ where: { buildingId: building.id } })
  if (!floor) {
      floor = await prisma.floor.create({
          data: {
              buildingId: building.id,
              number: 1
          }
      })
  }

  // Create a flat
  let flat = await prisma.flat.findFirst({ where: { buildingId: building.id } })
  if (!flat) {
      flat = await prisma.flat.create({
          data: {
              buildingId: building.id,
              floorId: floor.id,
              flatNumber: '101',
              rentAmount: 15000,
              status: 'OCCUPIED'
          }
      })
  }

  // Check if test tenant exists
  const phone = '9848012345'
  let tenant = await prisma.tenant.findFirst({ where: { phone } })
  if (!tenant) {
      tenant = await prisma.tenant.create({
          data: {
              fullName: 'Dummy Test Tenant',
              phone,
              email: 'tenant@test.com',
              assignedFlatId: flat.id,
              tenantPin: '2345',
              leaseStartDate: new Date(),
          }
      })
      console.log(`✅ Dummy Tenant Created Successfully!`)
      console.log(`Phone: ${tenant.phone}`)
      console.log(`PIN: ${tenant.tenantPin}`)
  } else {
      console.log(`✅ Dummy Tenant already exists!`)
      console.log(`Phone: ${tenant.phone}`)
      console.log(`PIN: ${tenant.tenantPin || 'Last 4 digits of phone'}`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
