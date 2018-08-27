module.exports = function NotInitialisedError(message) {
  this.name = this.constructor.name
  this.message = message
  Error.captureStackTrace(this, this.constructor)
}

require('util').inherits(module.exports, Error)