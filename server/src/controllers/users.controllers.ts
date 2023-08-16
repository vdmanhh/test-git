import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import { httpStatus } from '~/contants'
import dataBaseService from '~/services/database.services'
import userService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const { user } = req || {}

  const user_id = user?._id || ''
  const result = await userService.login(user_id.toString())
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
