import express from 'express'
import { loginController } from '~/controllers/users.controllers'
import { UserValidator } from '~/middlewares/users.middlewares'

const useRouter = express.Router()

useRouter.post('/login', UserValidator, loginController)

export default useRouter
