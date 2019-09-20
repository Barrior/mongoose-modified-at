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

const Pig = mongoose.model(randomName(), schema)

test('Document.prototype.save()', async () => {
  const startTime = moment()
  const piggy: any = await Pig.create({
    name: randomName('Piggy'),
  })
  const endTime = moment()

  const startTime2 = moment()
  piggy.age = 2
  await piggy.save()
  const endTime2 = moment()

  const piggy2: any = await Pig.findById(piggy._id)
  expect(piggy2.age).toBe(2)
  isDateTypeAndValueValid(piggy2.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(piggy2.age_modifiedAt, {
    startTime: startTime2,
    endTime: endTime2,
  })

  // Skip modifiedAt's function for this create
  piggy.age = 3
  await piggy.save({ modifiedAt: false })

  const piggy3: any = await Pig.findById(piggy._id)
  expect(piggy3.age).toBe(3)
  isDateTypeAndValueValid(piggy3.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(piggy3.age_modifiedAt, {
    startTime: startTime2,
    endTime: endTime2,
  })
})

test('Document.prototype.replaceOne()', async () => {
  const piggy: any = await Pig.create({
    name: randomName('Piggy'),
  })
  await piggy.replaceOne({ age: 2 })

  const piggy2: any = await Pig.findById(piggy._id)
  expect(piggy2.age).toBe(2)
  expect(piggy2.name).toBeUndefined()
  expect(piggy2.name_modifiedAt).toBeUndefined()
  expect(piggy2.age_modifiedAt).toBeUndefined()

  // Check enable modifiedAt's function
  const startTime = moment()
  const name = randomName('Piggy')
  await piggy.replaceOne({ name, age: 3 }, { modifiedAt: true })

  const piggy3: any = await Pig.findById(piggy._id)
  expect(piggy3.name).toBe(name)
  expect(piggy3.age).toBe(3)
  isDateTypeAndValueValid(piggy3.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(piggy3.age_modifiedAt, { startTime })
})

test('Document.prototype.update()', async () => {
  const startTime = moment()
  const piggy: any = await Pig.create({
    name: randomName('Piggy'),
  })

  const startTime2 = moment()
  await piggy.update({ age: 2 })

  const piggy2: any = await Pig.findById(piggy._id)
  expect(piggy2.age).toBe(2)
  isDateTypeAndValueValid(piggy2.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(piggy2.age_modifiedAt, { startTime: startTime2 })

  // Skip modifiedAt's function for this update
  await piggy.update({ age: 3 }, { modifiedAt: false })
  const piggy3: any = await Pig.findById(piggy._id)
  expect(piggy3.age).toBe(3)
  isDateTypeAndValueValid(piggy3.age_modifiedAt, { startTime: startTime2 })

  // Check multiple documents see file "model-methods.ts"
})

test('Document.prototype.updateOne()', async () => {
  const piggy: any = await Pig.create({
    name: randomName('Piggy'),
  })

  const startTime = moment()
  await piggy.updateOne({ age: 2 })
  const endTime = moment()

  const piggy2: any = await Pig.findById(piggy._id)
  expect(piggy2.age).toBe(2)
  isDateTypeAndValueValid(piggy2.age_modifiedAt, { startTime, endTime })

  // Skip modifiedAt's function for this update
  await piggy.updateOne({ age: 3 }, { modifiedAt: false })
  const piggy3: any = await Pig.findById(piggy._id)
  expect(piggy3.age).toBe(3)
  isDateTypeAndValueValid(piggy3.age_modifiedAt, { startTime, endTime })
})
