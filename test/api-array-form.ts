import moment from 'moment'
import mongoose from 'mongoose'
import modifiedAt from '~/index'
import './@helpers/connect-db'
import { isDateTypeAndValueValid, randomName } from './@helpers/utils'

test('Base use case: Array form', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
    sex: String,
  })

  // Check Array parameter for use
  schema.plugin(modifiedAt, ['name', 'age'])

  const Cat = mongoose.model(randomName(), schema)

  // Check Model.create()
  const startTime = moment()
  const kitty: any = await Cat.create({
    name: 'Kitty',
    age: 1,
    sex: 'female',
  })
  const endTime = moment()

  expect(kitty.name).toBe('Kitty')
  expect(kitty.age).toBe(1)
  expect(kitty.sex).toBe('female')
  expect(kitty.sex_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(kitty.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(kitty.age_modifiedAt, { startTime, endTime })

  // Check document.save()
  kitty.age = 2
  const startTime2 = moment()
  const newKitty = await kitty.save()
  expect(newKitty.age).toBe(2)
  isDateTypeAndValueValid(newKitty.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(newKitty.age_modifiedAt, { startTime: startTime2 })

  // Check the document get from DB
  const kittyFromDB: any = await Cat.findById(kitty.id)
  expect(kittyFromDB.name).toBe('Kitty')
  expect(kittyFromDB.age).toBe(2)
  expect(kittyFromDB.sex).toBe('female')
  expect(kittyFromDB.sex_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(kittyFromDB.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(kittyFromDB.age_modifiedAt, { startTime: startTime2 })
})

test('Default value of Schema is not support', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: {
      type: Number,
      default: 1,
    },
  })

  schema.plugin(modifiedAt, ['name', 'age'])

  const Cat = mongoose.model(randomName(), schema)
  const startTime = moment()
  const kitty: any = await Cat.create({ name: 'Kitty' })

  expect(kitty.name).toBe('Kitty')
  expect(kitty.age).toBe(1)
  expect(kitty.age_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(kitty.name_modifiedAt, { startTime })
})
