import { ObjectId } from 'mongodb'

export interface TypeFollow {
  _id?: ObjectId
  user_id: ObjectId
  follow_user_id: ObjectId
  created_at: Date
}

export class Follow {
  _id: ObjectId
  user_id: ObjectId
  follow_user_id: ObjectId
  created_at: Date
  constructor({ _id, user_id, follow_user_id, created_at }: TypeFollow) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.follow_user_id = follow_user_id
    this.created_at = created_at
  }
}
