const Redis = require('ioredis')
const LostLockError = require('./errors/LostLockError')
const debug = require('debug')('redis-semaphore:mutex:instance')
const mutex = require('./mutex')

const DEFAULT_TIMEOUTS = {
  lockTimeout: 10000,
  acquireTimeout: 10000,
  retryInterval: 10
}

class RedisMutex {
  constructor(
    client,
    key,
    {
      lockTimeout,
      acquireTimeout,
      retryInterval,
      refreshInterval
    } = DEFAULT_TIMEOUTS
  ) {
    if (!client) {
      throw new Error('"client" is required')
    }
    if (!(client instanceof Redis)) {
      throw new Error('"client" must be instance of RedisClient')
    }
    if (!key) {
      throw new Error('"key" is required')
    }
    if (typeof key !== 'string') {
      throw new Error('"key" must be a string')
    }
    this._client = client
    this._key = key
    this._lockTimeout = lockTimeout
    this._acquireTimeout = acquireTimeout
    this._retryInterval = retryInterval
    this._refreshTimeInterval = refreshInterval
    this._refresh = this._refresh.bind(this)
  }
  _startRefresh() {
    this._refreshInterval = setInterval(
      this._refresh,
      this._refreshTimeInterval
    )
    this._refreshInterval.unref()
  }
  _stopRefresh() {
    clearInterval(this._refreshInterval)
  }
  async _refresh() {
    debug(`refresh mutex (key: ${this._key}, identifier: ${this._identifier})`)
    const refreshed = await mutex.refresh(
      this._client,
      this._key,
      this._identifier,
      this._lockTimeout
    )
    if (!refreshed) {
      this._stopRefresh()
      throw new LostLockError(`Lost mutex for key ${this._key}`)
    }
  }

  async acquire() {
    debug(`acquire mutex (key: ${this._key})`)
    this._identifier = await mutex.acquire(
      this._client,
      this._key,
      this._lockTimeout,
      this._acquireTimeout,
      this._retryInterval
    )
    if (this._refreshTimeInterval) {
      this._startRefresh()
    }
    return this._identifier
  }

  async release() {
    debug(`release mutex (key: ${this._key}, identifier: ${this._identifier})`)
    if (this._refreshTimeInterval) {
      this._stopRefresh()
    }
    const released = await mutex.release(
      this._client,
      this._key,
      this._identifier
    )
    return released
  }
}

module.exports = RedisMutex
