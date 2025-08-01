import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    await this.redisClient.connect();
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.redisClient) {
      console.error('RedisService: Client not initialized');
      return;
    }
    
    // Ensure client is ready before operation
    if (this.redisClient.status !== 'ready') {
      console.warn(`RedisService: Client not ready (status: ${this.redisClient.status}), attempting reconnection`);
      try {
        await this.redisClient.connect();
      } catch (error) {
        console.error('RedisService: Failed to reconnect:', error);
        return;
      }
    }
    
    try {
      if (ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, value);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      console.error(`RedisService: Error setting key ${key}:`, error);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.redisClient) {
      console.error('RedisService: Client not initialized');
      return null;
    }
    
    // Ensure client is ready before operation
    if (this.redisClient.status !== 'ready') {
      console.warn(`RedisService: Client not ready (status: ${this.redisClient.status}), attempting reconnection`);
      try {
        await this.redisClient.connect();
      } catch (error) {
        console.error('RedisService: Failed to reconnect:', error);
        return null;
      }
    }
    
    try {
      const result = await this.redisClient.get(key);
      return result;
    } catch (error) {
      console.error(`RedisService: Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  /**
   * Increment a counter
   */
  async increment(key: string): Promise<number> {
    return await this.redisClient.incr(key);
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<number> {
    return await this.redisClient.expire(key, seconds);
  }

  /**
   * Add member to a set
   */
  async sadd(key: string, member: string): Promise<number> {
    return await this.redisClient.sadd(key, member);
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    return await this.redisClient.smembers(key);
  }

  /**
   * Remove member from a set
   */
  async srem(key: string, member: string): Promise<number> {
    return await this.redisClient.srem(key, member);
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<number> {
    return await this.redisClient.sismember(key, member);
  }

  /**
   * Hash set
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redisClient.hset(key, field, value);
  }

  /**
   * Hash get
   */
  async hget(key: string, field: string): Promise<string | null> {
    return await this.redisClient.hget(key, field);
  }

  /**
   * Hash get all
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redisClient.hgetall(key);
  }

  /**
   * Hash delete field
   */
  async hdel(key: string, field: string): Promise<number> {
    return await this.redisClient.hdel(key, field);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<number> {
    return await this.redisClient.exists(key);
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  /**
   * Flush all keys in current database
   */
  async flushdb(): Promise<string> {
    return await this.redisClient.flushdb();
  }

  /**
   * Get Redis client instance for advanced operations
   */
  getClient(): Redis {
    return this.redisClient;
  }
}