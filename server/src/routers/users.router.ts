import express from 'express'
import {
  loginController,
  logoutController,
  registerController,
  verifyEmailTokenController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyEmailTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandle } from '~/untils/handles'

const useRouter = express.Router()

useRouter.post('/login', loginValidator, loginController)
useRouter.post('/register', registerValidator, wrapRequestHandle(registerController))
useRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandle(logoutController))
useRouter.post('/verify-email', verifyEmailTokenValidator, wrapRequestHandle(verifyEmailTokenController))

export default useRouter
