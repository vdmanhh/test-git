import { Request } from 'express'
import User from './models/schemas/users.schema'
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: {
      user_id: string
      token_type: number
      iat: number
      exp: number
    }
    refreshTokenInfo?: {
      _id: ObjectId
      token: string
      created_at?: Date
      user_id: ObjectId
    }
    decoded_verify_token_email?: {
      user_id: string
    }
  }
}
