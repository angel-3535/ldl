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

export interface Build {
  id: string
  name: string
  championKey: string | null
  championName: string | null
  primaryPathId: number | null
  secondaryPathId: number | null
  primarySelections: Record<number, number>
  secondarySelections: Record<number, number>
  statSelections: Record<number, string>
  items: DummyItem[]
  updatedAt: string
}

class LocalDatabase extends Dexie {
  inbox!: EntityTable<InboxItem, 'id'>
  dummies!: EntityTable<Dummy, 'id'>
  builds!: EntityTable<Build, 'id'>

  constructor() {
    super('ldl')
    this.version(1).stores({
      inbox: 'id, createdAt',
    })
    this.version(2).stores({
      inbox: 'id, createdAt',
      dummies: 'id, updatedAt',
    })
    this.version(3).stores({
      inbox: 'id, createdAt',
      dummies: 'id, updatedAt',
      builds: 'id, updatedAt',
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

export async function listDummies(): Promise<Dummy[]> {
  return db.dummies.orderBy('updatedAt').reverse().toArray()
}

export async function createDummy(name: string): Promise<Dummy> {
  const dummy: Dummy = {
    id: crypto.randomUUID(),
    name,
    health: 1000,
    resist: 100,
    items: [],
    updatedAt: new Date().toISOString(),
  }
  await db.dummies.add(dummy)
  return dummy
}

export async function getDummyById(id: string): Promise<Dummy | undefined> {
  return db.dummies.get(id)
}

export async function updateDummyById(id: string, updates: Partial<Omit<Dummy, 'id'>>): Promise<void> {
  await db.dummies.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteDummy(id: string): Promise<void> {
  await db.dummies.delete(id)
}

// ── Builds ──

export async function listBuilds(): Promise<Build[]> {
  return db.builds.orderBy('updatedAt').reverse().toArray()
}

export async function createBuild(name: string): Promise<Build> {
  const build: Build = {
    id: crypto.randomUUID(),
    name,
    championKey: null,
    championName: null,
    primaryPathId: null,
    secondaryPathId: null,
    primarySelections: {},
    secondarySelections: {},
    statSelections: {},
    items: [],
    updatedAt: new Date().toISOString(),
  }
  await db.builds.add(build)
  return build
}

export async function getBuildById(id: string): Promise<Build | undefined> {
  return db.builds.get(id)
}

export async function updateBuildById(id: string, updates: Partial<Omit<Build, 'id'>>): Promise<void> {
  await db.builds.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteBuild(id: string): Promise<void> {
  await db.builds.delete(id)
}
