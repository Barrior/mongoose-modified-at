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
