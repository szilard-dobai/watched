import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCollection = vi.fn()
const mockDb = {
  collection: mockCollection,
}

class MockMongoClient {
  static instances: MockMongoClient[] = []

  constructor(
    public uri: string,
    public options: Record<string, unknown>
  ) {
    MockMongoClient.instances.push(this)
  }

  connect = vi.fn().mockResolvedValue({
    db: vi.fn().mockReturnValue(mockDb),
  })

  static reset() {
    MockMongoClient.instances = []
  }
}

vi.mock('mongodb', () => {
  return {
    MongoClient: MockMongoClient,
  }
})

describe('mongodb', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MONGODB_URI', '')
    vi.stubEnv('MONGODB_DB', '')
    vi.stubEnv('NODE_ENV', 'test')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any)._mongoDbPromise = undefined
    MockMongoClient.reset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  describe('getDb', () => {
    it('throws error when MONGODB_URI is not set', async () => {
      vi.stubEnv('MONGODB_DB', 'test-db')

      const { default: getDb } = await import('./mongodb')

      expect(() => getDb()).toThrow('Please add your MONGODB_URI env variable')
    })

    it('throws error when MONGODB_DB is not set', async () => {
      vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')

      const { default: getDb } = await import('./mongodb')

      expect(() => getDb()).toThrow('Please add your MONGODB_DB env variable')
    })

    it('creates connection with correct options in production', async () => {
      vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')
      vi.stubEnv('MONGODB_DB', 'test-db')
      vi.stubEnv('NODE_ENV', 'production')

      const { default: getDb } = await import('./mongodb')

      const db = await getDb()

      expect(MockMongoClient.instances).toHaveLength(1);
      expect(MockMongoClient.instances[0].uri).toBe(
        "mongodb://localhost:27017"
      );
      expect(MockMongoClient.instances[0].options).toEqual({
        appName: 'devrel.vercel.integration',
        maxIdleTimeMS: 5000,
      })
      expect(db).toBeDefined()
    })

    it('reuses existing connection on subsequent calls', async () => {
      vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')
      vi.stubEnv('MONGODB_DB', 'test-db')
      vi.stubEnv('NODE_ENV', 'production')

      const { default: getDb } = await import('./mongodb')

      const db1 = await getDb()
      const db2 = await getDb()

      expect(db1).toBe(db2)
      expect(MockMongoClient.instances).toHaveLength(1)
    })

    it('uses global cache in development mode', async () => {
      vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')
      vi.stubEnv('MONGODB_DB', 'test-db')
      vi.stubEnv('NODE_ENV', 'development')

      const { default: getDb } = await import('./mongodb')

      await getDb()

      expect(global._mongoDbPromise).toBeDefined()
    })

    it('reuses global cache in development mode', async () => {
      vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017')
      vi.stubEnv('MONGODB_DB', 'test-db')
      vi.stubEnv('NODE_ENV', 'development')

      const cachedDb = { collection: vi.fn() }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(global as any)._mongoDbPromise = Promise.resolve(cachedDb)

      const { default: getDb } = await import('./mongodb')

      const db = await getDb()

      expect(db).toBe(cachedDb);
      expect(MockMongoClient.instances).toHaveLength(0);
    });
  });
});
