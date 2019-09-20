import mongoose from 'mongoose'

beforeAll(async () => {
  await mongoose.connect((global as any).mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
})

afterAll(async () => {
  await mongoose.disconnect()
})
