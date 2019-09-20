import moment from 'moment'
import mongoose from 'mongoose'
import modifiedAt from '~/index'
import './@helpers/connect-db'
import { isDateTypeAndValueValid, randomName } from './@helpers/utils'

const schema = new mongoose.Schema({
  name: String,
  age: Number,
  sex: String,
})

schema.plugin(modifiedAt, ['name', 'age'])

const Goose = mongoose.model(randomName(), schema)

test('Query.prototype.findOneAndReplace()', async () => {
  const snow = await Goose.create({ name: randomName('Snow') })

  const query = Goose.find()
  await (query as any).findOneAndReplace({ _id: snow._id }, { age: 1 })

  const snow2: any = await Goose.findById(snow._id)
  expect(snow2.age).toBe(1)
  expect(snow2.age_modifiedAt).toBeUndefined()
  expect(snow2.name).toBeUndefined()
  expect(snow2.name_modifiedAt).toBeUndefined()

  // Check enable modifiedAt's function
  const startTime = moment()
  const name = randomName('Snow')
  await (query as any).findOneAndReplace(
    { _id: snow._id },
    { name, age: 2 },
    { modifiedAt: true }
  )

  const snow3: any = await Goose.findById(snow._id)
  expect(snow3.name).toBe(name)
  expect(snow3.age).toBe(2)
  isDateTypeAndValueValid(snow3.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(snow3.age_modifiedAt, { startTime })
})

test('Query.prototype.findOneAndUpdate()', async () => {
  const name = randomName('Snow')
  const query = Goose.find()

  const startTime = moment()
  await query.findOneAndUpdate({ name }, { age: 1 }, { upsert: true })
  const endTime = moment()

  const snow: any = await query.findOne({ name })
  expect(snow.age).toBe(1)
  isDateTypeAndValueValid(snow.age_modifiedAt, { startTime, endTime })

  // Skip modifiedAt's function for this update
  await query.findOneAndUpdate({ name }, { age: 2 }, {
    modifiedAt: false,
  } as any)
  const snow2: any = await query.findOne({ name })
  expect(snow2.age).toBe(2)
  isDateTypeAndValueValid(snow2.age_modifiedAt, { startTime, endTime })
})

test('Query.prototype.replaceOne()', async () => {
  const snow: any = await Goose.create({
    name: randomName('Snow'),
  })
  const query = Goose.find()
  await (query as any).replaceOne({ _id: snow._id }, { age: 2 })

  const snow2: any = await Goose.findById(snow._id)
  expect(snow2.age).toBe(2)
  expect(snow2.name).toBeUndefined()
  expect(snow2.name_modifiedAt).toBeUndefined()
  expect(snow2.age_modifiedAt).toBeUndefined()

  // Check enable modifiedAt's function
  const startTime = moment()
  await (query as any).replaceOne(
    { _id: snow._id },
    { age: 3 },
    { modifiedAt: true }
  )

  const snow3: any = await Goose.findById(snow._id)
  expect(snow3.age).toBe(3)
  isDateTypeAndValueValid(snow3.age_modifiedAt, { startTime })
})

test('Query.prototype.setUpdate()', async () => {
  const name = randomName('Snow')
  await Goose.create({ name })

  const startTime = moment()
  const query: any = Goose.where('name', name)
  query.setUpdate({ age: 2 })
  await query.update()

  const snow: any = await Goose.findOne({ name })
  expect(snow.age).toBe(2)
  isDateTypeAndValueValid(snow.age_modifiedAt, { startTime })
})

test('Query.prototype.update()', async () => {
  const name = randomName('Snow')
  await Goose.create({ name })

  const startTime = moment()
  const query = Goose.where('name', name)
  await query.update({ age: 1 })

  const snow: any = await Goose.findOne({ name })
  expect(snow.age).toBe(1)
  isDateTypeAndValueValid(snow.age_modifiedAt, { startTime })

  // Check multiple documents see file "model-methods.ts"
})

test('Query.prototype.updateMany()', async () => {
  const name = randomName('Snow')
  await Goose.create({ name })

  const startTime = moment()

  const query: any = Goose.where('name', name)
  await query.updateMany({ age: 1 })

  const snow: any = await Goose.findOne({ name })
  expect(snow.age).toBe(1)
  isDateTypeAndValueValid(snow.age_modifiedAt, { startTime })

  // Check multiple documents see file "model-methods.ts"
})

test('Query.prototype.updateOne()', async () => {
  const name = randomName('Snow')
  await Goose.create({ name })

  const startTime = moment()

  const query: any = Goose.where('name', name)
  await query.updateOne({ age: 1 })

  const snow: any = await Goose.findOne({ name })
  expect(snow.age).toBe(1)
  isDateTypeAndValueValid(snow.age_modifiedAt, { startTime })

  // Check multiple documents see file "model-methods.ts"
})
