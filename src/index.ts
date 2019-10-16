import {
  assign,
  forEach,
  get,
  includes,
  isArray,
  isBoolean,
  isFunction,
  isPlainObject,
  isString,
  keys,
  omit,
} from 'lodash'

export interface IOptions {
  suffix?: string
  select?: boolean
  fields?: string[]
  [key: string]: any
}

export interface IObjectAny {
  [key: string]: any
}

export interface ICustomList {
  [key: string]: (doc: IObjectAny) => boolean | undefined | null
}

export type ICorrectOptions = Required<IOptions> & {
  customList: ICustomList
}

const pluginName: string = 'modifiedAt'

// Does not support "$setOnInsert", "$min" and "$max".
const operators = ['$mul', '$inc', '$currentDate', '$set'] as ReadonlyArray<
  string
>

class ModifiedAt {
  constructor(
    public readonly schema: any,
    public readonly options: ICorrectOptions
  ) {
    this.schema = schema
    this.options = options
    this.initializeFieldSchema()
    this.addHooks()
  }

  public addPathToSchema(pathname: string) {
    const { select } = this.options
    this.schema.add({
      [pathname]: { type: Date, select },
    })
  }

  public initializeFieldSchema() {
    const { suffix, fields, customList } = this.options

    // Add schema for every field
    forEach(fields, field => {
      this.addPathToSchema(field + suffix)
    })

    // tslint:disable-next-line:variable-name
    forEach(customList, (_value, pathname) => {
      this.addPathToSchema(pathname)
    })
  }

  public async setTimestamps(params: {
    that?: any
    doc: any
    modifiedPaths: string[]
    writingType?: number
  }) {
    const { suffix, fields, customList } = this.options

    const updatePaths: string[] = []
    let updateTime: Date = new Date()

    forEach(params.modifiedPaths, path => {
      if (includes(fields, path)) {
        updatePaths.push(path + suffix)
      }
    })

    for (const pathname in customList) {
      if (customList.hasOwnProperty(pathname)) {
        const truly = await customList[pathname](params.doc)
        if (truly) {
          updateTime = new Date()
          updatePaths.push(pathname)
        }
      }
    }

    forEach(updatePaths, pathname => {
      switch (params.writingType) {
        case 1:
          params.that.set(pathname, updateTime)
          break
        case 2:
          params.that.update({}, { [pathname]: updateTime })
          break
        default:
          params.that[pathname] = updateTime
      }
    })
  }

  public addHooks() {
    const $this = this

    // for Document
    this.schema.pre('save', async function(this: any, next: any) {
      await $this.setTimestamps({
        that: this,
        doc: this,
        modifiedPaths: this.modifiedPaths(),
        writingType: 1,
      })
      next()
    })

    // for Query
    // prettier-ignore
    const updateHooks = ['findOneAndUpdate', 'update', 'updateOne', 'updateMany']
    forEach(updateHooks, hook => {
      this.schema.pre(hook, async function(this: any, next: any) {
        if (get(this.options, pluginName) === false) {
          return next()
        }
        const updates: any = {}
        forEach(this.getUpdate(), (value, key) => {
          if (includes(operators, key) && isPlainObject(value)) {
            assign(updates, value)
          } else {
            updates[key] = value
          }
        })
        await $this.setTimestamps({
          that: this,
          doc: updates,
          modifiedPaths: keys(updates),
          writingType: 2,
        })
        next()
      })
    })

    // for Query
    this.schema.pre('replaceOne', async function(this: any, next: any) {
      if (get(this.options, pluginName) === true) {
        const updates: any = {}
        let is$op = false
        forEach(this.getUpdate(), (value, key) => {
          if (includes(operators, key) && isPlainObject(value)) {
            is$op = true
            assign(updates, value)
          } else {
            updates[key] = value
          }
        })

        let closedUpdates = this.getUpdate()
        if (is$op) {
          if (!closedUpdates.$set) {
            closedUpdates.$set = {}
          }
          closedUpdates = closedUpdates.$set
        }

        await $this.setTimestamps({
          that: closedUpdates,
          doc: updates,
          modifiedPaths: keys(updates),
        })
      }
      next()
    })

    // for Model
    // prettier-ignore
    // tslint:disable-next-line:only-arrow-functions
    this.schema.pre('insertMany', async function(next: any, docs: any[], opts: any) {
      if (get(opts, pluginName) === false) {
        return next()
      }
      for (const doc of docs) {
        await $this.setTimestamps({
          that: doc,
          doc,
          modifiedPaths: keys(doc),
        })
      }
      next()
    })
  }
}

function handleOptions(options: string[] | IOptions): ICorrectOptions {
  let suffix: string = modifiedAt.suffix
  let fields: string[] = []
  let select: boolean = true
  const customList: ICustomList = {}

  if (isArray(options)) {
    fields = options
  } else if (isPlainObject(options)) {
    if (isString(options.suffix)) {
      suffix = options.suffix
    }

    if (isBoolean(options.select)) {
      select = options.select
    }

    if (isArray(options.fields)) {
      fields = options.fields
    }

    forEach(omit(options, ['suffix', 'select', 'fields']), (value, key) => {
      if (isFunction(value)) {
        customList[key] = value
      }
    })
  } else {
    throw Error('Missing options or type error of parameter "options".')
  }

  return { suffix, select, fields, customList }
}

function modifiedAt(schema: any, options: string[] | IOptions) {
  return new ModifiedAt(schema, handleOptions(options))
}

modifiedAt.suffix = '_modifiedAt'

export default modifiedAt
