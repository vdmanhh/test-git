import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import { Collection } from 'mongodb'
import User from '~/models/schemas/users.schema'
import RefreshToken from '~/models/schemas/refresh_token.schema'
import { Follow } from '~/models/schemas/follow.schema'
dotenv.config()

class DatabaseService {
  client
  db
  constructor() {
    this.client = new MongoClient(process.env.MONGO_URI as string)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('connected DB successfully')
    } catch {
      await this.client.close()
    }
  }

  get User(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTIONS as string)
  }

  get RefreshToken(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKEN_COLLECTIONS as string)
  }

  get Follow(): Collection<Follow> {
    return this.db.collection(process.env.DB_FOLLOWS as string)
  }
}

const dataBaseService = new DatabaseService()
export default dataBaseService
