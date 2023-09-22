import { Request, Response, NextFunction } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { httpStatus } from '~/contants'
import { ErrowWithStatus } from '~/models/errors/Errors'
import dataBaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/untils/crypto'
import { verifyToken } from '~/untils/jwt'
import { validation } from '~/untils/validation'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/contants/enum'
import { REGEX_USERNAME } from '~/contants/regex'

export const UserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req?.body || {}

  if (!email || !password) {
    return res.status(400).json({ massage: 'Missing email or password' })
  }
  next()
}

const passwordSchema: ParamSchema = {
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
}

const passwordConfirmSchema: ParamSchema = {
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
}

const userIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: 'follower user id is required'
  },
  custom: {
    options: async (value, { req }) => {
      console.log('value', value)

      if (!ObjectId.isValid(value)) {
        throw new ErrowWithStatus({
          message: 'Follow user id is not objectId',
          status: httpStatus.NotFound
        })
      }

      const follower_user = await dataBaseService.User.findOne({ _id: new ObjectId(value) })
      if (follower_user === null) {
        if (ObjectId.isValid(value)) {
          throw new ErrowWithStatus({
            message: 'User not found',
            status: httpStatus.NotFound
          })
        }
      }
      return true
    }
  }
}
const forgotPasswordTokenSchema: ParamSchema = {
  notEmpty: {
    errorMessage: 'Forgot password token is required'
  },
  custom: {
    options: async (value, { req }) => {
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value.trim(),
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD
        })
        const { user_id } = decoded_forgot_password_token
        const user = await dataBaseService.User.findOne({ _id: new ObjectId(user_id) })

        if (!user) {
          throw new ErrowWithStatus({ message: 'User not found', status: httpStatus.NotFound })
        }

        if (user.forgot_password_token !== value) {
          throw new ErrowWithStatus({ message: 'Forgot password token invalid', status: httpStatus.NotFound })
        }
        req.user = user
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          throw new ErrowWithStatus({ message: 'Forgot password token invalid', status: httpStatus.Forbiden })
        }
        throw error
      }
    }
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: 'Avatar is string'
  },
  trim: true
}
const nameSchema: ParamSchema = {
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: 'Name length must from 1 to 100'
  },
  isString: {
    errorMessage: 'Name is required string'
  },
  notEmpty: {
    errorMessage: 'Name is required'
  },
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    }
  },
  notEmpty: true
}

export const registerValidator = validation(
  checkSchema(
    {
      name: nameSchema,
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
      password: passwordSchema,
      confirm_password: passwordConfirmSchema,
      date_of_birth: dateOfBirthSchema
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

export const forgotPasswordValidator = validation(
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
            const user = await dataBaseService.User.findOne({ email: value })
            if (user === null) {
              throw new Error('Email is not exist')
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)
export const verifyPasswordTokenValidator = validation(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validation(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: passwordConfirmSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const verifyUserValidation = async (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization || {}
  if (verify !== UserVerifyStatus.Verifed) {
    return next(
      new ErrowWithStatus({
        message: 'User is not verify',
        status: httpStatus.Forbiden
      })
    )
  }
  next()
}

export const updateUserValidator = validation(
  checkSchema(
    {
      name: { ...nameSchema, optional: true, notEmpty: undefined },
      date_of_birth: { ...dateOfBirthSchema, optional: true },
      bio: {
        optional: true,
        isString: {
          errorMessage: 'Bio is require string'
        },
        trim: true,
        isLength: {
          options: {
            max: 200,
            min: 1
          },
          errorMessage: 'Bio is must be from 1 to 200 character'
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: 'Web is string'
        },
        trim: true,
        isLength: {
          options: {
            max: 100,
            min: 1
          },
          errorMessage: 'Website is must be from 1 to 100 character'
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: 'Username is string'
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw new ErrowWithStatus({
                message: 'Invalid format username',
                status: httpStatus.Validator
              })
            }

            const user = await dataBaseService.User.findOne({ username: value })
            if (user) {
              throw new ErrowWithStatus({
                message: 'User is exist',
                status: httpStatus.Validator
              })
            }
            return true
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followerUserValidator = validation(
  checkSchema({
    follow_user_id: userIdSchema
  })
)

export const unFollowerUserValidator = validation(
  checkSchema(
    {
      user_id: userIdSchema
    },
    ['params']
  )
)
