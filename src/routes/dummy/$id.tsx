import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getDummyById, updateDummyById, deleteDummy } from '../../db'
import type { DummyItem } from '../../db'
import ItemDrawer from '../../components/ItemDrawer'
import './index.css'

const DDRAGON_VERSION = '15.4.1'

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`
}

function useDummy(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dummy', id],
    queryFn: () => getDummyById(id),
  })

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateDummyById>[1]) =>
      updateDummyById(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dummy', id] })
    },
  })

  return { dummy: query.data, isLoading: query.isLoading, update: mutation.mutate }
}


function HealthIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#a8d26a" strokeWidth="2" strokeLinecap="round">
      <path d="M12 21C12 21 4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 12-8 12z" fill="rgba(168,210,106,0.15)" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#49aab9" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2l8 4v6c0 5.25-3.5 9.75-8 11-4.5-1.25-8-5.75-8-11V6l8-4z" fill="rgba(73,170,185,0.15)" />
    </svg>
  )
}

function DummyEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { dummy, isLoading, update } = useDummy(id)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [health, setHealth] = useState(0)
  const [resist, setResist] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!dummy) return
    queueMicrotask(() => {
      setHealth(dummy.health)
      setResist(dummy.resist)
      setNameValue(dummy.name)
    })
  }, [dummy])

  const flashSaved = useCallback(() => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }, [])

  const persistStat = useCallback(
    (field: 'health' | 'resist', value: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        update({ [field]: value })
        flashSaved()
      }, 500)
    },
    [update, flashSaved],
  )

  const handleStatChange = useCallback(
    (field: 'health' | 'resist', value: number) => {
      if (field === 'health') setHealth(value)
      else setResist(value)
      persistStat(field, value)
    },
    [persistStat],
  )

  const stepStat = useCallback(
    (field: 'health' | 'resist', delta: number) => {
      const setter = field === 'health' ? setHealth : setResist
      setter((prev) => {
        const next = Math.max(0, prev + delta)
        persistStat(field, next)
        return next
      })
    },
    [persistStat],
  )

  const handleSlotClick = useCallback((index: number) => {
    setActiveSlot(index)
    setDrawerOpen(true)
  }, [])

  const handleItemSelect = useCallback(
    (item: { id: number; name: string; icon: string }) => {
      if (activeSlot === null || !dummy) return
      const items = [...(dummy.items || [])]
      const filtered = items.filter((i) => i.slot !== activeSlot)
      filtered.push({ slot: activeSlot, itemId: item.id, name: item.name, icon: item.icon })
      update({ items: filtered })
      flashSaved()
    },
    [activeSlot, dummy, update, flashSaved],
  )

  const handleItemRemove = useCallback(
    (slot: number, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!dummy) return
      const items = (dummy.items || []).filter((i) => i.slot !== slot)
      update({ items })
      flashSaved()
    },
    [dummy, update, flashSaved],
  )

  const handleNameSave = useCallback(() => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== dummy?.name) {
      update({ name: trimmed })
      flashSaved()
    }
    setEditingName(false)
  }, [nameValue, dummy, update, flashSaved])

  const handleDelete = useCallback(async () => {
    await deleteDummy(id)
    queryClient.invalidateQueries({ queryKey: ['dummies'] })
    navigate({ to: '/dummy' })
  }, [id, queryClient, navigate])

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  if (isLoading) {
    return (
      <div className="dummy-page">
        <div className="dummy-bg-pattern" />
        <div className="dummy-loading" style={{ padding: '4rem', color: '#5b5a56' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (!dummy) {
    return (
      <div className="dummy-page">
        <div className="dummy-bg-pattern" />
        <div className="dummy-not-found">
          <p>Dummy not found</p>
          <Link to="/dummy" className="dummy-back-link">Back to dummies</Link>
        </div>
      </div>
    )
  }

  const itemsBySlot: Record<number, DummyItem> = {}
  for (const item of dummy.items) {
    itemsBySlot[item.slot] = item
  }

  return (
    <div className="dummy-page">
      <div className="dummy-bg-pattern" />

      <header className="dummy-header">
        <div className="dummy-header-row">
          <Link to="/dummy" className="dummy-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dummies
          </Link>
          <button className="dummy-delete-btn" onClick={handleDelete}>
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
            className="dummy-title-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') {
                setNameValue(dummy.name)
                setEditingName(false)
              }
            }}
          />
        ) : (
          <h1 className="dummy-title" onClick={() => setEditingName(true)} style={{ cursor: 'pointer' }}>
            {dummy.name}
          </h1>
        )}
        <p className="dummy-subtitle">Configure practice target</p>
      </header>

      <div className="dummy-content">
        <div className="dummy-visual">
          <div className="dummy-image-frame">
            <img src="/Enemy_Target_Dummy_Render.webp" alt="Target Dummy" />
          </div>
          <div className="dummy-name-tag">{dummy.name}</div>
        </div>

        <div className="dummy-stats-panel">
          <div className="dummy-section-label">Stats</div>
          <div className="dummy-stat-group">
            <div className="dummy-stat-row">
              <div className="dummy-stat-icon">
                <HealthIcon />
              </div>
              <div className="dummy-stat-info">
                <span className="dummy-stat-name">Health</span>
              </div>
              <div className="dummy-stat-input-wrapper">
                <input
                  type="number"
                  className="dummy-stat-input"
                  value={health}
                  min={1}
                  max={99999}
                  onChange={(e) => handleStatChange('health', Number(e.target.value))}
                />
                <div className="dummy-stat-steppers">
                  <button className="dummy-stat-step" onClick={() => stepStat('health', 100)} type="button">
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2,7 5,3 8,7" /></svg>
                  </button>
                  <button className="dummy-stat-step" onClick={() => stepStat('health', -100)} type="button">
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2,3 5,7 8,3" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="dummy-stat-row">
              <div className="dummy-stat-icon">
                <ShieldIcon />
              </div>
              <div className="dummy-stat-info">
                <span className="dummy-stat-name">Armor / Magic Resist</span>
              </div>
              <div className="dummy-stat-input-wrapper">
                <input
                  type="number"
                  className="dummy-stat-input"
                  value={resist}
                  min={0}
                  max={9999}
                  onChange={(e) => handleStatChange('resist', Number(e.target.value))}
                />
                <div className="dummy-stat-steppers">
                  <button className="dummy-stat-step" onClick={() => stepStat('resist', 10)} type="button">
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2,7 5,3 8,7" /></svg>
                  </button>
                  <button className="dummy-stat-step" onClick={() => stepStat('resist', -10)} type="button">
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="2,3 5,7 8,3" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dummy-section-divider">
            <div className="dummy-section-divider-line" />
            <div className="dummy-section-divider-diamond" />
            <div className="dummy-section-divider-line" />
          </div>

          <div className="dummy-section-label">Items</div>
          <div className="dummy-items-grid">
            {Array.from({ length: 6 }, (_, i) => {
              const item = itemsBySlot[i]
              return (
                <div
                  key={i}
                  className={`dummy-item-slot ${item ? 'has-item' : ''}`}
                  onClick={() => handleSlotClick(i)}
                >
                  <span className="dummy-item-slot-number">{i + 1}</span>
                  {item ? (
                    <>
                      <img src={itemIcon(item.icon)} alt={item.name} />
                      <span className="dummy-item-tooltip">{item.name}</span>
                      <button
                        className="dummy-item-remove"
                        onClick={(e) => handleItemRemove(i, e)}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="dummy-item-slot-empty">+</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className={`dummy-saved ${savedFlash ? 'just-saved' : ''}`}>
            {savedFlash ? 'Saved' : 'Auto-saves to IndexedDB'}
          </div>
        </div>
      </div>

      <ItemDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleItemSelect}
        slotIndex={activeSlot}
      />
    </div>
  )
}

export const Route = createFileRoute('/dummy/$id')({
  component: DummyEditPage,
})
