---
title: Caching Opportunities
impact: LOW
impactDescription: Redundant API calls, slower responses, higher costs
tags: optimization, caching, performance, cost
category: optimization
---

## Caching Opportunities

**Impact: LOW (Redundant API calls, slower responses, higher costs)**

Many operations produce deterministic results that can be cached: embeddings
for the same text, tool results for the same inputs, and frequently accessed
data. Caching reduces latency and costs.

### What to Check

- Embeddings for static content are cached
- Tool results are cached where appropriate
- Frequently accessed data is cached
- Cache invalidation strategy exists
- Cache hit rates are monitored

### Incorrect Configuration

```typescript
// No caching: Re-embeds same content repeatedly
async function searchDocs(query: string) {
  // Embeds the same query every time!
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  return await vectorStore.query({ vector: embedding, topK: 5 });
}

// Tool makes expensive API call every time
const weatherTool = createTool({
  id: "get-weather",
  execute: async ({ city }) => {
    // Fetches weather even if called 100x for same city in a minute
    return await weatherApi.getCurrent(city);
  },
});

// Re-fetches user data on every request
async function handleRequest(userId: string) {
  const user = await db.users.findById(userId);  // DB call every time
  const preferences = await db.preferences.findByUser(userId);  // Another call
  // ... process request
}
```

### Correct Configuration

```typescript
// Embedding cache
const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(text: string): Promise<number[]> {
  const cacheKey = hashString(text);

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });

  embeddingCache.set(cacheKey, embedding);
  return embedding;
}

async function searchDocs(query: string) {
  const embedding = await getCachedEmbedding(query);
  return await vectorStore.query({ vector: embedding, topK: 5 });
}

// Tool with TTL cache
const cache = new Map<string, { value: any; expires: number }>();

const weatherTool = createTool({
  id: "get-weather",
  execute: async ({ city }) => {
    const cacheKey = `weather:${city.toLowerCase()}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.value;  // Return cached result
    }

    const weather = await weatherApi.getCurrent(city);

    // Cache for 10 minutes
    cache.set(cacheKey, {
      value: weather,
      expires: Date.now() + 10 * 60 * 1000,
    });

    return weather;
  },
});
```

### Redis/External Cache for Production

```typescript
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Production-ready caching utility
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

const cacheService = new CacheService();

// Usage in tools
const stockTool = createTool({
  id: "get-stock-price",
  execute: async ({ symbol }) => {
    return cacheService.getOrFetch(
      `stock:${symbol}`,
      () => stockApi.getPrice(symbol),
      60  // Cache for 1 minute
    );
  },
});

// Usage for user context
async function getUserContext(userId: string) {
  return cacheService.getOrFetch(
    `user:${userId}`,
    async () => ({
      user: await db.users.findById(userId),
      preferences: await db.preferences.findByUser(userId),
    }),
    300  // Cache for 5 minutes
  );
}
```

### Embedding Cache with LRU

```typescript
// LRU cache with size limit
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Cache up to 10,000 embeddings
const embeddingLRU = new LRUCache<string, number[]>(10000);
```

### Cache Strategies by Use Case

| Data Type | TTL | Strategy | Notes |
|-----------|-----|----------|-------|
| Embeddings | Long/Permanent | LRU in-memory | Same text = same embedding |
| Weather data | 10-30 minutes | TTL cache | Updates periodically |
| Stock prices | 1-5 minutes | Short TTL | Near real-time needed |
| User profiles | 5-15 minutes | TTL + invalidation | Update on changes |
| Static content | Hours/Days | Long TTL | Documentation, configs |
| Search results | 5-60 minutes | TTL cache | Balance freshness/cost |

### Cache Invalidation

```typescript
// Event-based invalidation
const eventEmitter = new EventEmitter();

// When user updates their profile
async function updateUserProfile(userId: string, updates: Partial<User>) {
  await db.users.update(userId, updates);

  // Invalidate cache
  await redis.del(`user:${userId}`);

  // Or publish event for distributed invalidation
  eventEmitter.emit("cache:invalidate", { key: `user:${userId}` });
}

// Subscribe to invalidation events
eventEmitter.on("cache:invalidate", async ({ key }) => {
  await redis.del(key);
});
```

### How to Fix

1. Identify expensive, repeatable operations
2. Add in-memory caching for embeddings
3. Add TTL caching for tool results
4. Use Redis for production multi-instance caching
5. Implement cache invalidation for mutable data
6. Monitor cache hit rates and adjust TTLs
7. Set appropriate cache size limits

### Reference

- [Caching Best Practices](https://redis.io/docs/manual/client-side-caching/)
- [AI SDK Caching](https://sdk.vercel.ai/docs/foundations/caching)
