import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { httpStatus } from '~/contants'
import { ErrowWithStatus } from '~/models/errors/Errors'
import dataBaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/untils/crypto'
import { verifyToken } from '~/untils/jwt'
import { validation } from '~/untils/validation'
import jwt from 'jsonwebtoken'

export const UserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req?.body || {}

  if (!email || !password) {
    return res.status(400).json({ massage: 'Missing email or password' })
  }
  next()
}

export const registerValidator = validation(
  checkSchema(
    {
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
    },
    ['body']
  )
)

export const loginValidator = validation(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: 'Email is required'
        },
        isEmail: true,
        trim: true,
        errorMessage: 'Email format wrong',
        custom: {
          options: async (value, { req }) => {
            const { password } = req.body
            const user = await dataBaseService.User.findOne({ email: value, password: hashPassword(password) })
            if (user === null) {
              throw new Error('Email or password incorrect')
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
    },
    ['body']
  )
)

export const accessTokenValidator = validation(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: 'Access token is required'
        },
        custom: {
          options: async (value, { req }) => {
            const access_token = value.replace('Bearer', '') as string
            if (!access_token) {
              throw new ErrowWithStatus({ message: 'Access token is required', status: httpStatus.Forbiden })
            }

            try {
              const decoded_authorization = await verifyToken({ token: access_token.trim() })
              req.decoded_authorization = decoded_authorization

              return true
            } catch (error) {
              if (error instanceof ErrowWithStatus) {
                throw error
              }
              throw new ErrowWithStatus({ message: 'Access token invalid', status: httpStatus.Forbiden })
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validation(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: 'Refresh token is required'
        },
        isString: true,
        custom: {
          options: async (value, { req }) => {
            try {
              const [decoded_refresh_token, refreshTokenInfo] = await Promise.all([
                verifyToken({ token: value.trim() }),
                dataBaseService.RefreshToken.findOne({ token: value.trim() })
              ])

              if (!refreshTokenInfo) {
                throw new ErrowWithStatus({
                  message: 'Refresh token does not exist or used',
                  status: httpStatus.Forbiden
                })
              }
              req.refreshTokenInfo = refreshTokenInfo
              return true
            } catch (error) {
              if (error instanceof jwt.JsonWebTokenError) {
                throw new ErrowWithStatus({ message: 'Anauthorization', status: httpStatus.Forbiden })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const verifyEmailTokenValidator = validation(
  checkSchema(
    {
      email_verify_token: {
        isString: true,
        custom: {
          options: async (value, { req }) => {
            try {
              if (!value) {
                throw new ErrowWithStatus({ message: 'Email verify token is required', status: httpStatus.Forbiden })
              }

              const decoded_verify_token_email = await verifyToken({
                token: value.trim(),
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL
              })
              req.decoded_verify_token_email = decoded_verify_token_email
              return true
            } catch (error) {
              console.log('error instanceof jwt.JsonWebTokenError', error instanceof jwt.JsonWebTokenError)

              if (error instanceof jwt.JsonWebTokenError) {
                throw new ErrowWithStatus({ message: 'Email verify token invalid', status: httpStatus.Forbiden })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)
