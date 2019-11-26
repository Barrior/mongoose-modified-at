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
    softlySet?: boolean
    doc: any
    modifiedPaths: string[]
  }) {
    const { suffix, fields, customList } = this.options
    const softlySet = params.hasOwnProperty('softlySet')
      ? params.softlySet
      : true

    const updatePaths: string[] = []
    let updateTime: Date = new Date()

    forEach(params.modifiedPaths, path => {
      if (includes(fields, path)) {
        updatePaths.push(path + suffix)
      }
    })

    for (const pathname in customList) {
      /* istanbul ignore if */
      if (customList.hasOwnProperty(pathname)) {
        const truthy = await customList[pathname](params.doc)
        if (truthy) {
          updateTime = new Date()
          updatePaths.push(pathname)
        }
      }
    }

    forEach(updatePaths, pathname => {
      if (softlySet) {
        params.that.set(pathname, updateTime)
      } else {
        params.that[pathname] = updateTime
      }
    })
  }

  public addHooks() {
    const $this = this

    // for Document
    // tslint:disable-next-line:variable-name
    this.schema.pre('save', async function(this: any, _next: any, opts: any) {
      if (get(opts, pluginName) === false) {
        return
      }
      await $this.setTimestamps({
        that: this,
        doc: this,
        modifiedPaths: this.modifiedPaths(),
      })
    })

    // for Query
    // prettier-ignore
    const updateHooks = ['findOneAndUpdate', 'update', 'updateOne', 'updateMany']
    this.schema.pre(updateHooks, async function(this: any) {
      if (get(this.getOptions(), pluginName) === false) {
        return
      }
      const updates = this.getUpdate()
      await $this.setTimestamps({
        that: this,
        doc: assign({}, this.getFilter(), updates),
        modifiedPaths: keys(updates),
      })
    })

    // for Query
    const replaceHooks = ['findOneAndReplace', 'replaceOne']
    this.schema.pre(replaceHooks, async function(this: any) {
      if (get(this.getOptions(), pluginName) === true) {
        const updates = JSON.parse(JSON.stringify(this.getUpdate()))
        await $this.setTimestamps({
          that: updates,
          doc: assign({}, this.getFilter(), updates),
          modifiedPaths: keys(updates),
          softlySet: false,
        })
        this.setUpdate(updates)
      }
    })

    // for Model
    // prettier-ignore
    // tslint:disable-next-line:variable-name only-arrow-functions
    this.schema.pre('insertMany', async function(_next: any, docs: any[], opts: any) {
      if (get(opts, pluginName) === false) {
        return
      }
      for (const doc of docs) {
        await $this.setTimestamps({
          that: doc,
          doc,
          modifiedPaths: keys(doc),
          softlySet: false,
        })
      }
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
