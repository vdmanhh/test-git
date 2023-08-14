import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id: ObjectId
  token: string
  created_at?: Date
  user_id: ObjectId
}
export default class RefreshToken {
  _id: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId

  constructor({ _id, token, created_at = new Date(), user_id }: RefreshTokenType) {
    this.user_id = user_id
    this._id = _id
    this.created_at = created_at
    this.token = token
  }
}
