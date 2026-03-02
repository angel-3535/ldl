import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getBuildById, updateBuildById, deleteBuild } from '../../db'
import type { DummyItem } from '../../db'
import ItemDrawer from '../../components/ItemDrawer'
import ChampionDrawer, { championSquareIcon } from '../../components/ChampionDrawer'
import './index.css'

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/img'
const DDRAGON_VERSION = '15.4.1'

function itemIcon(icon: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/item/${icon}`
}

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

function useBuild(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['build', id],
    queryFn: () => getBuildById(id),
  })

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateBuildById>[1]) =>
      updateBuildById(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build', id] })
    },
  })

  return { build: query.data, isLoading: query.isLoading, update: mutation.mutate }
}

function BuildEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { build, isLoading, update } = useBuild(id)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [champDrawerOpen, setChampDrawerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Local rune state synced from DB
  const [primaryPathId, setPrimaryPathId] = useState<number | null>(null)
  const [secondaryPathId, setSecondaryPathId] = useState<number | null>(null)
  const [primarySelections, setPrimarySelections] = useState<Record<number, number>>({})
  const [secondarySelections, setSecondarySelections] = useState<Record<number, number>>({})
  const [statSelections, setStatSelections] = useState<Record<number, string>>({})

  useEffect(() => {
    if (build) {
      setNameValue(build.name)
      setPrimaryPathId(build.primaryPathId)
      setSecondaryPathId(build.secondaryPathId)
      setPrimarySelections(build.primarySelections)
      setSecondarySelections(build.secondarySelections)
      setStatSelections(build.statSelections)
    }
  }, [build])

  const flashSaved = useCallback(() => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }, [])

  const primaryPath = RUNE_PATHS.find((p) => p.id === primaryPathId) ?? null
  const secondaryPath = RUNE_PATHS.find((p) => p.id === secondaryPathId) ?? null
  const primaryColor = primaryPath ? PATH_COLORS[primaryPath.key] : '#c8aa6e'
  const secondaryColor = secondaryPath ? PATH_COLORS[secondaryPath.key] : '#785a28'

  const handlePrimaryPathSelect = useCallback((pathId: number) => {
    setPrimaryPathId(pathId)
    setPrimarySelections({})
    let newSecondary = secondaryPathId
    let newSecondarySelections = secondarySelections
    if (pathId === secondaryPathId) {
      newSecondary = null
      newSecondarySelections = {}
      setSecondaryPathId(null)
      setSecondarySelections({})
    }
    update({
      primaryPathId: pathId,
      primarySelections: {},
      secondaryPathId: newSecondary,
      secondarySelections: newSecondarySelections,
    })
    flashSaved()
  }, [secondaryPathId, secondarySelections, update, flashSaved])

  const handleSecondaryPathSelect = useCallback((pathId: number) => {
    setSecondaryPathId(pathId)
    setSecondarySelections({})
    update({ secondaryPathId: pathId, secondarySelections: {} })
    flashSaved()
  }, [update, flashSaved])

  const handlePrimaryRuneSelect = useCallback((slotIndex: number, runeId: number) => {
    setPrimarySelections((prev) => {
      const next = { ...prev, [slotIndex]: runeId }
      update({ primarySelections: next })
      flashSaved()
      return next
    })
  }, [update, flashSaved])

  const handleSecondaryRuneSelect = useCallback((slotIndex: number, runeId: number) => {
    setSecondarySelections((prev) => {
      const next = { ...prev }
      if (next[slotIndex] === runeId) {
        delete next[slotIndex]
      } else {
        next[slotIndex] = runeId
        const selectedSlots = Object.keys(next).map(Number)
        if (selectedSlots.length > 2) {
          const oldest = selectedSlots[0]
          delete next[oldest]
        }
      }
      update({ secondarySelections: next })
      flashSaved()
      return next
    })
  }, [update, flashSaved])

  const handleStatSelect = useCallback((rowIndex: number, shardId: string) => {
    setStatSelections((prev) => {
      const next = { ...prev, [rowIndex]: shardId }
      update({ statSelections: next })
      flashSaved()
      return next
    })
  }, [update, flashSaved])

  const handleChampionSelect = useCallback(
    (champion: { key: string; name: string }) => {
      update({ championKey: champion.key, championName: champion.name })
      flashSaved()
    },
    [update, flashSaved],
  )

  const handleChampionRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      update({ championKey: null, championName: null })
      flashSaved()
    },
    [update, flashSaved],
  )

  const handleSlotClick = useCallback((index: number) => {
    setActiveSlot(index)
    setDrawerOpen(true)
  }, [])

  const handleItemSelect = useCallback(
    (item: { id: number; name: string; icon: string }) => {
      if (activeSlot === null || !build) return
      const items = [...(build.items || [])]
      const filtered = items.filter((i) => i.slot !== activeSlot)
      filtered.push({ slot: activeSlot, itemId: item.id, name: item.name, icon: item.icon })
      update({ items: filtered })
      flashSaved()
    },
    [activeSlot, build, update, flashSaved],
  )

  const handleItemRemove = useCallback(
    (slot: number, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!build) return
      const items = (build.items || []).filter((i) => i.slot !== slot)
      update({ items })
      flashSaved()
    },
    [build, update, flashSaved],
  )

  const handleNameSave = useCallback(() => {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== build?.name) {
      update({ name: trimmed })
      flashSaved()
    }
    setEditingName(false)
  }, [nameValue, build, update, flashSaved])

  const handleDelete = useCallback(async () => {
    await deleteBuild(id)
    queryClient.invalidateQueries({ queryKey: ['builds'] })
    navigate({ to: '/build' })
  }, [id, queryClient, navigate])

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  const secondarySelectedSlots = Object.keys(secondarySelections).map(Number)

  if (isLoading) {
    return (
      <div className="build-page">
        <div className="build-bg-pattern" />
        <div className="build-loading" style={{ padding: '4rem', color: '#5b5a56' }}>Loading...</div>
      </div>
    )
  }

  if (!build) {
    return (
      <div className="build-page">
        <div className="build-bg-pattern" />
        <div className="build-not-found">
          <p>Build not found</p>
          <Link to="/build" className="build-back-link">Back to builds</Link>
        </div>
      </div>
    )
  }

  const itemsBySlot: Record<number, DummyItem> = {}
  for (const item of build.items) {
    itemsBySlot[item.slot] = item
  }

  return (
    <div className="build-page" style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as React.CSSProperties}>
      <div className="build-bg-pattern" />

      <header className="build-header">
        <div className="build-header-row">
          <Link to="/build" className="build-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Builds
          </Link>
          <button className="build-delete-btn" onClick={handleDelete}>
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
            className="build-title-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') {
                setNameValue(build.name)
                setEditingName(false)
              }
            }}
          />
        ) : (
          <h1 className="build-title" onClick={() => setEditingName(true)} style={{ cursor: 'pointer' }}>
            {build.name}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="build-edit-icon">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </h1>
        )}
        <p className="build-subtitle">Configure runes & items</p>
      </header>

      <div className="build-content">
        {/* ── Champion + Items Row ── */}
        <div className="build-top-row">
          <div className="build-champion-section">
            <div className="build-section-label">Champion</div>
            <div
              className={`build-champion-portrait ${build.championKey ? 'has-champion' : ''}`}
              onClick={() => setChampDrawerOpen(true)}
            >
              {build.championKey ? (
                <>
                  <img src={championSquareIcon(build.championKey)} alt={build.championName || ''} />
                  <span className="build-champion-name">{build.championName}</span>
                  <button className="build-champion-remove" onClick={handleChampionRemove}>
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#785a28" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                  <span className="build-champion-placeholder">Select Champion</span>
                </>
              )}
            </div>
          </div>

          <div className="build-items-panel">
            <div className="build-section-label">Items</div>
            <div className="build-items-grid">
              {Array.from({ length: 6 }, (_, i) => {
                const item = itemsBySlot[i]
                return (
                  <div
                    key={i}
                    className={`build-item-slot ${item ? 'has-item' : ''}`}
                    onClick={() => handleSlotClick(i)}
                  >
                    <span className="build-item-slot-number">{i + 1}</span>
                    {item ? (
                      <>
                        <img src={itemIcon(item.icon)} alt={item.name} />
                        <span className="build-item-tooltip">{item.name}</span>
                        <button
                          className="build-item-remove"
                          onClick={(e) => handleItemRemove(i, e)}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <span className="build-item-slot-empty">+</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Runes Section ── */}
        <div className="build-runes">
          <div className="build-runes-columns">
            {/* Primary */}
            <div className="build-rune-tree build-rune-primary">
              <div className="build-path-selector">
                <span className="build-path-label">Primary</span>
                <div className="build-path-icons">
                  {RUNE_PATHS.map((p) => {
                    const isSelected = p.id === primaryPathId
                    const isDisabled = p.id === secondaryPathId
                    return (
                      <button
                        key={p.id}
                        className={`build-path-icon ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && handlePrimaryPathSelect(p.id)}
                        title={p.name}
                        disabled={isDisabled}
                        style={isSelected ? { '--path-color': PATH_COLORS[p.key] } as React.CSSProperties : undefined}
                      >
                        <img src={runeImg(p.icon)} alt={p.name} width={32} height={32} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {primaryPath && (
                <div className="build-rune-slots" style={{ '--tree-color': primaryColor } as React.CSSProperties}>
                  <div className="build-rune-path-name">{primaryPath.name}</div>
                  <div className="build-rune-path-line" />
                  {primaryPath.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className={`build-rune-row ${slotIdx === 0 ? 'keystone' : ''}`}>
                      {slot.runes.map((rune) => {
                        const isSelected = primarySelections[slotIdx] === rune.id
                        const isDimmed = primarySelections[slotIdx] !== undefined && !isSelected
                        return (
                          <button
                            key={rune.id}
                            className={`build-rune-icon ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''} ${slotIdx === 0 ? 'keystone' : ''}`}
                            onClick={() => handlePrimaryRuneSelect(slotIdx, rune.id)}
                            title={rune.name}
                            style={{ width: slotIdx === 0 ? 56 : 40, height: slotIdx === 0 ? 56 : 40 }}
                          >
                            <img src={runeImg(rune.icon)} alt={rune.name} width={slotIdx === 0 ? 48 : 32} height={slotIdx === 0 ? 48 : 32} />
                            {isSelected && <span className="build-rune-glow" />}
                            <span className="build-rune-tooltip">{rune.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {!primaryPath && (
                <div className="build-rune-empty">Choose a primary path</div>
              )}
            </div>

            {/* Divider */}
            <div className="build-rune-divider">
              <div className="build-rune-divider-line" />
              <div className="build-rune-divider-diamond" />
              <div className="build-rune-divider-line" />
            </div>

            {/* Secondary */}
            <div className="build-rune-tree build-rune-secondary">
              <div className="build-path-selector">
                <span className="build-path-label">Secondary</span>
                <div className="build-path-icons">
                  {RUNE_PATHS.map((p) => {
                    const isSelected = p.id === secondaryPathId
                    const isDisabled = p.id === primaryPathId
                    return (
                      <button
                        key={p.id}
                        className={`build-path-icon ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => !isDisabled && handleSecondaryPathSelect(p.id)}
                        title={p.name}
                        disabled={isDisabled}
                        style={isSelected ? { '--path-color': PATH_COLORS[p.key] } as React.CSSProperties : undefined}
                      >
                        <img src={runeImg(p.icon)} alt={p.name} width={32} height={32} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {secondaryPath && (
                <div className="build-rune-slots" style={{ '--tree-color': secondaryColor } as React.CSSProperties}>
                  <div className="build-rune-path-name">{secondaryPath.name}</div>
                  <div className="build-rune-path-line" />
                  {secondaryPath.slots.slice(1).map((slot, slotIdx) => {
                    const actualIdx = slotIdx + 1
                    const isLocked = secondarySelectedSlots.length >= 2 && !secondarySelectedSlots.includes(actualIdx)
                    return (
                      <div key={actualIdx} className={`build-rune-row ${isLocked ? 'locked' : ''}`}>
                        {slot.runes.map((rune) => {
                          const isSelected = secondarySelections[actualIdx] === rune.id
                          const isDimmed = isLocked || (secondarySelections[actualIdx] !== undefined && !isSelected)
                          return (
                            <button
                              key={rune.id}
                              className={`build-rune-icon ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`}
                              onClick={() => !isLocked && handleSecondaryRuneSelect(actualIdx, rune.id)}
                              title={rune.name}
                              style={{ width: 36, height: 36 }}
                            >
                              <img src={runeImg(rune.icon)} alt={rune.name} width={28} height={28} />
                              {isSelected && <span className="build-rune-glow" />}
                              <span className="build-rune-tooltip">{rune.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}

              {!secondaryPath && (
                <div className="build-rune-empty">Choose a secondary path</div>
              )}

              {/* Stat Shards */}
              <div className="build-stat-shards">
                <div className="build-stat-shards-label">Stat Shards</div>
                <div className="build-stat-shards-divider" />
                {STAT_SHARDS.map((row, rowIdx) => (
                  <div key={row.label} className="build-shard-row">
                    {row.options.map((shard) => {
                      const isSelected = statSelections[rowIdx] === shard.id
                      return (
                        <button
                          key={shard.id}
                          className={`build-shard-icon ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleStatSelect(rowIdx, shard.id)}
                          title={`${shard.name}: ${shard.value}`}
                        >
                          <img src={runeImg(SHARD_ICONS[shard.id])} alt={shard.name} width={20} height={20} />
                          <span className="build-rune-tooltip">{shard.name}<br />{shard.value}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className={`build-saved ${savedFlash ? 'just-saved' : ''}`}>
        {savedFlash ? 'Saved' : 'Auto-saves to IndexedDB'}
      </div>

      <ItemDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={handleItemSelect}
        slotIndex={activeSlot}
      />

      <ChampionDrawer
        open={champDrawerOpen}
        onClose={() => setChampDrawerOpen(false)}
        onSelect={handleChampionSelect}
      />
    </div>
  )
}

export const Route = createFileRoute('/build/$id')({
  component: BuildEditPage,
})
