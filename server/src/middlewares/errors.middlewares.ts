import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import { httpStatus } from '~/contants'

export const defaultErrorHandle = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err?.status || httpStatus.NotFound).json(omit(err, 'status'))
}
