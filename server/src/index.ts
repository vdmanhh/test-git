import bodyParser from 'body-parser' // tạo body trên response
import express from 'express'
import { ConnectOptions } from 'mongoose'
import useRouter from './routers/users.router'
import dotenv from 'dotenv'
import dataBaseService from './services/database.services'
import { defaultErrorHandle } from './middlewares/errors.middlewares'

dotenv.config()
const app = express()

app.get('/', (req, res) => {
  res.send('Hello, Express!')
})

app.use(bodyParser.json())
app.use(express.json())
app.use('/api', useRouter)

app.use(defaultErrorHandle)

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
} as ConnectOptions

dataBaseService.connect()

app.listen(process.env.PORT, () => {
  console.log(`------- Server running on http://localhost:${process.env.PORT} -------`)
})
