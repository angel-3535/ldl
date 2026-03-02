import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef, useEffect } from 'react'
import './index.css'

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/img'

interface Rune {
  id: number
  key: string
  icon: string
  name: string
}

interface RunePath {
  id: number
  key: string
  icon: string
  name: string
  slots: { runes: Rune[] }[]
}

const RUNE_PATHS: RunePath[] = [
  {
    id: 8000, key: 'Precision', icon: 'perk-images/Styles/7201_Precision.png', name: 'Precision',
    slots: [
      { runes: [
        { id: 8005, key: 'PressTheAttack', icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png', name: 'Press the Attack' },
        { id: 8021, key: 'FleetFootwork', icon: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png', name: 'Fleet Footwork' },
        { id: 8010, key: 'Conqueror', icon: 'perk-images/Styles/Precision/Conqueror/Conqueror.png', name: 'Conqueror' },
      ]},
      { runes: [
        { id: 9101, key: 'AbsorbLife', icon: 'perk-images/Styles/Precision/AbsorbLife/AbsorbLife.png', name: 'Absorb Life' },
        { id: 9111, key: 'Triumph', icon: 'perk-images/Styles/Precision/Triumph.png', name: 'Triumph' },
        { id: 8009, key: 'PresenceOfMind', icon: 'perk-images/Styles/Precision/PresenceOfMind/PresenceOfMind.png', name: 'Presence of Mind' },
      ]},
      { runes: [
        { id: 9104, key: 'LegendAlacrity', icon: 'perk-images/Styles/Precision/LegendAlacrity/LegendAlacrity.png', name: 'Legend: Alacrity' },
        { id: 9105, key: 'LegendHaste', icon: 'perk-images/Styles/Precision/LegendHaste/LegendHaste.png', name: 'Legend: Haste' },
        { id: 9103, key: 'LegendBloodline', icon: 'perk-images/Styles/Precision/LegendBloodline/LegendBloodline.png', name: 'Legend: Bloodline' },
      ]},
      { runes: [
        { id: 8014, key: 'CoupDeGrace', icon: 'perk-images/Styles/Precision/CoupDeGrace/CoupDeGrace.png', name: 'Coup de Grace' },
        { id: 8017, key: 'CutDown', icon: 'perk-images/Styles/Precision/CutDown/CutDown.png', name: 'Cut Down' },
        { id: 8299, key: 'LastStand', icon: 'perk-images/Styles/Sorcery/LastStand/LastStand.png', name: 'Last Stand' },
      ]},
    ],
  },
  {
    id: 8100, key: 'Domination', icon: 'perk-images/Styles/7200_Domination.png', name: 'Domination',
    slots: [
      { runes: [
        { id: 8112, key: 'Electrocute', icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png', name: 'Electrocute' },
        { id: 8128, key: 'DarkHarvest', icon: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png', name: 'Dark Harvest' },
        { id: 9923, key: 'HailOfBlades', icon: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png', name: 'Hail of Blades' },
      ]},
      { runes: [
        { id: 8126, key: 'CheapShot', icon: 'perk-images/Styles/Domination/CheapShot/CheapShot.png', name: 'Cheap Shot' },
        { id: 8139, key: 'TasteOfBlood', icon: 'perk-images/Styles/Domination/TasteOfBlood/GreenTerror_TasteOfBlood.png', name: 'Taste of Blood' },
        { id: 8143, key: 'SuddenImpact', icon: 'perk-images/Styles/Domination/SuddenImpact/SuddenImpact.png', name: 'Sudden Impact' },
      ]},
      { runes: [
        { id: 8136, key: 'ZombieWard', icon: 'perk-images/Styles/Domination/ZombieWard/ZombieWard.png', name: 'Zombie Ward' },
        { id: 8120, key: 'GhostPoro', icon: 'perk-images/Styles/Domination/GhostPoro/GhostPoro.png', name: 'Ghost Poro' },
        { id: 8138, key: 'EyeballCollection', icon: 'perk-images/Styles/Domination/EyeballCollection/EyeballCollection.png', name: 'Eyeball Collection' },
      ]},
      { runes: [
        { id: 8135, key: 'TreasureHunter', icon: 'perk-images/Styles/Domination/TreasureHunter/TreasureHunter.png', name: 'Treasure Hunter' },
        { id: 8105, key: 'RelentlessHunter', icon: 'perk-images/Styles/Domination/RelentlessHunter/RelentlessHunter.png', name: 'Relentless Hunter' },
        { id: 8106, key: 'UltimateHunter', icon: 'perk-images/Styles/Domination/UltimateHunter/UltimateHunter.png', name: 'Ultimate Hunter' },
      ]},
    ],
  },
  {
    id: 8200, key: 'Sorcery', icon: 'perk-images/Styles/7202_Sorcery.png', name: 'Sorcery',
    slots: [
      { runes: [
        { id: 8214, key: 'SummonAery', icon: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png', name: 'Summon Aery' },
        { id: 8229, key: 'ArcaneComet', icon: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png', name: 'Arcane Comet' },
        { id: 8230, key: 'PhaseRush', icon: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png', name: 'Phase Rush' },
      ]},
      { runes: [
        { id: 8224, key: 'NullifyingOrb', icon: 'perk-images/Styles/Sorcery/NullifyingOrb/Pokeshield.png', name: 'Nullifying Orb' },
        { id: 8226, key: 'ManaflowBand', icon: 'perk-images/Styles/Sorcery/ManaflowBand/ManaflowBand.png', name: 'Manaflow Band' },
        { id: 8275, key: 'NimbusCloak', icon: 'perk-images/Styles/Sorcery/NimbusCloak/6361.png', name: 'Nimbus Cloak' },
      ]},
      { runes: [
        { id: 8210, key: 'Transcendence', icon: 'perk-images/Styles/Sorcery/Transcendence/Transcendence.png', name: 'Transcendence' },
        { id: 8234, key: 'Celerity', icon: 'perk-images/Styles/Sorcery/Celerity/CelerityTemp.png', name: 'Celerity' },
        { id: 8233, key: 'AbsoluteFocus', icon: 'perk-images/Styles/Sorcery/AbsoluteFocus/AbsoluteFocus.png', name: 'Absolute Focus' },
      ]},
      { runes: [
        { id: 8237, key: 'Scorch', icon: 'perk-images/Styles/Sorcery/Scorch/Scorch.png', name: 'Scorch' },
        { id: 8232, key: 'Waterwalking', icon: 'perk-images/Styles/Sorcery/Waterwalking/Waterwalking.png', name: 'Waterwalking' },
        { id: 8236, key: 'GatheringStorm', icon: 'perk-images/Styles/Sorcery/GatheringStorm/GatheringStorm.png', name: 'Gathering Storm' },
      ]},
    ],
  },
  {
    id: 8400, key: 'Resolve', icon: 'perk-images/Styles/7204_Resolve.png', name: 'Resolve',
    slots: [
      { runes: [
        { id: 8437, key: 'GraspOfTheUndying', icon: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png', name: 'Grasp of the Undying' },
        { id: 8439, key: 'Aftershock', icon: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png', name: 'Aftershock' },
        { id: 8465, key: 'Guardian', icon: 'perk-images/Styles/Resolve/Guardian/Guardian.png', name: 'Guardian' },
      ]},
      { runes: [
        { id: 8446, key: 'Demolish', icon: 'perk-images/Styles/Resolve/Demolish/Demolish.png', name: 'Demolish' },
        { id: 8463, key: 'FontOfLife', icon: 'perk-images/Styles/Resolve/FontOfLife/FontOfLife.png', name: 'Font of Life' },
        { id: 8401, key: 'ShieldBash', icon: 'perk-images/Styles/Resolve/MirrorShell/MirrorShell.png', name: 'Shield Bash' },
      ]},
      { runes: [
        { id: 8429, key: 'Conditioning', icon: 'perk-images/Styles/Resolve/Conditioning/Conditioning.png', name: 'Conditioning' },
        { id: 8444, key: 'SecondWind', icon: 'perk-images/Styles/Resolve/SecondWind/SecondWind.png', name: 'Second Wind' },
        { id: 8473, key: 'BonePlating', icon: 'perk-images/Styles/Resolve/BonePlating/BonePlating.png', name: 'Bone Plating' },
      ]},
      { runes: [
        { id: 8451, key: 'Overgrowth', icon: 'perk-images/Styles/Resolve/Overgrowth/Overgrowth.png', name: 'Overgrowth' },
        { id: 8453, key: 'Revitalize', icon: 'perk-images/Styles/Resolve/Revitalize/Revitalize.png', name: 'Revitalize' },
        { id: 8242, key: 'Unflinching', icon: 'perk-images/Styles/Sorcery/Unflinching/Unflinching.png', name: 'Unflinching' },
      ]},
    ],
  },
  {
    id: 8300, key: 'Inspiration', icon: 'perk-images/Styles/7203_Whimsy.png', name: 'Inspiration',
    slots: [
      { runes: [
        { id: 8351, key: 'GlacialAugment', icon: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png', name: 'Glacial Augment' },
        { id: 8360, key: 'UnsealedSpellbook', icon: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png', name: 'Unsealed Spellbook' },
        { id: 8369, key: 'FirstStrike', icon: 'perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png', name: 'First Strike' },
      ]},
      { runes: [
        { id: 8306, key: 'HextechFlashtraption', icon: 'perk-images/Styles/Inspiration/HextechFlashtraption/HextechFlashtraption.png', name: 'Hextech Flashtraption' },
        { id: 8304, key: 'MagicalFootwear', icon: 'perk-images/Styles/Inspiration/MagicalFootwear/MagicalFootwear.png', name: 'Magical Footwear' },
        { id: 8321, key: 'CashBack', icon: 'perk-images/Styles/Inspiration/CashBack/CashBack2.png', name: 'Cash Back' },
      ]},
      { runes: [
        { id: 8313, key: 'TripleTonic', icon: 'perk-images/Styles/Inspiration/PerfectTiming/AlchemistCabinet.png', name: 'Triple Tonic' },
        { id: 8352, key: 'TimeWarpTonic', icon: 'perk-images/Styles/Inspiration/TimeWarpTonic/TimeWarpTonic.png', name: 'Time Warp Tonic' },
        { id: 8345, key: 'BiscuitDelivery', icon: 'perk-images/Styles/Inspiration/BiscuitDelivery/BiscuitDelivery.png', name: 'Biscuit Delivery' },
      ]},
      { runes: [
        { id: 8347, key: 'CosmicInsight', icon: 'perk-images/Styles/Inspiration/CosmicInsight/CosmicInsight.png', name: 'Cosmic Insight' },
        { id: 8410, key: 'ApproachVelocity', icon: 'perk-images/Styles/Resolve/ApproachVelocity/ApproachVelocity.png', name: 'Approach Velocity' },
        { id: 8316, key: 'JackOfAllTrades', icon: 'perk-images/Styles/Inspiration/JackOfAllTrades/JackofAllTrades2.png', name: 'Jack Of All Trades' },
      ]},
    ],
  },
]

const PATH_COLORS: Record<string, string> = {
  Precision: '#c8aa6e',
  Domination: '#d44242',
  Sorcery: '#9faafc',
  Resolve: '#a8d26a',
  Inspiration: '#49aab9',
}

interface StatShard {
  id: string
  name: string
  value: string
}

const STAT_SHARDS: { label: string; options: StatShard[] }[] = [
  {
    label: 'Offense',
    options: [
      { id: 'adaptive', name: 'Adaptive Force', value: '+9 Adaptive' },
      { id: 'as', name: 'Attack Speed', value: '+10% AS' },
      { id: 'cdr', name: 'Ability Haste', value: '+8 AH' },
    ],
  },
  {
    label: 'Flex',
    options: [
      { id: 'flex-adaptive', name: 'Adaptive Force', value: '+9 Adaptive' },
      { id: 'flex-ms', name: 'Move Speed', value: '+2% MS' },
      { id: 'flex-hp', name: 'Health', value: '+65 HP' },
    ],
  },
  {
    label: 'Defense',
    options: [
      { id: 'def-hp', name: 'Health', value: '+65 HP' },
      { id: 'def-tenacity', name: 'Tenacity & Slow Resist', value: '+10% Ten' },
      { id: 'def-hpscale', name: 'Health Scaling', value: '+Scaling HP' },
    ],
  },
]

const SHARD_ICONS: Record<string, string> = {
  adaptive: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
  as: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',
  cdr: 'perk-images/StatMods/StatModsCDRScalingIcon.png',
  'flex-adaptive': 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
  'flex-ms': 'perk-images/StatMods/StatModsMovementSpeedIcon.png',
  'flex-hp': 'perk-images/StatMods/StatModsHealthScalingIcon.png',
  'def-hp': 'perk-images/StatMods/StatModsHealthScalingIcon.png',
  'def-tenacity': 'perk-images/StatMods/StatModsTenacityIcon.png',
  'def-hpscale': 'perk-images/StatMods/StatModsHealthScalingIcon.png',
}

function runeImg(icon: string) {
  return `${DDRAGON}/${icon}`
}

function RuneIcon({
  rune,
  selected,
  onClick,
  size = 48,
  isKeystone = false,
  dimmed = false,
}: {
  rune: Rune
  selected: boolean
  onClick: () => void
  size?: number
  isKeystone?: boolean
  dimmed?: boolean
}) {
  return (
    <button
      className={`rune-icon ${selected ? 'rune-selected' : ''} ${isKeystone ? 'rune-keystone' : ''} ${dimmed ? 'rune-dimmed' : ''}`}
      onClick={onClick}
      title={rune.name}
      style={{ width: size, height: size }}
    >
      <img src={runeImg(rune.icon)} alt={rune.name} width={size - 8} height={size - 8} />
      {selected && <span className="rune-glow" />}
      <span className="rune-tooltip">{rune.name}</span>
    </button>
  )
}

function PathSelector({
  paths,
  selectedId,
  disabledId,
  onSelect,
  label,
}: {
  paths: RunePath[]
  selectedId: number | null
  disabledId: number | null
  onSelect: (id: number) => void
  label: string
}) {
  return (
    <div className="path-selector">
      <span className="path-selector-label">{label}</span>
      <div className="path-icons">
        {paths.map((p) => {
          const isSelected = p.id === selectedId
          const isDisabled = p.id === disabledId
          return (
            <button
              key={p.id}
              className={`path-icon ${isSelected ? 'path-selected' : ''} ${isDisabled ? 'path-disabled' : ''}`}
              onClick={() => !isDisabled && onSelect(p.id)}
              title={p.name}
              disabled={isDisabled}
              style={isSelected ? { '--path-color': PATH_COLORS[p.key] } as React.CSSProperties : undefined}
            >
              <img src={runeImg(p.icon)} alt={p.name} width={38} height={38} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RunePage() {
  const [primaryPathId, setPrimaryPathId] = useState<number | null>(null)
  const [secondaryPathId, setSecondaryPathId] = useState<number | null>(null)
  const [primarySelections, setPrimarySelections] = useState<Record<number, number>>({})
  const [secondarySelections, setSecondarySelections] = useState<Record<number, number>>({})
  const [statSelections, setStatSelections] = useState<Record<number, string>>({})
  const [pageName, setPageName] = useState('New Rune Page')
  const [isEditingName, setIsEditingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const primaryPath = RUNE_PATHS.find((p) => p.id === primaryPathId) ?? null
  const secondaryPath = RUNE_PATHS.find((p) => p.id === secondaryPathId) ?? null

  const primaryColor = primaryPath ? PATH_COLORS[primaryPath.key] : '#c8aa6e'
  const secondaryColor = secondaryPath ? PATH_COLORS[secondaryPath.key] : '#785a28'

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  const handlePrimaryPathSelect = useCallback((id: number) => {
    setPrimaryPathId(id)
    setPrimarySelections({})
    if (id === secondaryPathId) {
      setSecondaryPathId(null)
      setSecondarySelections({})
    }
  }, [secondaryPathId])

  const handleSecondaryPathSelect = useCallback((id: number) => {
    setSecondaryPathId(id)
    setSecondarySelections({})
  }, [])

  const handlePrimaryRuneSelect = useCallback((slotIndex: number, runeId: number) => {
    setPrimarySelections((prev) => ({ ...prev, [slotIndex]: runeId }))
  }, [])

  const handleSecondaryRuneSelect = useCallback((slotIndex: number, runeId: number) => {
    setSecondarySelections((prev) => {
      const next = { ...prev }
      if (next[slotIndex] === runeId) {
        delete next[slotIndex]
        return next
      }
      next[slotIndex] = runeId
      const selectedSlots = Object.keys(next).map(Number)
      if (selectedSlots.length > 2) {
        const oldest = selectedSlots[0]
        delete next[oldest]
      }
      return next
    })
  }, [])

  const handleStatSelect = useCallback((rowIndex: number, shardId: string) => {
    setStatSelections((prev) => ({ ...prev, [rowIndex]: shardId }))
  }, [])

  const secondarySelectedSlots = Object.keys(secondarySelections).map(Number)

  return (
    <div className="runes-page" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}>
      <div className="runes-bg-pattern" />

      <header className="runes-header">
        <div className="runes-title-row">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              className="runes-name-input"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              maxLength={32}
            />
          ) : (
            <h1 className="runes-name" onClick={() => setIsEditingName(true)}>
              {pageName}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            </h1>
          )}
        </div>
      </header>

      <div className="runes-body">
        {/* Primary Tree */}
        <section className="runes-tree runes-primary">
          <PathSelector
            paths={RUNE_PATHS}
            selectedId={primaryPathId}
            disabledId={secondaryPathId}
            onSelect={handlePrimaryPathSelect}
            label="Primary"
          />

          {primaryPath && (
            <div className="runes-slots" style={{ '--tree-color': primaryColor } as React.CSSProperties}>
              <div className="runes-path-name">{primaryPath.name}</div>
              <div className="runes-path-line" />

              {primaryPath.slots.map((slot, slotIdx) => (
                <div key={slotIdx} className={`rune-row ${slotIdx === 0 ? 'rune-row-keystone' : ''}`}>
                  {slot.runes.map((rune) => (
                    <RuneIcon
                      key={rune.id}
                      rune={rune}
                      selected={primarySelections[slotIdx] === rune.id}
                      onClick={() => handlePrimaryRuneSelect(slotIdx, rune.id)}
                      size={slotIdx === 0 ? 64 : 44}
                      isKeystone={slotIdx === 0}
                      dimmed={primarySelections[slotIdx] !== undefined && primarySelections[slotIdx] !== rune.id}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!primaryPath && (
            <div className="runes-empty">
              <p>Choose a primary path</p>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="runes-divider">
          <div className="runes-divider-line" />
          <div className="runes-divider-diamond" />
          <div className="runes-divider-line" />
        </div>

        {/* Secondary Tree + Stat Shards */}
        <section className="runes-tree runes-secondary">
          <PathSelector
            paths={RUNE_PATHS}
            selectedId={secondaryPathId}
            disabledId={primaryPathId}
            onSelect={handleSecondaryPathSelect}
            label="Secondary"
          />

          {secondaryPath && (
            <div className="runes-slots" style={{ '--tree-color': secondaryColor } as React.CSSProperties}>
              <div className="runes-path-name">{secondaryPath.name}</div>
              <div className="runes-path-line" />

              {secondaryPath.slots.slice(1).map((slot, slotIdx) => {
                const actualIdx = slotIdx + 1
                const isLocked = secondarySelectedSlots.length >= 2 && !secondarySelectedSlots.includes(actualIdx)
                return (
                  <div key={actualIdx} className={`rune-row ${isLocked ? 'rune-row-locked' : ''}`}>
                    {slot.runes.map((rune) => (
                      <RuneIcon
                        key={rune.id}
                        rune={rune}
                        selected={secondarySelections[actualIdx] === rune.id}
                        onClick={() => !isLocked && handleSecondaryRuneSelect(actualIdx, rune.id)}
                        size={40}
                        dimmed={
                          isLocked ||
                          (secondarySelections[actualIdx] !== undefined && secondarySelections[actualIdx] !== rune.id)
                        }
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {!secondaryPath && (
            <div className="runes-empty">
              <p>Choose a secondary path</p>
            </div>
          )}

          {/* Stat Shards */}
          <div className="stat-shards">
            <div className="stat-shards-label">Stat Shards</div>
            <div className="stat-shards-divider" />
            {STAT_SHARDS.map((row, rowIdx) => (
              <div key={row.label} className="shard-row">
                {row.options.map((shard) => {
                  const isSelected = statSelections[rowIdx] === shard.id
                  return (
                    <button
                      key={shard.id}
                      className={`shard-icon ${isSelected ? 'shard-selected' : ''}`}
                      onClick={() => handleStatSelect(rowIdx, shard.id)}
                      title={`${shard.name}: ${shard.value}`}
                    >
                      <img src={runeImg(SHARD_ICONS[shard.id])} alt={shard.name} width={22} height={22} />
                      <span className="rune-tooltip">{shard.name}<br />{shard.value}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: RunePage,
})
