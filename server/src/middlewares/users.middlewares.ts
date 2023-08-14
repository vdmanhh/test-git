import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import dataBaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { validation } from '~/untils/validation'

export const UserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req?.body || {}

  if (!email || !password) {
    return res.status(400).json({ massage: 'Missing email or password' })
  }
  next()
}

export const registerValidator = validation(
  checkSchema({
    name: {
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      },
      isString: true,
      notEmpty: {
        errorMessage: 'Name is required'
      },
      trim: true
    },
    email: {
      notEmpty: {
        errorMessage: 'Email is required'
      },
      isEmail: true,
      trim: true,
      errorMessage: 'Email format wrong',
      custom: {
        options: async (value, { req }) => {
          const isExistEmail = await userService.checkEmailExist(value)
          if (isExistEmail) {
            throw new Error('Email is exist')
          }
          return true
        }
      }
    },
    password: {
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      notEmpty: {
        errorMessage: 'Password is required'
      },
      trim: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: 'Format password wrong'
      }
    },
    confirm_password: {
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      notEmpty: {
        errorMessage: 'Confirm password is required'
      },
      trim: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: 'Format password wrong'
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req?.body?.password) {
            throw new Error('Confirm password dose match password')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      },
      notEmpty: true
    }
  })
)

export const loginValidator = validation(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: 'Email is required'
      },
      isEmail: true,
      trim: true,
      errorMessage: 'Email format wrong',
      custom: {
        options: async (value, { req }) => {
          const user = await dataBaseService.User.findOne({ email: value })
          if (user === null) {
            throw new Error('User not found')
          }
          req.user = user
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: 'Password is required'
      },
      trim: true
    }
  })
)
