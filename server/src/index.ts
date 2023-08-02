import bodyParser from 'body-parser' // tạo body trên response
import express from 'express'
import mongoose, { ConnectOptions } from 'mongoose'
import useRouter from './routers/users.router'
import { MongoClient } from 'mongodb'
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello, Express!')
})

app.use(bodyParser.json())
app.use(express.json())
app.use('/api', useRouter)

const mongoURI = 'mongodb://localhost:27017/learn-node'

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
  // autoIndex: true
} as ConnectOptions

MongoClient.connect(mongoURI, connectOptions)
  .then((res) => {
    console.log('Connected to MongoDB successfully!')
    app.listen(port, () => {
      console.log(`------- Server running on http://localhost:${port} -------`)
    })
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err)
  })
