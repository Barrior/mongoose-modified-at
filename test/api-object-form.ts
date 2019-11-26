import P from 'bluebird'
import moment from 'moment'
import mongoose from 'mongoose'
import modifiedAt from '~/index'
import './@helpers/connect-db'
import { isDateTypeAndValueValid, randomName } from './@helpers/utils'

test('Check function type fields', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
    sex: String,
    // 1: in purchasing, 2: bought, 3: sold
    status: Number,
  })

  schema.plugin(modifiedAt, {
    fields: ['name', 'age'],
    boughtAt(doc: any) {
      return doc.status === 2
    },
    soldAt(doc: any) {
      return doc.status === 3
    },
  })

  const Dog = mongoose.model(randomName(), schema)

  // Check Model.create()
  const startTime = moment()
  const lucky: any = await Dog.create({
    name: 'Lucky',
    age: 1,
    sex: 'male',
    status: 1,
  })
  const endTime = moment()

  expect(lucky.name).toBe('Lucky')
  expect(lucky.age).toBe(1)
  expect(lucky.sex).toBe('male')
  expect(lucky.status).toBe(1)
  expect(lucky.sex_modifiedAt).toBeUndefined()
  expect(lucky.status_modifiedAt).toBeUndefined()
  expect(lucky.boughtAt).toBeUndefined()
  expect(lucky.soldAt).toBeUndefined()
  isDateTypeAndValueValid(lucky.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(lucky.age_modifiedAt, { startTime, endTime })

  const startTime2 = moment()
  lucky.status = 2
  await lucky.save()
  const endTime2 = moment()
  expect(lucky.status_modifiedAt).toBeUndefined()
  expect(lucky.soldAt).toBeUndefined()
  isDateTypeAndValueValid(lucky.boughtAt, {
    startTime: startTime2,
    endTime: endTime2,
  })

  const startTime3 = moment()
  lucky.status = 3
  await lucky.save()
  expect(lucky.status_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(lucky.boughtAt, {
    startTime: startTime2,
    endTime: endTime2,
  })
  isDateTypeAndValueValid(lucky.soldAt, { startTime: startTime3 })
})

test('Check async function type fields', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
    sex: String,
    // 1: in purchasing, 2: bought, 3: sold
    status: Number,
  })

  schema.plugin(modifiedAt, {
    async boughtAt(doc: any) {
      await P.delay(1000)
      return doc.status === 2
    },
    soldAt(doc: any) {
      return doc.status === 3
    },
  })

  const Dog = mongoose.model(randomName(), schema)

  const jack: any = await Dog.create({
    name: 'Jack',
    age: 1,
    sex: 'male',
    status: 1,
  })

  expect(jack.boughtAt).toBeUndefined()
  expect(jack.soldAt).toBeUndefined()

  const startTime = moment()
  jack.status = 2
  await jack.save()
  const endTime = moment()
  expect(jack.soldAt).toBeUndefined()
  isDateTypeAndValueValid(jack.boughtAt, { startTime, endTime })

  const startTime2 = moment()
  jack.status = 3
  await jack.save()
  isDateTypeAndValueValid(jack.boughtAt, { startTime, endTime })
  isDateTypeAndValueValid(jack.soldAt, { startTime: startTime2 })
})

test('Check "suffix" parameter', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
  })

  schema.plugin(modifiedAt, {
    suffix: '_modified_at',
    fields: ['name'],
  })

  const Dog = mongoose.model(randomName(), schema)

  const startTime = moment()
  const rosie: any = await Dog.create({
    name: 'Rosie',
  })

  expect(rosie.name_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(rosie.name_modified_at, { startTime })
})

test('Check "select" parameter', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
  })

  schema.plugin(modifiedAt, {
    select: false,
    fields: ['name'],
  })

  const Dog = mongoose.model(randomName(), schema)

  const startTime = moment()
  const ace: any = await Dog.create({
    name: 'Ace',
  })
  const endTime = moment()

  isDateTypeAndValueValid(ace.name_modifiedAt, { startTime, endTime })

  const ace2: any = await Dog.findById(ace.id)
  expect(ace2.name_modifiedAt).toBeUndefined()

  const ace3: any = await Dog.findById(ace.id, 'name_modifiedAt')
  isDateTypeAndValueValid(ace3.name_modifiedAt, { startTime, endTime })
})

test('key type is not function should be ignored', async () => {
  const schema = new mongoose.Schema({
    name: String,
    age: Number,
    // 1: in purchasing, 2: bought, 3: sold
    status: Number,
  })

  schema.plugin(modifiedAt, {
    async boughtAt() {
      await P.delay(1000)
      return false
    },
    soldAt: true,
  })

  const Dog = mongoose.model(randomName(), schema)

  const jack: any = await Dog.create({
    name: 'Jack',
    age: 1,
    status: 1,
  })

  expect(jack.boughtAt).toBeUndefined()
  expect(jack.soldAt).toBeUndefined()

  jack.status = 2
  await jack.save()
  expect(jack.boughtAt).toBeUndefined()
  expect(jack.soldAt).toBeUndefined()
})
