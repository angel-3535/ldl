import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import './ItemDrawer.css'

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
  stats: Record<string, number>
}

export interface ItemEntry {
  id: number
  name: string
  gold: number
  icon: string
  tags: string[]
  stats: {
    ad?: number
    ap?: number
    hp?: number
    armor?: number
    mr?: number
    as?: number
    crit?: number
    mana?: number
    haste?: number
    lethality?: number
  }
}

const STAT_MAP: Record<string, keyof ItemEntry['stats']> = {
  FlatPhysicalDamageMod: 'ad',
  FlatMagicDamageMod: 'ap',
  FlatHPPoolMod: 'hp',
  FlatArmorMod: 'armor',
  FlatSpellBlockMod: 'mr',
  PercentAttackSpeedMod: 'as',
  FlatCritChanceMod: 'crit',
  FlatMPPoolMod: 'mana',
}

function parseAbilityHaste(description: string): number | undefined {
  const match = description.match(/<attention>(\d+)<\/attention>\s*Ability Haste/i)
  return match ? Number(match[1]) : undefined
}

function parseLethality(description: string): number | undefined {
  const match = description.match(/<attention>(\d+)<\/attention>\s*Lethality/i)
  return match ? Number(match[1]) : undefined
}

export function useItems() {
  return useQuery({
    queryKey: ['ddragon-items'],
    queryFn: async (): Promise<ItemEntry[]> => {
      const res = await fetch(DDRAGON_ITEMS_URL)
      const json = await res.json()
      const data = json.data as Record<string, DDragonItem>

      return Object.entries(data)
        .filter(([, item]) => {
          if (!item.gold.purchasable) return false
          if (!item.maps['11']) return false
          if (item.gold.total < 1000) return false
          return true
        })
        .map(([id, item]) => {
          const stats: ItemEntry['stats'] = {}

          for (const [key, val] of Object.entries(item.stats)) {
            const mapped = STAT_MAP[key]
            if (mapped) {
              stats[mapped] = mapped === 'as' ? Math.round(val * 100) : val
            }
          }

          const haste = parseAbilityHaste(item.description)
          if (haste) stats.haste = haste

          const lethality = parseLethality(item.description)
          if (lethality) stats.lethality = lethality

          return {
            id: Number(id),
            name: item.name,
            gold: item.gold.total,
            icon: item.image.full,
            tags: item.tags,
            stats,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: Infinity,
  })
}

const FILTER_TAGS = [
  { key: 'Damage', label: 'AD' },
  { key: 'SpellDamage', label: 'AP' },
  { key: 'Health', label: 'HP' },
  { key: 'Armor', label: 'Armor' },
  { key: 'SpellBlock', label: 'MR' },
  { key: 'AttackSpeed', label: 'AS' },
  { key: 'CriticalStrike', label: 'Crit' },
  { key: 'Mana', label: 'Mana' },
  { key: 'AbilityHaste', label: 'Haste' },
  { key: 'LifeSteal', label: 'Vamp' },
  { key: 'ArmorPenetration', label: 'Pen' },
  { key: 'Boots', label: 'Boots' },
] as const

type ViewMode = 'list' | 'grid'

const STAT_DISPLAY: { key: keyof ItemEntry['stats']; label: string; color: string }[] = [
  { key: 'ad', label: 'AD', color: '#ff8c00' },
  { key: 'ap', label: 'AP', color: '#7b68ee' },
  { key: 'hp', label: 'HP', color: '#a8d26a' },
  { key: 'armor', label: 'Armor', color: '#e8a848' },
  { key: 'mr', label: 'MR', color: '#49aab9' },
  { key: 'as', label: 'AS%', color: '#ffdd57' },
  { key: 'crit', label: 'Crit', color: '#d44242' },
  { key: 'mana', label: 'Mana', color: '#5b9bd5' },
  { key: 'haste', label: 'AH', color: '#c292e0' },
  { key: 'lethality', label: 'Leth', color: '#d44242' },
]

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="0" width="7" height="7" rx="1" />
      <rect x="9" y="0" width="7" height="7" rx="1" />
      <rect x="0" y="9" width="7" height="7" rx="1" />
      <rect x="9" y="9" width="7" height="7" rx="1" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="0" y="1" width="16" height="3" rx="1" />
      <rect x="0" y="6.5" width="16" height="3" rx="1" />
      <rect x="0" y="12" width="16" height="3" rx="1" />
    </svg>
  )
}

export default function ItemDrawer({
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
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 300)
    }
    if (!open) {
      setSearch('')
      setActiveFilter(null)
    }
  }, [open])

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
    let result = items

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((item) => item.name.toLowerCase().includes(q))
    }

    if (activeFilter) {
      result = result.filter((item) => item.tags.includes(activeFilter))
    }

    return result
  }, [items, search, activeFilter])

  const handleFilterClick = useCallback((tag: string) => {
    setActiveFilter((prev) => (prev === tag ? null : tag))
  }, [])

  const handleSelect = useCallback(
    (item: ItemEntry) => {
      onSelect({ id: item.id, name: item.name, icon: item.icon })
      onClose()
    },
    [onSelect, onClose],
  )

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

        <div className="drawer-toolbar">
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
          <div className="drawer-view-toggle">
            <button
              className={`drawer-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListIcon />
            </button>
            <button
              className={`drawer-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <GridIcon />
            </button>
          </div>
        </div>

        <div className="drawer-filters">
          {FILTER_TAGS.map((f) => (
            <button
              key={f.key}
              className={`drawer-filter-pill ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="drawer-items">
          {isLoading && <div className="drawer-loading">Loading items...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="drawer-empty">No items found</div>
          )}

          {viewMode === 'list' ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="drawer-item-row"
                onClick={() => handleSelect(item)}
              >
                <img
                  className="drawer-item-icon"
                  src={itemIcon(item.icon)}
                  alt={item.name}
                  loading="lazy"
                />
                <div className="drawer-item-info">
                  <div className="drawer-item-name">{item.name}</div>
                  <div className="drawer-item-meta">
                    <span className="drawer-item-gold">{item.gold.toLocaleString()}g</span>
                    <div className="drawer-item-stats">
                      {STAT_DISPLAY.map(({ key, label, color }) => {
                        const val = item.stats[key]
                        if (val == null) return null
                        return (
                          <span key={key} className="drawer-item-stat" style={{ color }}>
                            {val} {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="drawer-grid">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="drawer-grid-item"
                  onClick={() => handleSelect(item)}
                  title={`${item.name} — ${item.gold.toLocaleString()}g`}
                >
                  <img
                    src={itemIcon(item.icon)}
                    alt={item.name}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
