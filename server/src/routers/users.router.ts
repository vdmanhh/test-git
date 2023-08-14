import express from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandle } from '~/untils/handles'

const useRouter = express.Router()

useRouter.post('/login', loginValidator, loginController)
useRouter.post('/register', registerValidator, wrapRequestHandle(registerController))

export default useRouter
