import { db } from './client.js'

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(fn)
}
