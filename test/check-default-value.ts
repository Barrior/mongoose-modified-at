import moment from 'moment'
import mongoose from 'mongoose'
import modifiedAt from '~/index'
import './@helpers/connect-db'
import { isDateTypeAndValueValid, randomName } from './@helpers/utils'

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
