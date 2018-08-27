const RedisSimpleSemaphore = require('./RedisSimpleSemaphore')
const debug = require('debug')('redis-semaphore:fair-semaphore:instance')
const LostLockError = require('./errors/LostLockError')
const semaphore = require('./fair-semaphore')

class RedisFairSemaphore extends RedisSimpleSemaphore {
  async _refresh() {
    debug(
      `refresh semaphore (key: ${this._key}, identifier: ${this._identifier})`
    )
    const refreshed = await semaphore.refresh(
      this._client,
      this._key,
      this._identifier
    )
    if (!refreshed) {
      this._stopRefresh()
      throw new LostLockError(`Lost semaphore for key ${this._key}`)
    }
  }

  async acquire() {
    debug(`acquire semaphore (key: ${this._key})`)
    this._identifier = await semaphore.acquire(
      this._client,
      this._key,
      this._limit,
      this._lockTimeout,
      this._acquireTimeout,
      this._retryInterval
    )
    this._startRefresh()
    return this._identifier
  }

  async release() {
    debug(
      `release semaphore (key: ${this._key}, identifier: ${this._identifier})`
    )
    this._stopRefresh()
    const released = await semaphore.release(
      this._client,
      this._key,
      this._identifier
    )
    return released
  }
}

module.exports = RedisFairSemaphore
