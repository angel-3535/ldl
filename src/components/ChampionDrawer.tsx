import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConfiguredHotkey } from '../hotkeys'
import { championSquareIcon } from '../lib/ddragon'
import './ChampionDrawer.css'

const DDRAGON_VERSION = '15.4.1'
const DDRAGON_CHAMPIONS_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/champion.json`

interface DDragonChampion {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  partype: string
  image: { full: string }
}

export interface ChampionEntry {
  key: string
  name: string
  title: string
  tags: string[]
  icon: string
}

function useChampions() {
  return useQuery({
    queryKey: ['ddragon-champions'],
    queryFn: async (): Promise<ChampionEntry[]> => {
      const res = await fetch(DDRAGON_CHAMPIONS_URL)
      const json = await res.json()
      const data = json.data as Record<string, DDragonChampion>

      return Object.values(data)
        .map((champ) => ({
          key: champ.id,
          name: champ.name,
          title: champ.title,
          tags: champ.tags,
          icon: champ.image.full,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: Infinity,
  })
}

const ROLE_FILTERS = [
  { key: 'Fighter', label: 'Fighter' },
  { key: 'Tank', label: 'Tank' },
  { key: 'Mage', label: 'Mage' },
  { key: 'Assassin', label: 'Assassin' },
  { key: 'Marksman', label: 'Marksman' },
  { key: 'Support', label: 'Support' },
] as const

type ViewMode = 'list' | 'grid'

const TAG_COLORS: Record<string, string> = {
  Fighter: '#c8aa6e',
  Tank: '#a8d26a',
  Mage: '#9faafc',
  Assassin: '#d44242',
  Marksman: '#ff8c00',
  Support: '#49aab9',
}

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

export default function ChampionDrawer({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (champion: { key: string; name: string }) => void
}) {
  const { data: champions, isLoading } = useChampions()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const searchRef = useRef<HTMLInputElement>(null)
  const handleClose = useCallback(() => {
    setSearch('')
    setActiveFilter(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 300)
    }
  }, [open])

  useConfiguredHotkey('closeOverlay', handleClose, { enabled: open, allowInInput: true })

  const filtered = useMemo(() => {
    if (!champions) return []
    let result = champions

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }

    if (activeFilter) {
      result = result.filter((c) => c.tags.includes(activeFilter))
    }

    return result
  }, [champions, search, activeFilter])

  const handleFilterClick = useCallback((tag: string) => {
    setActiveFilter((prev) => (prev === tag ? null : tag))
  }, [])

  const handleSelect = useCallback(
    (champ: ChampionEntry) => {
      onSelect({ key: champ.key, name: champ.name })
      onClose()
    },
    [onSelect, onClose],
  )

  return (
    <>
      <div className={`champ-drawer-overlay ${open ? 'open' : ''}`} onClick={handleClose} />
      <div className={`champ-drawer-panel ${open ? 'open' : ''}`}>
        <div className="champ-drawer-header">
          <h2 className="champ-drawer-title">Choose Champion</h2>
          <button className="champ-drawer-close" onClick={handleClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="champ-drawer-toolbar">
          <div className="champ-drawer-search">
            <input
              ref={searchRef}
              className="champ-drawer-search-input"
              type="text"
              placeholder="Search champions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="champ-drawer-view-toggle">
            <button
              className={`champ-drawer-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListIcon />
            </button>
            <button
              className={`champ-drawer-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <GridIcon />
            </button>
          </div>
        </div>

        <div className="champ-drawer-filters">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`champ-drawer-filter-pill ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.key)}
              style={activeFilter === f.key ? { '--filter-color': TAG_COLORS[f.key] } as React.CSSProperties : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="champ-drawer-items">
          {isLoading && <div className="champ-drawer-loading">Loading champions...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="champ-drawer-empty">No champions found</div>
          )}

          {viewMode === 'list' ? (
            filtered.map((champ) => (
              <div
                key={champ.key}
                className="champ-drawer-row"
                onClick={() => handleSelect(champ)}
              >
                <img
                  className="champ-drawer-icon"
                  src={championSquareIcon(champ.key)}
                  alt={champ.name}
                  loading="lazy"
                />
                <div className="champ-drawer-info">
                  <div className="champ-drawer-name">{champ.name}</div>
                  <div className="champ-drawer-meta">
                    <span className="champ-drawer-title-text">{champ.title}</span>
                    <div className="champ-drawer-tags">
                      {champ.tags.map((tag) => (
                        <span key={tag} className="champ-drawer-tag" style={{ color: TAG_COLORS[tag] || '#a09b8c' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="champ-drawer-grid">
              {filtered.map((champ) => (
                <div
                  key={champ.key}
                  className="champ-drawer-grid-item"
                  onClick={() => handleSelect(champ)}
                  title={champ.name}
                >
                  <img
                    src={championSquareIcon(champ.key)}
                    alt={champ.name}
                    loading="lazy"
                  />
                  <span className="champ-drawer-grid-name">{champ.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
