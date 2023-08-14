import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { ValidationChain, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import { EntityError, ErrowWithStatus } from '~/models/errors/Errors'
import { httpStatus } from '~/contants/index'

export const validation = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    const errorsObj = errors.mapped()
    const entityError = new EntityError({ errors: {} })

    if (errors.isEmpty()) {
      return next()
    }

    //loi tra ve ko phai do validation
    for (const key in errorsObj) {
      const { msg } = errorsObj[key]
      if (msg instanceof ErrowWithStatus && msg.status !== httpStatus.Validator) {
        return next(msg)
      }
      entityError.errors[key] = errorsObj[key]
    }

    // tra ve loi do validation

    next(entityError)
  }
}
