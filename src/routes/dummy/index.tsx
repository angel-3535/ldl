import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { listDummies, createDummy } from '../../db'
import type { Dummy } from '../../db'
import './index.css'

const DDRAGON_VERSION = '15.4.1'

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`
}

function DummyListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: dummies, isLoading } = useQuery({
    queryKey: ['dummies'],
    queryFn: listDummies,
  })

  const createMutation = useMutation({
    mutationFn: createDummy,
    onSuccess: (dummy) => {
      queryClient.invalidateQueries({ queryKey: ['dummies'] })
      navigate({ to: '/dummy/$id', params: { id: dummy.id } })
    },
  })

  const handleCreate = useCallback(() => {
    const name = newName.trim() || 'Target Dummy'
    createMutation.mutate(name)
    setNewName('')
    setCreating(false)
  }, [newName, createMutation])

  return (
    <div className="dummy-page">
      <div className="dummy-bg-pattern" />

      <header className="dummy-header">
        <div className="dummy-header-row">
          <Link to="/" className="dummy-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Canvas
          </Link>
        </div>
        <h1 className="dummy-title">Target Dummies</h1>
        <p className="dummy-subtitle">Create and manage practice targets</p>
      </header>

      <div className="dummy-list-container">
        {creating ? (
          <div className="dummy-create-form">
            <input
              className="dummy-create-input"
              type="text"
              placeholder="Dummy name..."
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
            <div className="dummy-create-actions">
              <button className="dummy-create-confirm" onClick={handleCreate}>
                Create
              </button>
              <button className="dummy-create-cancel" onClick={() => { setCreating(false); setNewName('') }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="dummy-create-btn" onClick={() => setCreating(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Dummy
          </button>
        )}

        <div className="dummy-section-divider">
          <div className="dummy-section-divider-line" />
          <div className="dummy-section-divider-diamond" />
          <div className="dummy-section-divider-line" />
        </div>

        {isLoading && (
          <div className="dummy-list-loading">Loading...</div>
        )}

        {!isLoading && (!dummies || dummies.length === 0) && (
          <div className="dummy-list-empty">
            <div className="dummy-list-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#785a28" strokeWidth="1" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M8 16h8v4H8z" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
            </div>
            <p>No dummies yet</p>
            <p className="dummy-list-empty-hint">Create one to get started</p>
          </div>
        )}

        <div className="dummy-list-grid">
          {dummies?.map((dummy: Dummy) => (
            <Link
              key={dummy.id}
              to="/dummy/$id"
              params={{ id: dummy.id }}
              className="dummy-card"
            >
              <div className="dummy-card-image">
                <img src="/Enemy_Target_Dummy_Render.webp" alt={dummy.name} />
              </div>
              <div className="dummy-card-info">
                <div className="dummy-card-name">{dummy.name}</div>
                <div className="dummy-card-stats">
                  <span className="dummy-card-stat health">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#a8d26a" strokeWidth="2" strokeLinecap="round" width="12" height="12">
                      <path d="M12 21C12 21 4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 12-8 12z" fill="rgba(168,210,106,0.15)" />
                    </svg>
                    {dummy.health}
                  </span>
                  <span className="dummy-card-stat resist">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="2" strokeLinecap="round" width="12" height="12">
                      <path d="M12 2l8 4v6c0 5.25-3.5 9.75-8 11-4.5-1.25-8-5.75-8-11V6l8-4z" fill="rgba(73,170,185,0.15)" />
                    </svg>
                    {dummy.resist}
                  </span>
                </div>
                {dummy.items.length > 0 && (
                  <div className="dummy-card-items">
                    {dummy.items.slice(0, 6).map((item) => (
                      <img
                        key={item.slot}
                        className="dummy-card-item-icon"
                        src={itemIcon(item.icon)}
                        alt={item.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/dummy/')({
  component: DummyListPage,
})
