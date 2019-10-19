## mongoose-modified-at

Mongoose plugin that tracking the fields you specified and automatically record the change time of them into DB. It just like timestamps function of Mongoose itself.

Here is the **mongoose-modified-at 1.x** version for support **Mongoose 4.x**, if you using **Mongoose 5.x** now please migrating to [2.x version](https://github.com/Barrior/mongoose-modified-at).


### Table of Contents

- [Example](#example)
- [API Intro](#api-intro)
- [Support Async](#support-async)
- [Details](#details)
- [Changelog](#changelog)
- [License](#license)


### Example

Consider an example, we need provide a website for users to publish and display their own articles. The data schema looks just like this:

```javascript
const schema = new mongoose.Schema({
  title: String,
  is_draft: Boolean,
  is_recommended: Boolean,
  // more fields...
})
```

当我们在展示最新文章列表时，应该是以文章第一次发布的时间倒序展示，因为文章可以存为草稿，多次编辑，所以不能用 `Mongoose` 提供的 `createdAt` 或 `updatedAt`作为第一次发布的时间，正确的做法是在每次文章创建或更新时，确定用户是发布文章而不是存为草稿，然后记录此次时间，用该时间作为第一次发布的时间。

要实现该功能我们需要在代码逻辑层进行处理，这样比较耦合，但也可行，或者自己封装一个 `Mongoose` 中间件来做这件事，不过现在你可以把这件事交给一个经受测试、`API` 优雅的插件 `ModifiedAt` 来处理。

First, you could install plugin. 

```bash
npm install mongoose-modified-at@1
```

Then simply configure the schema on it initialization, as follow:

```javascript
import modifiedAt from 'mongoose-modified-at'

// before mongoose.model invoked
schema.plugin(modifiedAt, {
  // function name will as field name insert to database.
  publishedAt(doc) {
    // when returns a value of true, the time is recorded.
    return !doc.is_draft
  },
  // recommend article same as above.
  recommendedAt(doc) {
    return doc.is_recommended
  }
})

const YourModel = mongoose.model('ModelName', schema)
```

When the document is saved or updated with the `is_draft` field and the value of `false`, the plugin will have recorded the time to the `publishedAt` field you declared and written in database.

Just like this：

```javascript
await YourModel.create({
  title: 'Document Title',
  is_draft: false,
  is_recommended: true,
  // more fields...
})
```

Results from database：

```javascript
{
  "title": "Document Title",
  "is_draft": false,
  "is_recommended": true,
  "publishedAt": ISODate("2019-09-27T03:11:07.880Z"),
  "recommendedAt": ISODate("2019-09-27T03:11:07.880Z"),
  // more fields...
}
```


### API Intro

The above is the rich API form of ModifiedAt, all the options are as follow:

```javascript
schema.plugin(modifiedAt, {
  // watch fields
  fields: ['name', 'status', 'another'],
  // set suffix
  suffix: '_your_suffix',
  // set "select()" behavior for paths
  select: true,
  customField(doc) {
    // do something what you want to do, 
    // then return a boolean value that telling plugin record the time or not.
  },
})
```

🍎 Explains:

- `fields`: Set observing fields. If the fields being monitored changes when the document is saved or updated, the fields update time is automatically recorded in the form of `field name + suffix`. Optional, `Array` type.

- `suffix`: Set suffix, default value is `_modifiedAt`. Optional, `String` type.

- `select`: Set `select()` behavior for paths, see [Mongoose documentation](https://mongoosejs.com/docs/api.html#schematype_SchemaType-select) for more details about it. Default value of `true`. Optional, `Boolean` type. 

- `customField`: Custom filed that used for custom logic, the function receives the unique parameter `document`, when returns `truly` value, the time will be recorded to the field. This field will not be suffixed.

🌟 **1、** You can set the global suffix on application initialization, it will be used for each plugin instance, as follow:

```javascript
import modifiedAt from 'mongoose-modified-at'
modifiedAt.suffix = '_your_suffix'
```

🚀 **2、** In order to increase the simplicity and ease of use of API while avoiding excessive overloads, ModifiedAt has only added a simplified format for the parameters, as follow:

```javascript
schema.plugin(modifiedAt, ['name', 'status'])
```

This means that the `fields` option is extracted as a parameter and the result as follow.

```javascript
{
  "name": "Tom",
  "status": 1,
  "name_modifiedAt": ISODate("2019-09-27T03:13:17.888Z"),
  "status_modifiedAt": ISODate("2019-09-27T03:13:17.888Z"),
}
```


### Support Async

You need `Node.js` to support `async/await`.

```javascript
import P from 'bluebird'

const petSchema = new mongoose.Schema({
  name: String,
  age: Number,
  sex: String,
  // 1: in purchasing, 2: bought, 3: sold
  status: Number,
})

petSchema.plugin(modifiedAt, {
  // record when you bought it 
  async boughtAt(doc) {
    // delay 1s
    await P.delay(1000)
    return doc.status === 2
  },
  // record when you sold it
  soldAt(doc) {
    return doc.status === 3
  },
})
```


### Details

👍 **1、** 对于 `update` 系列操作，可通过在 `options` 里加上 `{ modifiedAt: false }` 来跳过插件功能，对于此次更新。

`JavaScript` 示例如：`Model.updateOne({}, { status: 2 }, { modifiedAt: false })`

`TypeScript` 示例如：`Model.updateOne({}, { status: 2 }, { modifiedAt: false } as any)`

<br>

🤟 **2、** 对于 `replace` 系列操作，`ModifiedAt` 功能默认是关闭的，因为替换操作可能是想换成纯粹的数据，当然如果也需要 `ModifiedAt` 功能，则可以在 `options` 里加上 `{ modifiedAt: true }` 来为此次操作开启插件功能。

示例如：`Model.findOneAndReplace({}, { status: 2 }, { modifiedAt: true })`

相关  `API` 列表如下：

- Model.replaceOne()
- Query.prototype.replaceOne()
- Document.prototype.replaceOne()

<br>

🙌  **3、** 支持 `MongoDB` 原生操作符，如 `$set, $inc, $currentDate, $mul`，不支持 `$setOnInsert, $min, $max`。

示例如：`updateOne({}, { $inc: { quantity: 5 } })`

<br>

🖐 **4、** 不支持 `Model.bulkWrite()` 操作，如[官方文档](https://mongoosejs.com/docs/api/model.html#model_Model.bulkWrite)所描述，该操作不会触发任何中间件，如果需要触发 `save()` 中间件请使用 `Model.create()` 替代。

虽然结果相同，但性能不同，如果同时要兼顾性能，可自行在 `bulkWrite()` 数据里加上时间。

<br>

🖐 **5、** `Model.create()` 不支持指定 `options`，因为 `Mongoose 4.x` 不支持，如需传参请升级 `Mongoose`。

<br>

🖐 **6、** 插件不支持 `Schema` 的默认值，因为无法监听获取；示例如下：

```javascript
const schema = new mongoose.Schema({
  name: String,
  age: {
    type: Number,
    default: 1,
  },
})

schema.plugin(modifiedAt, ['name', 'age'])

const Cat = mongoose.model('Cat', schema)

const kitty = await Cat.create({ name: 'Kitty' })

// 结果如下，如果希望 age 被监听到，请在 create 里指定 age 属性
// kitty.name => 'Kitty'
// kitty.name_modifiedAt => ISODate("2019-09-27T03:13:17.888Z")
// kitty.age => 1
// kitty.age_modifiedAt => 不存在
```


### Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/Barrior/mongoose-modified-at/releases).


### License

[MIT licensed](./LICENSE).
