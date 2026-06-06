import { PrismaClient } from '@prisma/client'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

async function testConnection() {
    console.log("Testing Prisma...")
    const prisma = new PrismaClient()
    try {
        const buildings = await prisma.building.findMany()
        console.log("Prisma success. Found buildings:", buildings.length)
    } catch (e) {
        console.error("Prisma error:", e)
    } finally {
        await prisma.$disconnect()
    }

    console.log("\nTesting Mongo Driver...")
    try {
        const client = new MongoClient(process.env.DATABASE_URL as string)
        await client.connect()
        console.log("Mongo connect success.")
        const count = await client.db("propx").collection("Building").countDocuments()
        console.log("Mongo count success:", count)
        await client.close()
    } catch (e) {
        console.error("Mongo driver error:", e)
    }
}

testConnection()
