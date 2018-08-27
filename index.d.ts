// Type definitions for redis-semaphore 0.3.2
// Project: https://github.com/shadizar128/redis-semaphore#readme
// Definitions by: My Self <https://github.com/me>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import {Redis} from "ioredis";

export interface TimeoutOptions {
    lockTimeout: number,
    acquireTimeout: number,
    retryInterval: number,
    refreshInterval?: number
}

export class Mutex {
    protected _identifier: string;
    protected _client: Redis;
    protected _key: string;
    protected _lockTimeout: number;
    protected _acquireTimeout: number;
    protected _retryInterval: number;

    constructor(client: Redis, key: string, timeoutOptions: TimeoutOptions);

    public acquire(): Promise<string>;
    public release(): Promise<boolean>;
    
    protected _refresh(): void;
    protected _startRefresh(): void;
    protected _stopRefresh(): void;
}

export class SimpleSemaphore implements Semaphore {
    protected _identifier: string;
    protected _client: Redis;
    protected _key: string;
    protected _limit: number;
    protected _lockTimeout: number;
    protected _acquireTimeout: number;
    protected _retryInterval: number;

    constructor(client: Redis, key: string, limit: number, timeoutOptions: TimeoutOptions);

    public acquire(): Promise<string>;
    public release(): Promise<boolean>;
    public resurrect(identifier: string): Promise<boolean>;
    public getIdentifier(): string;

    protected _refresh(): void;
    protected _startRefresh(): void;
    protected _stopRefresh(): void;
}

export class FairSemaphore implements Semaphore {
    protected _identifier: string;
    protected _client: Redis;
    protected _key: string;
    protected _limit: number;
    protected _lockTimeout: number;
    protected _acquireTimeout: number;
    protected _retryInterval: number;

    constructor(client: Redis, key: string, limit: number, timeoutOptions: TimeoutOptions);

    public acquire(): Promise<string>;
    public release(): Promise<boolean>;
    public resurrect(identifier: string): Promise<boolean>;
    public getIdentifier(): string;

    protected _refresh(): void;
    protected _startRefresh(): void;
    protected _stopRefresh(): void;
}

export interface Semaphore {
    acquire(): Promise<string>;
    release(): Promise<boolean>;
    resurrect(identifier: string): Promise<boolean>;
    getIdentifier(): string;
}