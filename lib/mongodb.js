import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'infinitylegal'

let client
let clientPromise

if (!MONGO_URL) {
  console.warn('MONGO_URL not configured. MongoDB features will be unavailable.')
  clientPromise = Promise.resolve({
    db: () => ({
      collection: () => ({
        find: () => ({ toArray: async () => [] }),
        insertOne: async () => ({ insertedId: null }),
        updateOne: async () => ({ modifiedCount: 0 }),
        deleteOne: async () => ({ deletedCount: 0 }),
      }),
    }),
  })
} else if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve the value across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGO_URL)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(MONGO_URL)
  clientPromise = client.connect()
}

export async function getDb() {
  const client = await clientPromise
  return client.db(DB_NAME)
}

export default clientPromise
