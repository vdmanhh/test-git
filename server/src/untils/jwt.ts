import jwt from 'jsonwebtoken'

const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256',
    expiresIn: process.env.DURATION_EXIRED_TOKEN
  }
}: {
  options?: jwt.SignOptions
  payload: string | Buffer | object
  privateKey?: string
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        reject(error)
      }
      resolve(token as string)
    })
  })
}

export { signToken }
