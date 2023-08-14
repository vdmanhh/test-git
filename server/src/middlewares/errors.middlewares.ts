import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import { httpStatus } from '~/contants'
import { ErrowWithStatus } from '~/models/errors/Errors'

export const defaultErrorHandle = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrowWithStatus) {
    return res.status(err?.status).json(omit(err, 'status'))
  }

  // message default tra ve
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })

  res.status(httpStatus.NotFound).json({
    message: err?.message,
    errorInfo: omit(err, 'stack')
  })
}
