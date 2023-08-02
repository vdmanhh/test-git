import { Request, Response, NextFunction } from 'express'

export const UserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req?.body || {}

  if (!username || !password) {
    return res.status(400).json({ massage: 'Missing username or password' })
  }
  next()
}
