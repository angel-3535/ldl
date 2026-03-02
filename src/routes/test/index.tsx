import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { listTests, createTest, listBuilds, listDummies } from '../../db'
import type { Test, Build, Dummy } from '../../db'
import { championSquareIcon } from '../../components/ChampionDrawer'
import './index.css'

function TestListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: listTests,
  })

  const { data: builds } = useQuery({
    queryKey: ['builds'],
    queryFn: listBuilds,
  })

  const { data: dummies } = useQuery({
    queryKey: ['dummies'],
    queryFn: listDummies,
  })

  const createMutation = useMutation({
    mutationFn: createTest,
    onSuccess: (test) => {
      queryClient.invalidateQueries({ queryKey: ['tests'] })
      navigate({ to: '/test/$id', params: { id: test.id } })
    },
  })

  const handleCreate = useCallback(() => {
    const name = newName.trim() || 'New Test'
    createMutation.mutate(name)
    setNewName('')
    setCreating(false)
  }, [newName, createMutation])

  const buildMap = new Map<string, Build>()
  builds?.forEach((b) => buildMap.set(b.id, b))

  const dummyMap = new Map<string, Dummy>()
  dummies?.forEach((d) => dummyMap.set(d.id, d))

  function formatDamage(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }

  return (
    <div className="test-page">
      <div className="test-bg-pattern" />

      <header className="test-header">
        <div className="test-header-row">
          <Link to="/" className="test-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Runes
          </Link>
        </div>
        <h1 className="test-title">Damage Tests</h1>
        <p className="test-subtitle">Track and compare damage output</p>
      </header>

      <div className="test-list-container">
        {creating ? (
          <div className="test-create-form">
            <input
              className="test-create-input"
              type="text"
              placeholder="Test name (e.g. 5 sec DPS)..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') {
                  setCreating(false)
                  setNewName('')
                }
              }}
              autoFocus
            />
            <div className="test-create-actions">
              <button className="test-create-confirm" onClick={handleCreate}>
                Create
              </button>
              <button className="test-create-cancel" onClick={() => { setCreating(false); setNewName('') }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="test-create-btn" onClick={() => setCreating(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Test
          </button>
        )}

        <div className="test-section-divider">
          <div className="test-section-divider-line" />
          <div className="test-section-divider-diamond" />
          <div className="test-section-divider-line" />
        </div>

        {isLoading && (
          <div className="test-list-loading">Loading...</div>
        )}

        {!isLoading && (!tests || tests.length === 0) && (
          <div className="test-list-empty">
            <div className="test-list-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#785a28" strokeWidth="1" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <p>No tests yet</p>
            <p className="test-list-empty-hint">Create one to start tracking damage</p>
          </div>
        )}

        <div className="test-list-grid">
          {tests?.map((test: Test) => {
            const build = test.buildId ? buildMap.get(test.buildId) : null
            const dummy = test.dummyId ? dummyMap.get(test.dummyId) : null

            return (
              <Link
                key={test.id}
                to="/test/$id"
                params={{ id: test.id }}
                className="test-card"
              >
                <div className="test-card-left">
                  <div className="test-card-damage">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d44242" strokeWidth="2" strokeLinecap="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span className="test-card-damage-value">
                      {test.totalDamage > 0 ? formatDamage(test.totalDamage) : '—'}
                    </span>
                  </div>
                </div>
                <div className="test-card-info">
                  <div className="test-card-name">{test.name}</div>
                  {test.description && (
                    <div className="test-card-desc">{test.description}</div>
                  )}
                  <div className="test-card-refs">
                    {build && (
                      <span className="test-card-ref build-ref">
                        {build.championKey && (
                          <img
                            className="test-card-ref-icon"
                            src={championSquareIcon(build.championKey)}
                            alt={build.championName || ''}
                          />
                        )}
                        {build.name}
                      </span>
                    )}
                    {dummy && (
                      <span className="test-card-ref dummy-ref">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M8 16h8v4H8z" />
                        </svg>
                        {dummy.name}
                      </span>
                    )}
                    {!build && !dummy && (
                      <span className="test-card-no-ref">No build or dummy assigned</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/test/')({
  component: TestListPage,
})
