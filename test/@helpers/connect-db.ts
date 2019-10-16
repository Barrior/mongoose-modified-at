import mongoose from 'mongoose'

beforeAll(async () => {
  await mongoose.connect((global as any).mongoUri)
})

afterAll(async () => {
  await mongoose.disconnect()
})
