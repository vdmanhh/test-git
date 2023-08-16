import User from '~/models/schemas/users.schema'
import dataBaseService from './database.services'
import { ObjectId } from 'mongodb'
import { RegisterReqBody } from '~/models/requests/user.request'
import { hashPassword } from '~/untils/crypto'
import { signToken } from '~/untils/jwt'
import { TokenType, UserVerifyStatus } from '~/contants/enum'
import RefreshToken from '~/models/schemas/refresh_token.schema'
import { httpStatus } from '~/contants'

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

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      options: { expiresIn: process.env.DURATION_EXIRED_VERIFY_EMAIL_TOKEN },
      privateKey: process.env.JWT_SECRET_EMAIL
    })
  }

  private async signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }

  async register(payload: RegisterReqBody) {
    const objectId = new ObjectId()
    const { email, password, date_of_birth } = payload
    const email_verify_token = await this.signEmailVerifyToken(objectId.toString())

    const result = await dataBaseService.User.insertOne(
      new User({
        _id: objectId,
        email,
        password: hashPassword(password),
        date_of_birth: new Date(date_of_birth),
        email_verify_token
      })
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

  async logout(token: string) {
    await dataBaseService.RefreshToken.deleteOne({ token })
    return {
      message: 'Logout successfully',
      status: httpStatus.Ok
    }
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

  async verifyEmailToken(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      dataBaseService.User.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            created_at: new Date(),
            verify: UserVerifyStatus.Verifed
          }
        }
      )
    ])
    const [access_token, refresh_token] = token

    return {
      access_token,
      refresh_token
    }
  }
}

const userService = new UserService()
export default userService
