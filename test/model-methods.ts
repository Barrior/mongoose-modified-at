import { forEach } from 'lodash'
import moment from 'moment'
import mongoose from 'mongoose'
import modifiedAt from '~/index'
import './@helpers/connect-db'
import {
  createBulk,
  isDateTypeAndValueValid,
  randomName,
} from './@helpers/utils'

const schema = new mongoose.Schema({
  name: String,
  age: Number,
  sex: String,
})

schema.plugin(modifiedAt, ['name', 'age'])

const Chicken = mongoose.model(randomName(), schema)

// This function does not trigger any middleware, not save() nor update().
// If you need to trigger save() middleware for every document use create() instead.
test.skip('Model.bulkWrite()', async () => {
  const nameEgghead = 'Egghead_bulkWrite'
  const nameFoghorn = 'Foghorn_bulkWrite'
  const bulk = [
    {
      insertOne: {
        document: { name: nameEgghead, age: 0.5 },
      },
    },
    {
      insertOne: {
        document: { name: nameFoghorn, age: 1 },
      },
    },
  ]

  const startTime = moment()
  await Chicken.bulkWrite(bulk)

  const egghead: any = await Chicken.findOne({ name: nameEgghead })
  const foghorn: any = await Chicken.findOne({ name: nameFoghorn })

  isDateTypeAndValueValid(egghead.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(egghead.age_modifiedAt, { startTime })
  isDateTypeAndValueValid(foghorn.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(foghorn.age_modifiedAt, { startTime })
})

test('Model.create()', async () => {
  // Check single document
  const startTime = moment()
  const egghead: any = await Chicken.create({
    name: randomName('Egghead'),
    age: 1,
  })

  isDateTypeAndValueValid(egghead.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(egghead.age_modifiedAt, { startTime })

  // Check multiple documents
  const bulk = createBulk()
  const startTime2 = moment()
  await Chicken.create(bulk.content)

  const firstDoc: any = await Chicken.findOne({ name: bulk.firstDocName })
  const secondDoc: any = await Chicken.findOne({ name: bulk.secondDocName })

  isDateTypeAndValueValid(firstDoc.name_modifiedAt, { startTime: startTime2 })
  isDateTypeAndValueValid(firstDoc.age_modifiedAt, { startTime: startTime2 })
  isDateTypeAndValueValid(secondDoc.name_modifiedAt, { startTime: startTime2 })
  isDateTypeAndValueValid(secondDoc.age_modifiedAt, { startTime: startTime2 })

  // Skip modifiedAt's function for this create
  // To specify options, "docs" must be an array, not a spread.
  const egghead3: any = await Chicken.create(
    [{ name: randomName('Egghead'), age: 1 }],
    { modifiedAt: false }
  )

  expect(egghead3[0].name_modifiedAt).toBeUndefined()
  expect(egghead3[0].age_modifiedAt).toBeUndefined()
})

test('Model.findByIdAndUpdate()', async () => {
  const startTime = moment()
  const egghead: any = await Chicken.create({
    name: randomName('Egghead'),
  })
  const endTime = moment()

  // Check option "new"
  const startTime2 = moment()
  const egghead2: any = await Chicken.findByIdAndUpdate(
    egghead._id,
    { age: 1 },
    { new: true }
  )

  expect(egghead2.age).toBe(1)
  isDateTypeAndValueValid(egghead2.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(egghead2.age_modifiedAt, { startTime: startTime2 })

  // Check option "upsert"
  const startTime3 = moment()
  const egghead3: any = await Chicken.findByIdAndUpdate(
    mongoose.Types.ObjectId(),
    { age: 1 },
    { upsert: true, new: true }
  )
  const endTime3 = moment()

  isDateTypeAndValueValid(egghead3.age_modifiedAt, {
    startTime: startTime3,
    endTime: endTime3,
  })

  // Skip modifiedAt's function for this update
  await Chicken.findByIdAndUpdate(egghead3._id, { age: 3 }, {
    modifiedAt: false,
  } as any)

  const egghead4: any = await Chicken.findById(egghead3._id)
  isDateTypeAndValueValid(egghead4.age_modifiedAt, {
    startTime: startTime3,
    endTime: endTime3,
  })
})

test('Model.findOneAndReplace()', async () => {
  const egghead: any = await Chicken.create({ name: randomName('Egghead') })
  await (Chicken as any).findOneAndReplace({ name: egghead.name }, { age: 2 })

  const egghead2: any = await Chicken.findById(egghead._id)
  expect(egghead2.age).toBe(2)
  expect(egghead2.name).toBeUndefined()
  expect(egghead2.name_modifiedAt).toBeUndefined()
  expect(egghead2.age_modifiedAt).toBeUndefined()

  // Check enable modifiedAt's function
  const name = randomName('Egghead')
  const startTime = moment()
  await (Chicken as any).findOneAndReplace(
    { _id: egghead._id },
    { name, age: 3 },
    { modifiedAt: true }
  )

  const egghead3: any = await Chicken.findById(egghead._id)
  expect(egghead3.name).toBe(name)
  expect(egghead3.age).toBe(3)
  isDateTypeAndValueValid(egghead3.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(egghead3.age_modifiedAt, { startTime })
})

test('Model.findOneAndUpdate()', async () => {
  const startTime = moment()
  const egghead: any = await Chicken.create({
    name: randomName('Egghead'),
  })
  const endTime = moment()

  // Check option "new"
  const startTime2 = moment()
  const egghead2: any = await Chicken.findOneAndUpdate(
    { _id: egghead._id },
    { age: 1 },
    { new: true }
  )

  expect(egghead2.age).toBe(1)
  isDateTypeAndValueValid(egghead2.name_modifiedAt, { startTime, endTime })
  isDateTypeAndValueValid(egghead2.age_modifiedAt, { startTime: startTime2 })

  // Check option "upsert"
  const startTime3 = moment()
  const egghead3: any = await Chicken.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId() },
    { age: 1 },
    { upsert: true, new: true }
  )
  const endTime3 = moment()
  isDateTypeAndValueValid(egghead3.age_modifiedAt, {
    startTime: startTime3,
    endTime: endTime3,
  })

  // Skip modifiedAt's function for this update
  await Chicken.findOneAndUpdate({ _id: egghead3._id }, { age: 3 }, {
    modifiedAt: false,
  } as any)

  const egghead4: any = await Chicken.findById(egghead3._id)
  isDateTypeAndValueValid(egghead4.age_modifiedAt, {
    startTime: startTime3,
    endTime: endTime3,
  })
})

test('Model.insertMany()', async () => {
  const bulk = createBulk()
  const startTime = moment()
  await Chicken.insertMany(bulk.content)

  const firstDoc: any = await Chicken.findOne({ name: bulk.firstDocName })
  const secondDoc: any = await Chicken.findOne({
    name: bulk.secondDocName,
  })

  expect(firstDoc.sex_modifiedAt).toBeUndefined()
  isDateTypeAndValueValid(firstDoc.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(firstDoc.age_modifiedAt, { startTime })
  isDateTypeAndValueValid(secondDoc.name_modifiedAt, { startTime })
  isDateTypeAndValueValid(secondDoc.age_modifiedAt, { startTime })

  // Skip modifiedAt's function for this create
  const bulk2 = createBulk()
  await Chicken.insertMany(bulk2.content, { modifiedAt: false } as any)

  const firstDoc2: any = await Chicken.findOne({ name: bulk2.firstDocName })
  const secondDoc2: any = await Chicken.findOne({
    name: bulk2.secondDocName,
  })

  expect(firstDoc2.name_modifiedAt).toBeUndefined()
  expect(firstDoc2.age_modifiedAt).toBeUndefined()
  expect(secondDoc2.name_modifiedAt).toBeUndefined()
  expect(secondDoc2.age_modifiedAt).toBeUndefined()
})

test('Model.replaceOne()', async () => {
  const egghead: any = await Chicken.create({
    name: randomName('Egghead'),
  })
  await (Chicken as any).replaceOne({ name: egghead.name }, { age: 2 })

  const egghead2: any = await Chicken.findById(egghead._id)
  expect(egghead2.age).toBe(2)
  expect(egghead2.name).toBeUndefined()
  expect(egghead2.name_modifiedAt).toBeUndefined()
  expect(egghead2.age_modifiedAt).toBeUndefined()

  // Check enable modifiedAt's function
  const startTime = moment()
  await (Chicken as any).replaceOne(
    { _id: egghead._id },
    { age: 3 },
    { modifiedAt: true }
  )

  const egghead3: any = await Chicken.findById(egghead._id)
  expect(egghead3.age).toBe(3)
  isDateTypeAndValueValid(egghead3.age_modifiedAt, { startTime })
})

test('Model.update()', async () => {
  const egghead: any = await Chicken.create({
    name: randomName('Egghead'),
  })

  const startTime = moment()
  await Chicken.update({ _id: egghead._id }, { age: 2 })
  const endTime = moment()

  const egghead2: any = await Chicken.findById(egghead._id)
  isDateTypeAndValueValid(egghead2.age_modifiedAt, { startTime, endTime })

  // Skip modifiedAt's function for this update
  await Chicken.update({ _id: egghead._id }, { age: 3 }, { modifiedAt: false })
  const egghead3: any = await Chicken.findById(egghead._id)
  isDateTypeAndValueValid(egghead3.age_modifiedAt, { startTime, endTime })

  // Check multiple documents should be updated
  const nameEgghead = randomName('Egghead_update_multi')
  const bulk = [{ name: nameEgghead, age: 0.5 }, { name: nameEgghead, age: 1 }]
  await Chicken.create(bulk)
  const startTime2 = moment()
  await Chicken.update({ name: nameEgghead }, { age: 3 }, { multi: true })
  const endTime2 = moment()

  const eggheads: any = await Chicken.find({ name: nameEgghead })
  forEach(eggheads, doc => {
    isDateTypeAndValueValid(doc.age_modifiedAt, {
      startTime: startTime2,
      endTime: endTime2,
    })
  })
})

test('Model.updateMany()', async () => {
  const nameEgghead = randomName('Egghead_updateMany')
  const bulk = [{ name: nameEgghead, age: 0.5 }, { name: nameEgghead, age: 1 }]
  await Chicken.create(bulk)

  const startTime = moment()
  await Chicken.updateMany({ name: nameEgghead }, { age: 3 })
  const endTime = moment()

  async function eachDocs(age: number) {
    const eggheads: any = await Chicken.find({ name: nameEgghead })
    forEach(eggheads, doc => {
      expect(doc.age).toBe(age)
      isDateTypeAndValueValid(doc.age_modifiedAt, {
        startTime,
        endTime,
      })
    })
  }

  await eachDocs(3)

  // Skip modifiedAt's function for this update
  await Chicken.updateMany(
    { name: nameEgghead },
    { age: 4 },
    { modifiedAt: false }
  )
  await eachDocs(4)
})

test('Model.updateOne()', async () => {
  const egghead: any = await Chicken.create({
    name: randomName('Egghead'),
  })

  const startTime = moment()
  await Chicken.updateOne({ _id: egghead._id }, { age: 3 })
  const endTime = moment()

  const egghead2: any = await Chicken.findById(egghead._id)
  isDateTypeAndValueValid(egghead2.age_modifiedAt, { startTime, endTime })

  // Skip modifiedAt's function for this update
  await Chicken.updateOne(
    { _id: egghead._id },
    { age: 4 },
    { modifiedAt: false }
  )
  const egghead3: any = await Chicken.findById(egghead._id)
  isDateTypeAndValueValid(egghead3.age_modifiedAt, { startTime, endTime })
})
