import { Request } from 'express'
import User from './models/schemas/users.schema'
declare module 'express' {
  interface Request {
    user?: User
  }
}
