import User, { UpdateUserRequest } from '~/models/schemas/users.schema'
import dataBaseService from './database.services'
import { ObjectId } from 'mongodb'
import { RegisterReqBody } from '~/models/requests/user.request'
import { hashPassword } from '~/untils/crypto'
import { signToken } from '~/untils/jwt'
import { TokenType, UserVerifyStatus } from '~/contants/enum'
import RefreshToken from '~/models/schemas/refresh_token.schema'
import { httpStatus } from '~/contants'
import { Follow } from '~/models/schemas/follow.schema'

class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      options: { expiresIn: process.env.DURATION_EXIRED_VERIFY_EMAIL_TOKEN },
      privateKey: process.env.JWT_SECRET_EMAIL
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      options: { expiresIn: process.env.DURATION_EXIRED_FORGOT_PASSORD_TOKEN },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD
    })
  }

  private async signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async register(payload: RegisterReqBody) {
    const objectId = new ObjectId()
    const { email, password, date_of_birth } = payload
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: objectId.toString(),
      verify: UserVerifyStatus.Unverifed
    })

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
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: objectId.toString(),
      verify: UserVerifyStatus.Unverifed
    })

    await dataBaseService.RefreshToken.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        _id: objectId
      })
    )

    return { ...result, access_token, refresh_token, email_verify_token }
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

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify
    })

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
      this.signAccessAndRefreshToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Verifed
      }),
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

  async resendVerifyEmailToken(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverifed
    })
    await dataBaseService.User.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      message: 'Rensend verify email token successfully'
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgotPassworToken = await this.signForgotPasswordToken({
      user_id: user_id.toString(),
      verify
    })
    await dataBaseService.User.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token: forgotPassworToken,
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      message: 'Check email to forgot pasword successfully'
    }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    const newPassword = hashPassword(password)
    await dataBaseService.User.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: newPassword,
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      message: 'Reset password successfully'
    }
  }

  async getMe(user_id: string) {
    const user = await dataBaseService.User.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )
    return user
  }

  async updateMe({ user_id, body }: { user_id: string; body: UpdateUserRequest }) {
    const payload = body.date_of_birth ? { ...body, date_of_birth: new Date(body.date_of_birth) } : body
    const result = await dataBaseService.User.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...payload
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return result.value
  }

  async followerUser(user_id: string, follow_user_id: string) {
    const follower = await dataBaseService.Follow.findOne({
      user_id: new ObjectId(user_id),
      follow_user_id: new ObjectId(follow_user_id)
    })
    if (follower) {
      return {
        message: 'User is followed'
      }
    }

    const result = await dataBaseService.Follow.insertOne(
      new Follow({
        user_id: new ObjectId(user_id),
        follow_user_id: new ObjectId(follow_user_id),
        created_at: new Date()
      })
    )

    return {
      message: 'Follower user successfully'
    }
  }

  async unfollowerUser(user_id: string, follow_user_id: string) {
    console.log('user_id', user_id, 'follow_user_id', follow_user_id)

    const unfollower = await dataBaseService.Follow.findOne({
      user_id: new ObjectId(user_id),
      follow_user_id: new ObjectId(follow_user_id)
    })

    console.log('unfollower', unfollower)

    if (!unfollower) {
      return {
        message: 'Already followed'
      }
    }

    const result = await dataBaseService.Follow.deleteOne({
      user_id: new ObjectId(user_id),
      follow_user_id: new ObjectId(follow_user_id)
    })

    return {
      message: 'Unfollower user successfully'
    }
  }
}

const userService = new UserService()
export default userService
