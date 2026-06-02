
import { MongoClient } from 'mongodb'

if (!process.env.DATABASE_URL) {
    throw new Error('Invalid/Missing environment variable: "DATABASE_URL"')
}

let uri = process.env.DATABASE_URL
if (uri) {
    try {
        const parsed = new URL(uri)
        if (parsed.pathname === '/' || parsed.pathname === '') {
            parsed.pathname = '/propx'
            uri = parsed.toString()
        }
    } catch (e) {
        if (!uri.includes("propx")) {
            uri = uri.replace("mongodb.net/?", "mongodb.net/propx?")
        }
    }
}
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options)
        globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
} else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
}

export default clientPromise

