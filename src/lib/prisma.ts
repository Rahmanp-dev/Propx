import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    let url = process.env.DATABASE_URL
    if (url && !url.includes("propx")) {
        url = url.replace("mongodb.net/?", "mongodb.net/propx?")
    }
    return new PrismaClient({ datasources: { db: { url } } })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
