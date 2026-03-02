import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { getDummy, updateDummy } from '../../db'
import type { DummyItem } from '../../db'
import './index.css'

const DDRAGON_VERSION = '15.4.1'
const DDRAGON_ITEMS_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/item.json`

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`
}

interface DDragonItem {
  name: string
  gold: { total: number; purchasable: boolean }
  image: { full: string }
  maps: Record<string, boolean>
  into?: string[]
  from?: string[]
  tags: string[]
  description: string
}

function useItems() {
  return useQuery({
    queryKey: ['ddragon-items'],
    queryFn: async () => {
      const res = await fetch(DDRAGON_ITEMS_URL)
      const json = await res.json()
      const data = json.data as Record<string, DDragonItem>

      // Filter to completed items on Summoner's Rift (map 11) that are purchasable
      return Object.entries(data)
        .filter(([, item]) => {
          if (!item.gold.purchasable) return false
          if (!item.maps['11']) return false
          // Include items with total gold >= 1000 (completed items) or boots
          if (item.gold.total < 1000) return false
          return true
        })
        .map(([id, item]) => ({
          id: Number(id),
          name: item.name,
          gold: item.gold.total,
          icon: item.image.full,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: Infinity,
  })
}

function useDummy() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dummy'],
    queryFn: getDummy,
  })

  const mutation = useMutation({
    mutationFn: updateDummy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dummy'] })
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

function ItemDrawer({
  open,
  onClose,
  onSelect,
  slotIndex,
}: {
  open: boolean
  onClose: () => void
  onSelect: (item: { id: number; name: string; icon: string }) => void
  slotIndex: number | null
}) {
  const { data: items, isLoading } = useItems()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 300)
    }
    if (!open) setSearch('')
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const filtered = useMemo(() => {
    if (!items) return []
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(q))
  }, [items, search])

  return (
    <>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`drawer-panel ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">
            {slotIndex !== null ? `Slot ${slotIndex + 1} — Choose Item` : 'Choose Item'}
          </h2>
          <button className="drawer-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-search">
          <input
            ref={searchRef}
            className="drawer-search-input"
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="drawer-items">
          {isLoading && <div className="drawer-loading">Loading items...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="drawer-empty">No items found</div>
          )}
          {filtered.map((item) => (
            <div
              key={item.id}
              className="drawer-item-row"
              onClick={() => {
                onSelect({ id: item.id, name: item.name, icon: item.icon })
                onClose()
              }}
            >
              <img
                className="drawer-item-icon"
                src={itemIcon(item.icon)}
                alt={item.name}
                loading="lazy"
              />
              <div className="drawer-item-info">
                <div className="drawer-item-name">{item.name}</div>
                <div className="drawer-item-gold">{item.gold.toLocaleString()} gold</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function DummyPage() {
  const { dummy, isLoading, update } = useDummy()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [health, setHealth] = useState(0)
  const [resist, setResist] = useState(0)

  useEffect(() => {
    if (dummy) {
      setHealth(dummy.health)
      setResist(dummy.resist)
    }
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
      // Remove any existing item in this slot
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

  if (isLoading || !dummy) {
    return (
      <div className="dummy-page">
        <div className="dummy-bg-pattern" />
        <div className="dummy-loading" style={{ padding: '4rem', color: '#5b5a56' }}>
          Loading...
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
          <Link to="/" className="dummy-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Runes
          </Link>
        </div>
        <h1 className="dummy-title">Target Dummy</h1>
        <p className="dummy-subtitle">Configure practice target</p>
      </header>

      <div className="dummy-content">
        {/* Left side: Dummy image */}
        <div className="dummy-visual">
          <div className="dummy-image-frame">
            <img src="/Enemy_Target_Dummy_Render.webp" alt="Target Dummy" />
          </div>
          <div className="dummy-name-tag">Practice Dummy</div>
        </div>

        {/* Right side: Stats + Items */}
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

export const Route = createFileRoute('/dummy/')({
  component: DummyPage,
})
