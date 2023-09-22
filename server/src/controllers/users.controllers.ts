import { Request, Response } from 'express'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { httpStatus } from '~/contants'
import { UserVerifyStatus } from '~/contants/enum'
import { UpdateUserRequest } from '~/models/schemas/users.schema'
import dataBaseService from '~/services/database.services'
import userService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const { user } = req || {}

  const user_id = user?._id || ''
  const result = await userService.login({ user_id: user_id.toString(), verify: user?.verify as UserVerifyStatus })
  res.json({
    message: 'Login success',
    result
  })
}

export const registerController = async (req: Request, res: Response) => {
  const user = await userService.register(req?.body || {})
  return res.status(200).json({
    message: 'create successfully',
    user
  })
}

export const logoutController = async (req: Request, res: Response) => {
  const { refreshTokenInfo } = req
  const result = await userService.logout(refreshTokenInfo?.token as string)
  return res.json(result)
}

export const verifyEmailTokenController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_verify_token_email || {}

  const user = await dataBaseService.User.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NotFound).json({
      message: 'User not found'
    })
  }

  if (user.email_verify_token === '') {
    return res.json({
      message: 'User verified'
    })
  }

  const result = await userService.verifyEmailToken(user_id as string)
  return res.status(httpStatus.Ok).json({
    message: 'Veriry email successfully',
    result
  })
}

export const resendEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization || {}
  const user = await dataBaseService.User.findOne({ _id: new ObjectId(user_id) })

  if (!user) {
    return res.status(httpStatus.NotFound).json({
      message: 'User not found'
    })
  }
  if (user.verify === UserVerifyStatus.Verifed) {
    return res.status(httpStatus.ServerError).json({
      message: 'User verified before'
    })
  }

  const result = await userService.resendVerifyEmailToken(user_id as string)
  return res.status(httpStatus.Ok).json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { user } = req || {}

  const result = await userService.forgotPassword({
    user_id: String((user || {})._id),
    verify: user?.verify as UserVerifyStatus
  })

  return res.status(httpStatus.Ok).json(result)
}
export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  // const { user } = req || {}
  // const result = await userService.forgotPassword(String(user?._id))
  // return res.status(httpStatus.Ok).json(result)
}

export const resetPasswordController = async (req: Request, res: Response) => {
  const { _id } = req.user || {}
  const { password } = req.body

  const result = await userService.resetPassword({ user_id: String(_id), password })

  return res.status(httpStatus.Ok).json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization || {}

  const result = await userService.getMe(user_id as string)

  return res.status(httpStatus.Ok).json(result)
}

export const updateMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization || {}
  const { body } = req

  const result = await userService.updateMe({ user_id: String(user_id), body })

  return res.json({
    message: 'Update user successfully',
    result
  })
}

export const followerController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization || {}

  const { follow_user_id } = req.body
  const result = await userService.followerUser(user_id as string, follow_user_id as string)

  return res.json(result)
}

export const unFollowerController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization || {}

  const { user_id: follow_user_id } = req.params

  const result = await userService.unfollowerUser(user_id as string, follow_user_id as string)

  return res.json(result)
}
