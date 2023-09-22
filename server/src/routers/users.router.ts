import express from 'express'
import {
  followerController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailController,
  resetPasswordController,
  unFollowerController,
  updateMeController,
  verifyEmailTokenController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddlewareValidation } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  followerUserValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unFollowerUserValidator,
  updateUserValidator,
  verifyEmailTokenValidator,
  verifyPasswordTokenValidator,
  verifyUserValidation
} from '~/middlewares/users.middlewares'
import { UpdateUserRequest } from '~/models/schemas/users.schema'
import { wrapRequestHandle } from '~/untils/handles'

const useRouter = express.Router()

useRouter.post('/login', loginValidator, loginController)
useRouter.post('/register', registerValidator, wrapRequestHandle(registerController))
useRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandle(logoutController))
useRouter.post('/verify-email', verifyEmailTokenValidator, wrapRequestHandle(verifyEmailTokenController))
useRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandle(resendEmailController))
useRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandle(forgotPasswordController))
useRouter.post(
  '/verify-forgot-password-token',
  verifyPasswordTokenValidator,
  wrapRequestHandle(verifyForgotPasswordController)
)
useRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandle(resetPasswordController))
useRouter.get('/me', accessTokenValidator, wrapRequestHandle(getMeController))
useRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidation,
  updateUserValidator,
  filterMiddlewareValidation<UpdateUserRequest>([
    'name',
    'date_of_birth',
    'location',
    'bio',
    'avatar',
    'website',
    'username',
    'cover_photo'
  ]),
  wrapRequestHandle(updateMeController)
)
useRouter.post(
  '/follower-user',
  accessTokenValidator,
  verifyUserValidation,
  followerUserValidator,
  wrapRequestHandle(followerController)
)
useRouter.delete(
  '/unfollower-user/:user_id',
  accessTokenValidator,
  verifyUserValidation,
  unFollowerUserValidator,
  wrapRequestHandle(unFollowerController)
)
export default useRouter
