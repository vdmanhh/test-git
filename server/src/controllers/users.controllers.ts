import { Request, Response, NextFunction } from 'express'
import { RegisterReqBody } from '~/models/requests/user.request'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrowWithStatus } from '~/models/errors/Errors'

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
