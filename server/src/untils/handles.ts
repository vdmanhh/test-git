import { Request, Response, NextFunction, RequestHandler } from 'express'

export const wrapRequestHandle = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }

    // Co the viet bang cach nay :  Promist.resolve(func(req, res, next)).catch(next)
  }
}
