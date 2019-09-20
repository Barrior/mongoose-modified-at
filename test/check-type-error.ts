import mongoose from 'mongoose'
import modifiedAt from '~/index'

test('Incorrect type of parameter should throw Error', () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
    sex: String,
  })

  expect(() => {
    // @ts-ignore
    schema.plugin(modifiedAt, 'String type')
  }).toThrow()

  expect(() => {
    // @ts-ignore
    schema.plugin(modifiedAt, true)
  }).toThrow()

  expect(() => {
    // @ts-ignore
    schema.plugin(modifiedAt)
  }).toThrow()

  expect(() => {
    // @ts-ignore
    schema.plugin(modifiedAt, new Function())
  }).toThrow()
})
