const NodeEnvironment = require('jest-environment-node')
const { MongoMemoryServer } = require('mongodb-memory-server')

class CustomEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup()
    this.global.mongoServer = new MongoMemoryServer({
      binary: {
        version: '3.4'
      }
    })
    this.global.mongoUri = await this.global.mongoServer.getConnectionString()
  }

  async teardown() {
    await this.global.mongoServer.stop()
    await super.teardown()
  }
}

module.exports = CustomEnvironment
