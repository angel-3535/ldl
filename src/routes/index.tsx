import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  listTests, createTest, updateTestById, deleteTest,
  listBuilds, listDummies,
  listCanvasBuilds, addCanvasBuild, updateCanvasBuild, removeCanvasBuild,
  listTestConnections, createTestConnection, updateTestConnection, deleteTestConnection,
} from '../db'
import type { Build, Dummy, CanvasBuild, TestConnection } from '../db'
import { useConfiguredHotkey } from '../hotkeys'
import { championSquareIcon } from '../lib/ddragon'
import './index.css'

const DDRAGON_VERSION = '15.4.1'

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`
}

function TestCanvasPage() {
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLDivElement>(null)

  // ── State ──
  const [connectingBuildId, setConnectingBuildId] = useState<string | null>(null)
  const [buildPickerOpen, setBuildPickerOpen] = useState(false)
  const [creatingTest, setCreatingTest] = useState(false)
  const [newTestName, setNewTestName] = useState('')
  const [dragState, setDragState] = useState<{
    type: 'build' | 'test'
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)
  const [editingDamage, setEditingDamage] = useState<string | null>(null)
  const [damageValue, setDamageValue] = useState('')
  const [editingTestName, setEditingTestName] = useState<string | null>(null)
  const [testNameValue, setTestNameValue] = useState('')
  const [dummyPickerTestId, setDummyPickerTestId] = useState<string | null>(null)

  // ── Queries ──
  const { data: tests = [] } = useQuery({ queryKey: ['tests'], queryFn: listTests })
  const { data: builds = [] } = useQuery({ queryKey: ['builds'], queryFn: listBuilds })
  const { data: dummies = [] } = useQuery({ queryKey: ['dummies'], queryFn: listDummies })
  const { data: canvasBuilds = [] } = useQuery({ queryKey: ['canvasBuilds'], queryFn: listCanvasBuilds })
  const { data: connections = [] } = useQuery({ queryKey: ['testConnections'], queryFn: listTestConnections })

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tests'] })
    queryClient.invalidateQueries({ queryKey: ['canvasBuilds'] })
    queryClient.invalidateQueries({ queryKey: ['testConnections'] })
  }, [queryClient])

  // ── Mutations ──
  const addBuildMut = useMutation({
    mutationFn: (buildId: string) => addCanvasBuild(buildId, 100 + Math.random() * 200, 150 + Math.random() * 300),
    onSuccess: () => { invalidateAll(); setBuildPickerOpen(false) },
  })

  const createTestMut = useMutation({
    mutationFn: (name: string) => createTest(name, 500 + Math.random() * 200, 150 + Math.random() * 300),
    onSuccess: () => { invalidateAll(); setCreatingTest(false); setNewTestName('') },
  })

  const updateTestMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateTestById>[1] }) =>
      updateTestById(id, updates),
    onSuccess: invalidateAll,
  })

  const deleteTestMut = useMutation({
    mutationFn: deleteTest,
    onSuccess: invalidateAll,
  })

  const updateCBMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<CanvasBuild, 'id'>> }) =>
      updateCanvasBuild(id, updates),
    onSuccess: invalidateAll,
  })

  const removeCBMut = useMutation({
    mutationFn: removeCanvasBuild,
    onSuccess: invalidateAll,
  })

  const connectMut = useMutation({
    mutationFn: ({ testId, buildId }: { testId: string; buildId: string }) =>
      createTestConnection(testId, buildId),
    onSuccess: () => { invalidateAll(); setConnectingBuildId(null) },
  })

  const updateConnMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<TestConnection, 'id'>> }) =>
      updateTestConnection(id, updates),
    onSuccess: invalidateAll,
  })

  const deleteConnMut = useMutation({
    mutationFn: deleteTestConnection,
    onSuccess: invalidateAll,
  })

  // ── Build map ──
  const buildMap = new Map<string, Build>()
  builds.forEach(b => buildMap.set(b.id, b))

  const dummyMap = new Map<string, Dummy>()
  dummies.forEach(d => dummyMap.set(d.id, d))

  // ── Drag handling ──
  const handlePointerDown = useCallback((
    e: React.PointerEvent, type: 'build' | 'test', id: string, nodeX: number, nodeY: number
  ) => {
    if ((e.target as HTMLElement).closest('.cv-card-remove, .cv-card-edit, .cv-dummy-picker-dropdown, .cv-dummy-label, .cv-test-name-input, input, select, button, a')) return
    e.preventDefault()
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragState({
      type, id,
      offsetX: e.clientX - rect.left - nodeX,
      offsetY: e.clientY - rect.top - nodeY,
    })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  useEffect(() => {
    if (!dragState) return

    const handleMove = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = Math.max(0, e.clientX - rect.left - dragState.offsetX)
      const y = Math.max(0, e.clientY - rect.top - dragState.offsetY)

      if (dragState.type === 'build') {
        updateCBMut.mutate({ id: dragState.id, updates: { x, y } })
      } else {
        updateTestMut.mutate({ id: dragState.id, updates: { x, y } })
      }
    }

    const handleUp = () => setDragState(null)

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragState, updateCBMut, updateTestMut])

  // ── Connection click on test card ──
  const deleteConnMutForToggle = useMutation({
    mutationFn: deleteTestConnection,
    onSuccess: invalidateAll,
  })

  const handleTestClick = useCallback((testId: string) => {
    if (!connectingBuildId) return
    // Check if connection already exists — if so, remove it (toggle off)
    const exists = connections.find(c => c.testId === testId && c.buildId === connectingBuildId)
    if (exists) {
      deleteConnMutForToggle.mutate(exists.id)
      return
    }
    connectMut.mutate({ testId, buildId: connectingBuildId })
  }, [connectingBuildId, connections, connectMut, deleteConnMutForToggle])

  // ── Build card click (start connecting) ──
  const handleBuildCardClick = useCallback((buildId: string) => {
    if (dragState) return
    setConnectingBuildId(prev => prev === buildId ? null : buildId)
  }, [dragState])

  // ── Damage badge editing ──
  const handleDamageEdit = useCallback((connId: string, currentDamage: number) => {
    setEditingDamage(connId)
    setDamageValue(String(currentDamage))
  }, [])

  const handleDamageSave = useCallback(() => {
    if (editingDamage) {
      const num = parseInt(damageValue, 10)
      const val = isNaN(num) ? 0 : Math.max(0, num)
      updateConnMut.mutate({ id: editingDamage, updates: { damage: val } })
      setEditingDamage(null)
    }
  }, [editingDamage, damageValue, updateConnMut])

  // ── Test name editing ──
  const handleTestNameEdit = useCallback((testId: string, currentName: string) => {
    setEditingTestName(testId)
    setTestNameValue(currentName)
  }, [])

  const handleTestNameSave = useCallback(() => {
    if (editingTestName) {
      const trimmed = testNameValue.trim()
      if (trimmed) {
        updateTestMut.mutate({ id: editingTestName, updates: { name: trimmed } })
      }
      setEditingTestName(null)
    }
  }, [editingTestName, testNameValue, updateTestMut])

  // ── Card dimensions for line calculations ──
  const CARD_W = 200
  const CARD_H = 100

  const closeTransientUi = useCallback(() => {
    if (dummyPickerTestId) {
      setDummyPickerTestId(null)
      return
    }

    if (editingDamage) {
      setEditingDamage(null)
      return
    }

    if (editingTestName) {
      setEditingTestName(null)
      return
    }

    if (creatingTest) {
      setCreatingTest(false)
      setNewTestName('')
      return
    }

    if (buildPickerOpen) {
      setBuildPickerOpen(false)
      return
    }

    if (connectingBuildId) {
      setConnectingBuildId(null)
    }
  }, [buildPickerOpen, connectingBuildId, creatingTest, dummyPickerTestId, editingDamage, editingTestName])

  useConfiguredHotkey('addBuildToCanvas', () => {
    setCreatingTest(false)
    setNewTestName('')
    setDummyPickerTestId(null)
    setConnectingBuildId(null)
    setBuildPickerOpen((open) => !open)
  })

  useConfiguredHotkey('addTestToCanvas', () => {
    setBuildPickerOpen(false)
    setConnectingBuildId(null)
    setDummyPickerTestId(null)
    setCreatingTest(true)
  })

  useConfiguredHotkey('closeOverlay', closeTransientUi, {
    enabled: Boolean(
      buildPickerOpen ||
      creatingTest ||
      connectingBuildId ||
      dummyPickerTestId ||
      editingDamage ||
      editingTestName,
    ),
    allowInInput: true,
  })

  // ── Connected test IDs for the currently selected build ──
  const connectedTestIds = connectingBuildId
    ? new Set(connections.filter(c => c.buildId === connectingBuildId).map(c => c.testId))
    : null

  // ── Builds not yet on canvas ──
  const canvasBuildIds = new Set(canvasBuilds.map(cb => cb.buildId))
  const availableBuilds = builds.filter(b => !canvasBuildIds.has(b.id))

  function formatDamage(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <div className="cv-page">
      <div className="cv-bg-pattern" />

      {/* ── Header / Toolbar ── */}
      <header className="cv-header">
        <div className="cv-header-left">
          <h1 className="cv-title">Damage Canvas</h1>
          <nav className="cv-nav">
            <Link to="/build" className="cv-nav-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              Builds
            </Link>
            <Link to="/dummy" className="cv-nav-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" /><path d="M8 16h8v4H8z" />
              </svg>
              Dummies
            </Link>
            <Link to="/settings" className="cv-nav-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2H9a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7z" />
              </svg>
              Settings
            </Link>

          </nav>
        </div>
        <div className="cv-header-actions">
          {connectingBuildId && (
            <div className="cv-connect-indicator">
              <span className="cv-connect-dot" />
              Select a test to connect
              <button className="cv-connect-cancel" onClick={() => setConnectingBuildId(null)}>Cancel</button>
            </div>
          )}
          <div className="cv-picker-wrap">
            <button className="cv-add-btn" onClick={() => setBuildPickerOpen(!buildPickerOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Build
            </button>
            {buildPickerOpen && (
              <div className="cv-picker-dropdown">
                {availableBuilds.length === 0 ? (
                  <div className="cv-picker-empty">
                    {builds.length === 0 ? (
                      <>No builds yet. <Link to="/build" className="cv-picker-link">Create one</Link></>
                    ) : 'All builds on canvas'}
                  </div>
                ) : (
                  availableBuilds.map(b => (
                    <button key={b.id} className="cv-picker-item" onClick={() => addBuildMut.mutate(b.id)}>
                      {b.championKey && (
                        <img className="cv-picker-icon" src={championSquareIcon(b.championKey)} alt={b.championName || ''} />
                      )}
                      <span className="cv-picker-name">{b.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {creatingTest ? (
            <div className="cv-test-create-form">
              <input
                className="cv-test-create-input"
                placeholder="Test name..."
                value={newTestName}
                onChange={e => setNewTestName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') createTestMut.mutate(newTestName.trim() || 'New Test')
                  if (e.key === 'Escape') { setCreatingTest(false); setNewTestName('') }
                }}
                autoFocus
              />
              <button className="cv-test-create-ok" onClick={() => createTestMut.mutate(newTestName.trim() || 'New Test')}>
                OK
              </button>
              <button className="cv-test-create-cancel" onClick={() => { setCreatingTest(false); setNewTestName('') }}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="cv-add-btn cv-add-test" onClick={() => setCreatingTest(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Test
            </button>
          )}
        </div>
      </header>

      {/* ── Canvas ── */}
      <div className="cv-canvas" ref={canvasRef}>
        {/* SVG connection lines */}
        <svg className="cv-svg-layer" width="100%" height="100%">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connections.map(conn => {
            const cb = canvasBuilds.find(cb => cb.buildId === conn.buildId)
            const test = tests.find(t => t.id === conn.testId)
            if (!cb || !test) return null

            const x1 = cb.x + CARD_W
            const y1 = cb.y + CARD_H / 2
            const x2 = test.x
            const y2 = test.y + CARD_H / 2

            return (
              <line
                key={conn.id}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                className={`cv-connection-line ${connectingBuildId && conn.buildId !== connectingBuildId ? 'dimmed' : ''}`}
                filter="url(#glow)"
              />
            )
          })}
        </svg>

        {/* Damage badges (HTML positioned at line midpoints) */}
        {connections.map(conn => {
          const cb = canvasBuilds.find(cb => cb.buildId === conn.buildId)
          const test = tests.find(t => t.id === conn.testId)
          if (!cb || !test) return null

          const mx = (cb.x + CARD_W + test.x) / 2
          const my = (cb.y + CARD_H / 2 + test.y + CARD_H / 2) / 2

          return (
            <div
              key={conn.id}
              className={`cv-damage-badge ${connectingBuildId && conn.buildId !== connectingBuildId ? 'dimmed' : ''}`}
              style={{ left: mx, top: my }}
            >
              {editingDamage === conn.id ? (
                <input
                  className="cv-damage-input"
                  type="number"
                  value={damageValue}
                  onChange={e => setDamageValue(e.target.value)}
                  onBlur={handleDamageSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleDamageSave(); if (e.key === 'Escape') setEditingDamage(null) }}
                  autoFocus
                />
              ) : (
                <span className="cv-damage-value" onClick={() => handleDamageEdit(conn.id, conn.damage)}>
                  {conn.damage > 0 ? formatDamage(conn.damage) : '0'}
                </span>
              )}
              <button className="cv-damage-delete" onClick={() => deleteConnMut.mutate(conn.id)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )
        })}

        {/* Build cards */}
        {canvasBuilds.map(cb => {
          const build = buildMap.get(cb.buildId)
          if (!build) return null
          const isConnecting = connectingBuildId === cb.buildId

          return (
            <div
              key={cb.id}
              className={`cv-card cv-build-card ${isConnecting ? 'connecting' : ''} ${connectingBuildId && !isConnecting ? 'dimmed' : ''}`}
              style={{ left: cb.x, top: cb.y, width: CARD_W }}
              onPointerDown={e => handlePointerDown(e, 'build', cb.id, cb.x, cb.y)}
              onClick={() => handleBuildCardClick(cb.buildId)}
            >
              <button className="cv-card-remove" onClick={e => { e.stopPropagation(); removeCBMut.mutate(cb.id) }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Link to="/build/$id" params={{ id: build.id }} className="cv-card-edit" onClick={e => e.stopPropagation()}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </Link>
              {build.championKey && (
                <img className="cv-card-champ" src={championSquareIcon(build.championKey)} alt={build.championName || ''} />
              )}
              <div className="cv-card-info">
                <div className="cv-card-name">{build.name}</div>
                {build.items.length > 0 && (
                  <div className="cv-card-items">
                    {build.items.slice(0, 3).map(item => (
                      <img key={item.slot} src={itemIcon(item.icon)} alt={item.name} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Test cards */}
        {tests.map(test => {
          const dummy = test.dummyId ? dummyMap.get(test.dummyId) : null
          const isTarget = !!connectingBuildId
          const isConnectedToSelected = connectedTestIds?.has(test.id) ?? false
          const isDimmedTest = connectingBuildId && !isConnectedToSelected

          return (
            <div
              key={test.id}
              className={`cv-card cv-test-card ${isTarget ? 'target' : ''} ${isDimmedTest ? 'dimmed' : ''} ${isConnectedToSelected ? 'connected' : ''}`}
              style={{ left: test.x, top: test.y, width: CARD_W }}
              onPointerDown={e => handlePointerDown(e, 'test', test.id, test.x, test.y)}
              onClick={() => handleTestClick(test.id)}
            >
              <button className="cv-card-remove" onClick={e => { e.stopPropagation(); deleteTestMut.mutate(test.id) }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="cv-test-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d44242" strokeWidth="2" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="cv-card-info">
                {editingTestName === test.id ? (
                  <input
                    className="cv-test-name-input"
                    value={testNameValue}
                    onChange={e => setTestNameValue(e.target.value)}
                    onBlur={handleTestNameSave}
                    onKeyDown={e => { if (e.key === 'Enter') handleTestNameSave(); if (e.key === 'Escape') setEditingTestName(null) }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <div className="cv-card-name cv-test-name" onDoubleClick={() => handleTestNameEdit(test.id, test.name)}>
                    {test.name}
                  </div>
                )}
                <div className="cv-test-dummy-row">
                  <button
                    className="cv-dummy-label"
                    onClick={e => { e.stopPropagation(); setDummyPickerTestId(prev => prev === test.id ? null : test.id) }}
                  >
                    {dummy ? (
                      <span className="cv-dummy-info">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="8" r="4" /><path d="M8 16h8v4H8z" />
                        </svg>
                        {dummy.name}
                        <span className="cv-dummy-stats">{dummy.health}HP {dummy.resist}R</span>
                      </span>
                    ) : (
                      <span className="cv-dummy-empty">+ Dummy</span>
                    )}
                  </button>
                  {dummy && (
                    <Link to="/dummy/$id" params={{ id: dummy.id }} className="cv-card-edit cv-card-edit-inline" onClick={e => e.stopPropagation()}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </Link>
                  )}
                  {dummyPickerTestId === test.id && (
                    <div className="cv-dummy-picker-dropdown" onClick={e => e.stopPropagation()}>
                      {dummies.length === 0 ? (
                        <div className="cv-picker-empty">
                          No dummies yet. <Link to="/dummy" className="cv-picker-link">Create one</Link>
                        </div>
                      ) : (
                        <>
                          {test.dummyId && (
                            <button
                              className="cv-picker-item cv-picker-item-none"
                              onClick={() => {
                                updateTestMut.mutate({ id: test.id, updates: { dummyId: null } })
                                setDummyPickerTestId(null)
                              }}
                            >
                              <span className="cv-picker-name">None</span>
                            </button>
                          )}
                          {dummies.map(d => (
                            <button
                              key={d.id}
                              className={`cv-picker-item ${test.dummyId === d.id ? 'active' : ''}`}
                              onClick={() => {
                                updateTestMut.mutate({ id: test.id, updates: { dummyId: d.id } })
                                setDummyPickerTestId(null)
                              }}
                            >
                              <div className="cv-picker-dummy-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="2" strokeLinecap="round">
                                  <circle cx="12" cy="8" r="4" /><path d="M8 16h8v4H8z" />
                                </svg>
                              </div>
                              <span className="cv-picker-name">{d.name}</span>
                              <span className="cv-picker-stats">
                                <span className="cv-picker-stat-hp">{d.health}HP</span>
                                <span className="cv-picker-stat-r">{d.resist}R</span>
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {canvasBuilds.length === 0 && tests.length === 0 && (
          <div className="cv-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#785a28" strokeWidth="1" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <p>Add builds and tests to start comparing</p>
            <p className="cv-empty-hint">Use the buttons above to place cards on the canvas</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: TestCanvasPage,
})
