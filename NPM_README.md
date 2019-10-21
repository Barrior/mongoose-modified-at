Mongoose plugin that tracking the fields you specified and automatically record the change time of them into DB. It just like timestamps function of Mongoose itself.

### Install

```
npm install mongoose-modified-at --save
```

### Usage

Simply configure the schema on it initialization:

```javascript
const modifiedAt = require('mongoose-modified-at')

const articleSchema = new mongoose.Schema({
  title: String,
  is_draft: Boolean,
  is_recommended: Boolean,
  // more...
})

// before mongoose.model invoked
articleSchema.plugin(modifiedAt, {
  // watch fields
  fields: ['title'],
  // custom logic, function name will as field name insert to database.
  publishedAt(doc) {
    // when returns a value of true, the time is recorded.
    return !doc.is_draft
  },
  // recommend article same as above.
  recommendedAt(doc) {
    return doc.is_recommended
  }
})

const Article = mongoose.model('Article', articleSchema)
```

Create document:

```javascript
await Article.create({
  title: 'Document Title',
  is_draft: false,
  is_recommended: true,
  // more fields...
})
```

Results from database:

```javascript
{
  "title": "Document Title",
  "is_draft": false,
  "is_recommended": true,
  "title_modifiedAt": ISODate("2019-09-27T03:11:07.880Z"),
  "publishedAt": ISODate("2019-09-27T03:11:07.880Z"),
  "recommendedAt": ISODate("2019-09-27T03:11:07.880Z"),
  // more fields...
}
```

### Documentation

[See more details via the documentation.](https://github.com/Barrior/mongoose-modified-at/blob/master/README_en.md)

### License

[MIT](./LICENSE)
