const RedisMutex = require('./RedisMutex')
const debug = require('debug')('redis-semaphore:semaphore:instance')
const LostLockError = require('./errors/LostLockError')
const NotInitialisedError = require('./errors/NotInitialisedError')
const semaphore = require('./simple-semaphore')

const DEFAULT_TIMEOUTS = {
  lockTimeout: 10000,
  acquireTimeout: 10000,
  retryInterval: 10
}

class RedisSimpleSemaphore extends RedisMutex {
  constructor(
    client,
    key,
    limit,
    {
      lockTimeout,
      acquireTimeout,
      retryInterval,
      refreshInterval
    } = DEFAULT_TIMEOUTS
  ) {
    super(client, key, {
      lockTimeout,
      acquireTimeout,
      retryInterval,
      refreshInterval
    })
    if (!limit) {
      throw new Error('"limit" is required')
    }
    if (typeof limit !== 'number') {
      throw new Error('"limit" must be a number')
    }
    this._limit = parseInt(limit, 10)
  }
  async _refresh() {
    debug(
      `refresh fairsemaphore (key: ${this._key}, identifier: ${
        this._identifier
      })`
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
    debug(`acquire fairsemaphore (key: ${this._key})`)
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
      `release fairsemaphore (key: ${this._key}, identifier: ${
        this._identifier
      })`
    )
    this._stopRefresh()
    const released = await semaphore.release(
      this._client,
      this._key,
      this._identifier
    )
    return released
  }

  async resurrect(identifier) {
      this._identifier = identifier;
      await this._refresh();
      this._startRefresh();
      return true;
  }

  getIdentifier() {
      if (!this._identifier) {
          throw new NotInitialisedError('Semaphore not initialised')
      }
      return this._identifier;
  }

}

module.exports = RedisSimpleSemaphore
