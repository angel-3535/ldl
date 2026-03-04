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

export interface Test {
  id: string
  name: string
  description: string
  dummyId: string | null
  x: number
  y: number
  updatedAt: string
}

export interface TestConnection {
  id: string
  testId: string
  buildId: string
  damage: number
  updatedAt: string
}

export interface CanvasBuild {
  id: string
  buildId: string
  x: number
  y: number
}

interface LegacyTestRecord {
  buildId?: string
  totalDamage?: number
  x?: number
  y?: number
}

class LocalDatabase extends Dexie {
  inbox!: EntityTable<InboxItem, 'id'>
  dummies!: EntityTable<Dummy, 'id'>
  builds!: EntityTable<Build, 'id'>
  tests!: EntityTable<Test, 'id'>
  testConnections!: EntityTable<TestConnection, 'id'>
  canvasBuilds!: EntityTable<CanvasBuild, 'id'>

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
    this.version(4).stores({
      inbox: 'id, createdAt',
      dummies: 'id, updatedAt',
      builds: 'id, updatedAt',
      tests: 'id, updatedAt',
    })
    this.version(5).stores({
      inbox: 'id, createdAt',
      dummies: 'id, updatedAt',
      builds: 'id, updatedAt',
      tests: 'id, updatedAt',
      testConnections: 'id, testId, buildId, updatedAt',
      canvasBuilds: 'id, buildId',
    }).upgrade(tx => {
      return tx.table('tests').toCollection().modify((test: LegacyTestRecord) => {
        delete test.buildId
        delete test.totalDamage
        test.x = 500
        test.y = 200 + Math.random() * 300
      })
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

// ── Tests ──

export async function listTests(): Promise<Test[]> {
  return db.tests.orderBy('updatedAt').reverse().toArray()
}

export async function createTest(name: string, x = 500, y = 300): Promise<Test> {
  const test: Test = {
    id: crypto.randomUUID(),
    name,
    description: '',
    dummyId: null,
    x,
    y,
    updatedAt: new Date().toISOString(),
  }
  await db.tests.add(test)
  return test
}

export async function getTestById(id: string): Promise<Test | undefined> {
  return db.tests.get(id)
}

export async function updateTestById(id: string, updates: Partial<Omit<Test, 'id'>>): Promise<void> {
  await db.tests.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteTest(id: string): Promise<void> {
  await db.testConnections.where('testId').equals(id).delete()
  await db.tests.delete(id)
}

// ── Test Connections ──

export async function listTestConnections(): Promise<TestConnection[]> {
  return db.testConnections.toArray()
}

export async function createTestConnection(testId: string, buildId: string): Promise<TestConnection> {
  const conn: TestConnection = {
    id: crypto.randomUUID(),
    testId,
    buildId,
    damage: 0,
    updatedAt: new Date().toISOString(),
  }
  await db.testConnections.add(conn)
  return conn
}

export async function updateTestConnection(id: string, updates: Partial<Omit<TestConnection, 'id'>>): Promise<void> {
  await db.testConnections.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteTestConnection(id: string): Promise<void> {
  await db.testConnections.delete(id)
}

// ── Canvas Builds ──

export async function listCanvasBuilds(): Promise<CanvasBuild[]> {
  return db.canvasBuilds.toArray()
}

export async function addCanvasBuild(buildId: string, x = 100, y = 300): Promise<CanvasBuild> {
  const cb: CanvasBuild = {
    id: crypto.randomUUID(),
    buildId,
    x,
    y,
  }
  await db.canvasBuilds.add(cb)
  return cb
}

export async function updateCanvasBuild(id: string, updates: Partial<Omit<CanvasBuild, 'id'>>): Promise<void> {
  await db.canvasBuilds.update(id, updates)
}

export async function removeCanvasBuild(id: string): Promise<void> {
  const cb = await db.canvasBuilds.get(id)
  if (cb) {
    await db.testConnections.where('buildId').equals(cb.buildId).delete()
  }
  await db.canvasBuilds.delete(id)
}
