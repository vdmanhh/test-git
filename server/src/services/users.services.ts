import User from '~/models/schemas/users.schema'
import dataBaseService from './database.services'
import { ObjectId } from 'mongodb'
import { RegisterReqBody } from '~/models/requests/user.request'
import { hashPassword } from '~/untils/crypto'
import { signToken } from '~/untils/jwt'
import { TokenType } from '~/contants/enum'
import RefreshToken from '~/models/schemas/refresh_token.schema'

class UserService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      }
    })
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async register(payload: RegisterReqBody) {
    const objectId = new ObjectId()
    const { email, password, date_of_birth } = payload

    const result = await dataBaseService.User.insertOne(
      new User({ _id: objectId, email, password: hashPassword(password), date_of_birth: new Date(date_of_birth) })
    )

    const user_id = result?.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    await dataBaseService.RefreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        _id: objectId
      })
    )

    return { ...result, access_token, refresh_token }
  }

  async checkEmailExist(email: string) {
    const user = await dataBaseService.User.findOne({ email })
    return Boolean(user)
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    await dataBaseService.RefreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        _id: new ObjectId()
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
}

const userService = new UserService()
export default userService
