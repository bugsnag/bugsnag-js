class Breadcrumb {
  constructor (message, metadata, type, timestamp = new Date()) {
    this.type = type
    this.message = message
    this.metadata = metadata
    this.timestamp = timestamp
  }

  toJSON () {
    return {
      type: this.type,
      name: this.message,
      timestamp: this.timestamp,
      metaData: this.metadata
    }
  }
}

module.exports = Breadcrumb
