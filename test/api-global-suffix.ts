import moment from 'moment'
import mongoose from 'mongoose'
import modifiedAt from '~/index'
import './@helpers/connect-db'
import { isDateTypeAndValueValid, randomName } from './@helpers/utils'

modifiedAt.suffix = '_my_modified_at'

test('Use public "suffix"', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
  })

  schema.plugin(modifiedAt, ['name'])

  const Duck = mongoose.model(randomName(), schema)

  const startTime = moment()
  const ducky: any = await Duck.create({
    name: 'Ducky',
  })

  expect(ducky.name_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(ducky.name_my_modified_at, { startTime })
})

test('Use private "suffix"', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
  })

  schema.plugin(modifiedAt, {
    suffix: '_modified_at',
    fields: ['name'],
  })

  const Duck = mongoose.model(randomName(), schema)

  const startTime = moment()
  const happy: any = await Duck.create({
    name: 'Happy',
  })

  expect(happy.name_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(happy.name_modified_at, { startTime })
})
