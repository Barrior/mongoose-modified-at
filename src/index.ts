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

function handleOptions(options: string[] | IOptions) {
  let suffix: string = modifiedAt.suffix
  let fields: string[] = []
  let select: boolean = true
  const customList: {
    [key: string]: (doc: IObjectAny) => boolean | undefined | null
  } = {}

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
    throw Error('Missing options or type error of parameter "options"')
  }

  return { suffix, select, fields, customList }
}

function modifiedAt(schema: any, options: string[] | IOptions): void {
  const { suffix, select, fields, customList } = handleOptions(options)

  function addTimeFieldToSchema(pathname: string): void {
    schema.add({
      [pathname]: { type: Date, select },
    })
  }

  // Add schema for every field
  forEach(fields, field => {
    addTimeFieldToSchema(field + suffix)
  })

  // tslint:disable-next-line:variable-name
  forEach(customList, (_value, pathname) => {
    addTimeFieldToSchema(pathname)
  })

  async function setTimestamps(params: {
    that?: any
    purelySet?: boolean
    doc: any
    modifiedPaths: string[]
  }) {
    const purelySet = params.hasOwnProperty('purelySet')
      ? params.purelySet
      : true

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
      if (purelySet) {
        params.that.set(pathname, updateTime)
      } else {
        params.that[pathname] = updateTime
      }
    })
  }

  // for Document
  // tslint:disable-next-line:variable-name
  schema.pre('save', async function(this: any, _next: any, opts: any) {
    if (get(opts, 'modifiedAt') === false) {
      return
    }
    await setTimestamps({
      that: this,
      doc: this,
      modifiedPaths: this.modifiedPaths(),
    })
  })

  // for Query
  const updateHooks = ['findOneAndUpdate', 'update', 'updateOne', 'updateMany']
  schema.pre(updateHooks, async function(this: any) {
    const opts = this.getOptions()
    if (opts.modifiedAt === false) {
      return
    }
    const updates = this.getUpdate()
    await setTimestamps({
      that: this,
      doc: assign({}, this.getFilter(), updates),
      modifiedPaths: keys(updates),
    })
  })

  // for Query
  const replaceHooks = ['findOneAndReplace', 'replaceOne']
  schema.pre(replaceHooks, async function(this: any) {
    const opts = this.getOptions()
    if (opts.modifiedAt === true) {
      const updates = JSON.parse(JSON.stringify(this.getUpdate()))
      await setTimestamps({
        that: updates,
        doc: assign({}, this.getFilter(), updates),
        modifiedPaths: keys(updates),
        purelySet: false,
      })
      this.setUpdate(updates)
    }
  })

  // for Model
  // tslint:disable-next-line:variable-name only-arrow-functions
  schema.pre('insertMany', async function(_next: any, docs: any[], opts: any) {
    if (get(opts, 'modifiedAt') === false) {
      return
    }
    for (const doc of docs) {
      await setTimestamps({
        that: doc,
        doc,
        modifiedPaths: keys(doc),
        purelySet: false,
      })
    }
  })
}

modifiedAt.suffix = '_modifiedAt'

export default modifiedAt
