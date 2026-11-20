import { Pool, type PoolClient, type QueryResultRow } from 'pg'

declare global { var __dzonePool: Pool | undefined }

export function pool() {
  if (!global.__dzonePool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Read README.md to configure PostgreSQL.')
    global.__dzonePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, idleTimeoutMillis: 20000, connectionTimeoutMillis: 8000 })
  }
  return global.__dzonePool
}
export async function query<T extends QueryResultRow = any>(sql: string, params: unknown[] = []) {
  return pool().query<T>(sql, params)
}
export async function withTransaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect()
  try {
    await client.query('BEGIN')
    const value = await fn(client)
    await client.query('COMMIT')
    return value
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}
