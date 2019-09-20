import Chance from 'chance'
import moment, { MomentInput } from 'moment'

const chance = new Chance()

export function randomName(prefix?: string): string {
  const randomStr = chance.string({ length: 10, alpha: true })
  return prefix ? `${prefix}_${randomStr}` : randomStr
}

export function createBulk() {
  const firstDocName = randomName('createBulk')
  const secondDocName = randomName('createBulk')
  const content = [
    { name: firstDocName, age: 1, sex: 'male' },
    { name: secondDocName, age: 2, sex: 'male' },
  ]
  return { content, firstDocName, secondDocName }
}

export function isDateTypeAndValueValid(
  modifiedTime: any,
  params: { startTime: MomentInput; endTime?: MomentInput }
): void {
  expect(modifiedTime instanceof Date).toBe(true)

  const modifiedTimeValue: number = moment(modifiedTime).valueOf()
  const startTime: number = moment(params.startTime).valueOf()
  const endTime: number = moment(params.endTime || new Date()).valueOf()

  expect(startTime <= modifiedTimeValue && modifiedTimeValue <= endTime).toBe(
    true
  )
}
