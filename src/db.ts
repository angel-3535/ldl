import Dexie, { type EntityTable } from 'dexie'

export interface InboxItem {
  id: string
  title: string
  createdAt: string
}

export interface DummyItem {
  slot: number
  itemId: number
  name: string
  icon: string
}

export interface Dummy {
  id: string
  name: string
  health: number
  resist: number
  items: DummyItem[]
  updatedAt: string
}

class LocalDatabase extends Dexie {
  inbox!: EntityTable<InboxItem, 'id'>
  dummies!: EntityTable<Dummy, 'id'>

  constructor() {
    super('ldl')
    this.version(1).stores({
      inbox: 'id, createdAt',
    })
    this.version(2).stores({
      inbox: 'id, createdAt',
      dummies: 'id, updatedAt',
    })
  }
}

export const db = new LocalDatabase()

export async function seedInbox() {
  const count = await db.inbox.count()

  if (count > 0) {
    return
  }

  await db.inbox.bulkAdd([
    {
      id: crypto.randomUUID(),
      title: 'Wire TanStack Router into the app shell',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Use TanStack Query for async state around Dexie reads',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Persist local-first data with Dexie',
      createdAt: new Date().toISOString(),
    },
  ])
}

export async function listInboxItems() {
  return db.inbox.orderBy('createdAt').reverse().toArray()
}

export async function createInboxItem(title: string) {
  const item = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
  }

  await db.inbox.add(item)
  return item
}

const DEFAULT_DUMMY_ID = 'default'

export async function getDummy(): Promise<Dummy> {
  const existing = await db.dummies.get(DEFAULT_DUMMY_ID)
  if (existing) return existing

  const dummy: Dummy = {
    id: DEFAULT_DUMMY_ID,
    name: 'Target Dummy',
    health: 1000,
    resist: 100,
    items: [],
    updatedAt: new Date().toISOString(),
  }
  await db.dummies.add(dummy)
  return dummy
}

export async function updateDummy(updates: Partial<Omit<Dummy, 'id'>>): Promise<void> {
  await db.dummies.update(DEFAULT_DUMMY_ID, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}
