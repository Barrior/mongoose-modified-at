## mongoose-modified-at

`Mongoose`  插件 - 自动更新字段变化的时间并记录到数据库中；类似 `Mongoose` 自带的 `timestamps` 功能，但不是它。



### 使用场景

考虑一个例子，我们有个文章发布与展示的需求，数据模型如下（为了简洁便于理解省去了长度、有效值等的校验，实际生产时还是必要加上的，以免出现脏数据）。

```javascript
const schema = new mongoose.Schema({
  // 文章标题
  title: String,
  // 是否为草稿
  is_draft: Boolean,
  // 是否推荐
  is_recommended: Boolean,
  // 更多字段...
})
```

当我们在展示最新文章列表时，应该是以文章第一次发布的时间倒序展示，因为文章可以存为草稿，多次编辑，所以不能用 `Mongoose` 提供的 `createdAt` 或 `updatedAt`作为第一次发布的时间，正确的做法是在每次文章创建或更新时，确定用户是发布文章而不是存为草稿，然后记录此次时间，用该时间作为第一次发布的时间。

要实现该功能我们需要在代码逻辑层进行处理，这样比较耦合，但也可行，或者自己封装一个 `Mongoose` 中间件来做这件事，不过现在你可以把这件事交给一个经受测试、`API` 优雅的插件 `ModifiedAt` 来处理。

首先安装插件。

```bash
npm install mongoose-modified-at
```

然后在 `Schema` 初始化时做简单的配置即可，如下。

```javascript
import modifiedAt from 'mongoose-modified-at'

// 在 mongoose.model 调用之前
schema.plugin(modifiedAt, {
  // 声明记录时间的字段名
  publishedAt(doc) {
    // 当函数返回值为 true 时，则记录该时间
    return !doc.is_draft
  },
  // 推荐文章也是如此
  recommendedAt(doc) {
    return doc.is_recommended
  }
})

const YourModel = mongoose.model('ModelName', schema)
```

当文档保存或更新携带着 `is_draft` 字段并且值为 `false` 时，插件就会记录此次时间到你声明的 `publishedAt` 字段上一起写入数据库。

示例如下：

```javascript
await YourModel.create({
  title: 'Document Title',
  is_draft: false,
  is_recommended: true,
  // 更多字段...
})
```

结果如下（数据库）：

```javascript
{
  "title": "Document Title",
  "is_draft": false,
  "is_recommended": true,
  "publishedAt": ISODate("2019-09-27T03:11:07.880Z"),
  "recommendedAt": ISODate("2019-09-27T03:11:07.880Z"),
  // 更多字段...
}
```



### API介绍

上面是 `ModifiedAt` 的富 `API` 形式，即对象格式，全部参数选项如下。

```javascript
schema.plugin(modifiedAt, {
  // 设置监听字段
  fields: ['name', 'status', 'another'],
  // 设置后缀
  suffix: '_my_modified_at',
  // 设置路径默认行为
  select: true,
  // 自定义字段
  customField(doc) {
    // 做一些你想做的事，然后返回 Boolean 值，告诉插件是否记录时间
  },
})
```

参数解释：

- `fields`: 设置监听字段，在文档创建或更新时，如果被监听的字段有改变，则自动以 `字段名 + 后缀` 的形式记录字段更新时间。可选，`Array` 类型。
- `suffix`: 设置后缀，默认值为 `_modifiedAt`。可选，`String` 类型。
- `select`: 设置路径默认行为，默认为 `true` ，[参考 mongoose 文档](https://mongoosejs.com/docs/api.html#schematype_SchemaType-select)。可选，`Boolean` 类型。
- `customField`: 自定义字段，此字段不会加后缀，以函数形式添加到参数中，用于自定义功能，函数接收唯一文档参数，当函数返回值为真值时，则记录此次时间到该字段上。



**1、** 如果需要设置全局后缀，可在应用程序初始化时设置一次即可，如下。

```javascript
// app.js
import modifiedAt from 'mongoose-modified-at'
modifiedAt.suffix = '_my_modified_at'
```



**2、** 为了增加  `API`  的简洁易用同时避免过度重载，`ModifiedAt` 只增加了一种简化传参格式，如下。

```javascript
schema.plugin(modifiedAt, ['name', 'status'])
```

意思是将 `fields` 选项提取出来作为参数，写入数据库的结果如下。

```javascript
{
  "name": "Tom",
  "status": 1,
  "name_modifiedAt": ISODate("2019-09-27T03:13:17.888Z"),
  "status_modifiedAt": ISODate("2019-09-27T03:13:17.888Z"),
}
```



### 支持异步（Async）

```javascript
import P from 'bluebird'

const petSchema = new mongoose.Schema({
  name: String,
  age: Number,
  sex: String,
  // 1：表示采购中，2：已购买，3：已售出
  status: Number,
})

petSchema.plugin(modifiedAt, {
  // 记录购买于哪时
  async boughtAt(doc) {
    // 延时 1s
    await P.delay(1000)
    return doc.status === 2
  },
  // 记录售出于哪时
  soldAt(doc) {
    return doc.status === 3
  },
})
```



### 细节说明

👍 **1、** 对于 `update` 系列操作，可通过在 `options` 里加上 `{ modifiedAt: false }` 来跳过插件功能，对于此次更新。

`JavaScript` 示例如：`Model.updateOne({}, { status: 2 }, { modifiedAt: false })`

`TypeScript` 示例如：`Model.updateOne({}, { status: 2 }, { modifiedAt: false } as any)`



🙌 **2、** 如果要为 `Model.create()`  指定 `options`，文档需要是数组，如 [Mongoose 的描述](https://mongoosejs.com/docs/api/model.html#model_Model.create)：

```javascript
[options] «Object» Options passed down to save(). To specify options, docs must be an array, not a spread.
```



🤟 **3、** 对于 `replace` 系列操作，`modifiedAt` 功能默认是关闭的，因为替换操作可能是想换成纯粹的数据，当然如果也需要 `modifiedAt` 功能，则可以在 `options` 里加上 `{ modifiedAt: true }` 来为此次操作开启插件功能。

示例如：`Model.findOneAndReplace({}, { status: 2 }, { modifiedAt: true })`

相关  `API` 列表如下：

- Model.findOneAndReplace()

- Model.replaceOne()
- Query.prototype.findOneAndReplace()
- Query.prototype.replaceOne()
- Document.prototype.replaceOne()



🖐 **4、** 暂不支持 `Model.bulkWrite()` 操作，如[官方文档](https://mongoosejs.com/docs/api/model.html#model_Model.bulkWrite)所描述，该操作不会触发任何中间件，如果需要触发 `save()` 中间件请使用 `Model.create()` 替代。

虽然结果相同，但性能不同，如果同时要兼顾性能，可自行在 `bulkWrite()` 数据里加上时间。



🖐 **5、** 暂不支持 `MongoDB` 原生操作符，如 `$set, $inc, $min` 等。

示例如：`updateOne({}, { $inc: { quantity: 5 } })`



### 版本支持

该插件 `2.x` 版本支持于 `Mongoose 5.x` 的版本，如果你使用的是 `Mongoose 4.x` 的版本，请安装使用插件 `1.x` 版本。

```bash
npm install mongoose-modified-at@1
```



### 更新日志

版本详情的更新日志请查看 [release](https://github.com/Barrior/mongoose-modified-at/releases) 列表。



### 协议

[MIT licensed](./LICENSE).
