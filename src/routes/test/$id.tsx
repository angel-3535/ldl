import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getTestById, updateTestById, deleteTest, listBuilds, listDummies } from '../../db'
import type { Build, Dummy } from '../../db'
import { championSquareIcon } from '../../components/ChampionDrawer'
import './index.css'

const DDRAGON_VERSION = '15.4.1'

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`
}

function useTest(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['test', id],
    queryFn: () => getTestById(id),
  })

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateTestById>[1]) =>
      updateTestById(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', id] })
    },
  })

  return { test: query.data, isLoading: query.isLoading, update: mutation.mutate }
}

function TestEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { test, isLoading, update } = useTest(id)
  const [savedFlash, setSavedFlash] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [descValue, setDescValue] = useState('')
  const [damageValue, setDamageValue] = useState('')
  const [buildPickerOpen, setBuildPickerOpen] = useState(false)
  const [dummyPickerOpen, setDummyPickerOpen] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const { data: builds } = useQuery({
    queryKey: ['builds'],
    queryFn: listBuilds,
  })

  const { data: dummies } = useQuery({
    queryKey: ['dummies'],
    queryFn: listDummies,
  })

  useEffect(() => {
    if (test) {
      setNameValue(test.name)
      setDescValue(test.description)
      setDamageValue(String(test.totalDamage))
    }
  }, [test])

  const flashSaved = useCallback(() => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }, [])

  const handleNameSave = useCallback(() => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== test?.name) {
      update({ name: trimmed })
      flashSaved()
    }
    setEditingName(false)
  }, [nameValue, test, update, flashSaved])

  const handleDescSave = useCallback(() => {
    if (descValue !== test?.description) {
      update({ description: descValue })
      flashSaved()
    }
  }, [descValue, test, update, flashSaved])

  const handleDamageSave = useCallback(() => {
    const num = parseInt(damageValue, 10)
    const val = isNaN(num) ? 0 : Math.max(0, num)
    if (val !== test?.totalDamage) {
      update({ totalDamage: val })
      flashSaved()
    }
    setDamageValue(String(val))
  }, [damageValue, test, update, flashSaved])

  const handleBuildSelect = useCallback((buildId: string | null) => {
    update({ buildId })
    flashSaved()
    setBuildPickerOpen(false)
  }, [update, flashSaved])

  const handleDummySelect = useCallback((dummyId: string | null) => {
    update({ dummyId })
    flashSaved()
    setDummyPickerOpen(false)
  }, [update, flashSaved])

  const handleDelete = useCallback(async () => {
    await deleteTest(id)
    queryClient.invalidateQueries({ queryKey: ['tests'] })
    navigate({ to: '/test' })
  }, [id, queryClient, navigate])

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  if (isLoading) {
    return (
      <div className="test-page">
        <div className="test-bg-pattern" />
        <div className="test-loading" style={{ padding: '4rem', color: '#5b5a56' }}>Loading...</div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="test-page">
        <div className="test-bg-pattern" />
        <div className="test-not-found">
          <p>Test not found</p>
          <Link to="/test" className="test-back-link">Back to tests</Link>
        </div>
      </div>
    )
  }

  const selectedBuild = test.buildId ? builds?.find((b) => b.id === test.buildId) : null
  const selectedDummy = test.dummyId ? dummies?.find((d) => d.id === test.dummyId) : null

  return (
    <div className="test-page">
      <div className="test-bg-pattern" />

      <header className="test-header">
        <div className="test-header-row">
          <Link to="/test" className="test-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Tests
          </Link>
          <button className="test-delete-btn" onClick={handleDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
        {editingName ? (
          <input
            ref={nameInputRef}
            className="test-title-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') {
                setNameValue(test.name)
                setEditingName(false)
              }
            }}
          />
        ) : (
          <h1 className="test-title" onClick={() => setEditingName(true)} style={{ cursor: 'pointer' }}>
            {test.name}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="test-edit-icon">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </h1>
        )}
        <p className="test-subtitle">Configure test parameters</p>
      </header>

      <div className="test-content">
        {/* ── Damage Input ── */}
        <div className="test-damage-section">
          <div className="test-section-label">Total Damage</div>
          <div className="test-damage-input-wrapper">
            <svg className="test-damage-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d44242" strokeWidth="2" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <input
              className="test-damage-input"
              type="number"
              min="0"
              value={damageValue}
              onChange={(e) => setDamageValue(e.target.value)}
              onBlur={handleDamageSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDamageSave() }}
              placeholder="0"
            />
          </div>
        </div>

        {/* ── Description ── */}
        <div className="test-desc-section">
          <div className="test-section-label">Description</div>
          <textarea
            className="test-desc-input"
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={handleDescSave}
            placeholder="e.g. 5 sec sustained DPS, full combo no ult, level 18 full build..."
            rows={3}
          />
        </div>

        <div className="test-section-divider">
          <div className="test-section-divider-line" />
          <div className="test-section-divider-diamond" />
          <div className="test-section-divider-line" />
        </div>

        {/* ── Build Picker ── */}
        <div className="test-ref-section">
          <div className="test-section-label">Build</div>
          {selectedBuild ? (
            <div className="test-ref-selected">
              <BuildPreview build={selectedBuild} />
              <div className="test-ref-actions">
                <Link to="/build/$id" params={{ id: selectedBuild.id }} className="test-ref-goto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
                <button className="test-ref-change" onClick={() => setBuildPickerOpen(!buildPickerOpen)}>
                  Change
                </button>
                <button className="test-ref-remove" onClick={() => handleBuildSelect(null)}>
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button className="test-ref-pick-btn" onClick={() => setBuildPickerOpen(!buildPickerOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Select a Build
            </button>
          )}
          {buildPickerOpen && (
            <div className="test-ref-picker">
              {(!builds || builds.length === 0) ? (
                <div className="test-ref-picker-empty">
                  No builds available.{' '}
                  <Link to="/build" className="test-ref-picker-link">Create one</Link>
                </div>
              ) : (
                builds.map((b: Build) => (
                  <button
                    key={b.id}
                    className={`test-ref-picker-item ${test.buildId === b.id ? 'active' : ''}`}
                    onClick={() => handleBuildSelect(b.id)}
                  >
                    {b.championKey && (
                      <img className="test-ref-picker-icon" src={championSquareIcon(b.championKey)} alt={b.championName || ''} />
                    )}
                    <span className="test-ref-picker-name">{b.name}</span>
                    {b.items.length > 0 && (
                      <span className="test-ref-picker-items">
                        {b.items.slice(0, 3).map((item) => (
                          <img key={item.slot} src={itemIcon(item.icon)} alt={item.name} />
                        ))}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Dummy Picker ── */}
        <div className="test-ref-section">
          <div className="test-section-label">Target Dummy</div>
          {selectedDummy ? (
            <div className="test-ref-selected">
              <DummyPreview dummy={selectedDummy} />
              <div className="test-ref-actions">
                <Link to="/dummy/$id" params={{ id: selectedDummy.id }} className="test-ref-goto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
                <button className="test-ref-change" onClick={() => setDummyPickerOpen(!dummyPickerOpen)}>
                  Change
                </button>
                <button className="test-ref-remove" onClick={() => handleDummySelect(null)}>
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button className="test-ref-pick-btn" onClick={() => setDummyPickerOpen(!dummyPickerOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M8 16h8v4H8z" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
              Select a Dummy
            </button>
          )}
          {dummyPickerOpen && (
            <div className="test-ref-picker">
              {(!dummies || dummies.length === 0) ? (
                <div className="test-ref-picker-empty">
                  No dummies available.{' '}
                  <Link to="/dummy" className="test-ref-picker-link">Create one</Link>
                </div>
              ) : (
                dummies.map((d: Dummy) => (
                  <button
                    key={d.id}
                    className={`test-ref-picker-item ${test.dummyId === d.id ? 'active' : ''}`}
                    onClick={() => handleDummySelect(d.id)}
                  >
                    <div className="test-ref-picker-dummy-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M8 16h8v4H8z" />
                      </svg>
                    </div>
                    <span className="test-ref-picker-name">{d.name}</span>
                    <span className="test-ref-picker-stats">
                      <span className="test-ref-stat health">{d.health} HP</span>
                      <span className="test-ref-stat resist">{d.resist} Resist</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`test-saved ${savedFlash ? 'just-saved' : ''}`}>
        {savedFlash ? 'Saved' : 'Auto-saves to IndexedDB'}
      </div>
    </div>
  )
}

function BuildPreview({ build }: { build: Build }) {
  return (
    <div className="test-ref-preview">
      {build.championKey && (
        <img className="test-ref-preview-champ" src={championSquareIcon(build.championKey)} alt={build.championName || ''} />
      )}
      <div className="test-ref-preview-info">
        <span className="test-ref-preview-name">{build.name}</span>
        {build.items.length > 0 && (
          <div className="test-ref-preview-items">
            {build.items.slice(0, 6).map((item) => (
              <img key={item.slot} src={itemIcon(item.icon)} alt={item.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DummyPreview({ dummy }: { dummy: Dummy }) {
  return (
    <div className="test-ref-preview">
      <div className="test-ref-preview-dummy-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M8 16h8v4H8z" />
          <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
      </div>
      <div className="test-ref-preview-info">
        <span className="test-ref-preview-name">{dummy.name}</span>
        <div className="test-ref-preview-stats">
          <span className="test-ref-stat health">{dummy.health} HP</span>
          <span className="test-ref-stat resist">{dummy.resist} Resist</span>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/test/$id')({
  component: TestEditPage,
})
