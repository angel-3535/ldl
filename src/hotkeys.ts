import { useEffect, useEffectEvent, useSyncExternalStore } from 'react'

export type HotkeyActionId =
  | 'openSettings'
  | 'goToCanvas'
  | 'goToBuilds'
  | 'goToDummies'
  | 'addBuildToCanvas'
  | 'addTestToCanvas'
  | 'createBuild'
  | 'createDummy'
  | 'closeOverlay'

export type HotkeyBindings = Record<HotkeyActionId, string | null>

export interface HotkeyDefinition {
  id: HotkeyActionId
  label: string
  description: string
  scope: string
  defaultBinding: string | null
}

const STORAGE_KEY = 'ldl.hotkeys.v1'

export const HOTKEY_DEFINITIONS: HotkeyDefinition[] = [
  {
    id: 'openSettings',
    label: 'Open settings',
    description: 'Jump straight to the hotkey settings page from anywhere in the app.',
    scope: 'Global',
    defaultBinding: 'Shift+S',
  },
  {
    id: 'goToCanvas',
    label: 'Go to canvas',
    description: 'Navigate back to the main damage canvas from anywhere in the app.',
    scope: 'Global',
    defaultBinding: 'Shift+C',
  },
  {
    id: 'goToBuilds',
    label: 'Go to builds',
    description: 'Jump to the builds list from any page.',
    scope: 'Global',
    defaultBinding: 'Shift+B',
  },
  {
    id: 'goToDummies',
    label: 'Go to dummies',
    description: 'Jump to the target dummies list from any page.',
    scope: 'Global',
    defaultBinding: 'Shift+D',
  },
  {
    id: 'addBuildToCanvas',
    label: 'Add build to canvas',
    description: 'Open or close the build picker on the damage canvas.',
    scope: 'Canvas',
    defaultBinding: 'B',
  },
  {
    id: 'addTestToCanvas',
    label: 'Add test to canvas',
    description: 'Open the create-test form on the damage canvas.',
    scope: 'Canvas',
    defaultBinding: 'T',
  },
  {
    id: 'createBuild',
    label: 'Create build',
    description: 'Start the new-build flow on the builds page.',
    scope: 'Builds',
    defaultBinding: null,
  },
  {
    id: 'createDummy',
    label: 'Create dummy',
    description: 'Start the new-dummy flow on the target dummies page.',
    scope: 'Dummies',
    defaultBinding: null,
  },
  {
    id: 'closeOverlay',
    label: 'Close overlay',
    description: 'Dismiss open drawers, pickers, and quick-create overlays.',
    scope: 'Overlay',
    defaultBinding: 'Escape',
  },
]

const DEFAULT_BINDINGS = HOTKEY_DEFINITIONS.reduce((bindings, definition) => {
  bindings[definition.id] = definition.defaultBinding
  return bindings
}, {} as HotkeyBindings)

let cachedBindings: HotkeyBindings = DEFAULT_BINDINGS
let cachedStorageValue: string | null | undefined

const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): HotkeyBindings {
  if (typeof window === 'undefined') {
    return DEFAULT_BINDINGS
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  return readHotkeyBindings(raw)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      emitChange()
    }
  })
}

export function loadHotkeyBindings(): HotkeyBindings {
  if (typeof window === 'undefined') {
    return DEFAULT_BINDINGS
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  return readHotkeyBindings(raw)
}

function readHotkeyBindings(raw: string | null): HotkeyBindings {
  if (cachedStorageValue === raw) {
    return cachedBindings
  }

  if (!raw) {
    cachedStorageValue = raw
    cachedBindings = DEFAULT_BINDINGS
    return cachedBindings
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Record<HotkeyActionId, unknown>>
    const nextBindings = { ...DEFAULT_BINDINGS }

    for (const definition of HOTKEY_DEFINITIONS) {
      const value = parsed[definition.id]
      nextBindings[definition.id] =
        typeof value === 'string' ? normalizeHotkey(value) : value === null ? null : definition.defaultBinding
    }

    cachedStorageValue = raw
    cachedBindings = nextBindings
    return cachedBindings
  } catch {
    cachedStorageValue = raw
    cachedBindings = DEFAULT_BINDINGS
    return cachedBindings
  }
}

export function saveHotkeyBindings(bindings: HotkeyBindings) {
  if (typeof window === 'undefined') {
    return
  }

  const serialized = JSON.stringify(bindings)
  cachedStorageValue = serialized
  cachedBindings = bindings
  window.localStorage.setItem(STORAGE_KEY, serialized)
  emitChange()
}

export function updateHotkeyBinding(actionId: HotkeyActionId, binding: string | null) {
  const nextBindings = {
    ...loadHotkeyBindings(),
    [actionId]: binding ? normalizeHotkey(binding) : null,
  }

  saveHotkeyBindings(nextBindings)
}

export function resetHotkeyBinding(actionId: HotkeyActionId) {
  updateHotkeyBinding(actionId, DEFAULT_BINDINGS[actionId])
}

export function resetAllHotkeys() {
  saveHotkeyBindings(DEFAULT_BINDINGS)
}

export function useHotkeyBindings() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_BINDINGS)
}

export function getBindingLabel(binding: string | null) {
  if (!binding) {
    return 'Unbound'
  }

  return binding
    .split('+')
    .map((part) => DISPLAY_KEY_MAP[part] ?? part)
    .join(' + ')
}

export function normalizeHotkey(binding: string) {
  const parts = binding
    .split('+')
    .map((part) => normalizeKey(part))
    .filter((part): part is string => Boolean(part))

  const modifierSet = new Set(parts.filter(isModifierKey))
  const key = parts.find((part) => !isModifierKey(part))

  return [...MODIFIER_ORDER.filter((part) => modifierSet.has(part)), key].filter(Boolean).join('+')
}

export function getHotkeyConflict(
  actionId: HotkeyActionId,
  binding: string | null,
  bindings: HotkeyBindings,
) {
  if (!binding) {
    return null
  }

  return HOTKEY_DEFINITIONS.find((definition) => {
    if (definition.id === actionId) {
      return false
    }

    return bindings[definition.id] === binding
  }) ?? null
}

export function eventToHotkeyString(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>) {
  const key = normalizeKey(event.key)
  if (!key || isModifierKey(key)) {
    return null
  }

  const modifiers = [
    event.ctrlKey ? 'Ctrl' : null,
    event.altKey ? 'Alt' : null,
    event.shiftKey ? 'Shift' : null,
    event.metaKey ? 'Meta' : null,
  ].filter((modifier): modifier is string => Boolean(modifier))

  return [...modifiers, key].join('+')
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'),
  )
}

export function useConfiguredHotkey(
  actionId: HotkeyActionId,
  handler: () => void,
  options?: {
    enabled?: boolean
    allowInInput?: boolean
    preventDefault?: boolean
  },
) {
  const bindings = useHotkeyBindings()
  const onTrigger = useEffectEvent(handler)
  const enabled = options?.enabled ?? true
  const allowInInput = options?.allowInInput ?? false
  const preventDefault = options?.preventDefault ?? true
  const binding = bindings[actionId]

  useEffect(() => {
    if (!enabled || !binding) {
      return
    }

    const listener = (event: KeyboardEvent) => {
      if (!allowInInput && isEditableTarget(event.target)) {
        return
      }

      const eventBinding = eventToHotkeyString(event)
      if (!eventBinding || eventBinding !== binding) {
        return
      }

      if (preventDefault) {
        event.preventDefault()
      }

      onTrigger()
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [allowInInput, binding, enabled, preventDefault])
}

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const

const KEY_ALIASES: Record<string, string> = {
  Control: 'Ctrl',
  Ctrl: 'Ctrl',
  AltGraph: 'Alt',
  Option: 'Alt',
  Meta: 'Meta',
  OS: 'Meta',
  Command: 'Meta',
  Cmd: 'Meta',
  Esc: 'Escape',
  Return: 'Enter',
  ' ': 'Space',
  Spacebar: 'Space',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
}

const DISPLAY_KEY_MAP: Record<string, string> = {
  Ctrl: 'Ctrl',
  Alt: 'Alt',
  Shift: 'Shift',
  Meta: 'Cmd',
  Escape: 'Esc',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Space: 'Space',
}

function normalizeKey(rawKey: string) {
  const trimmed = rawKey.trim()
  if (!trimmed) {
    return null
  }

  const alias = KEY_ALIASES[trimmed]
  if (alias) {
    return alias
  }

  if (trimmed.length === 1) {
    return trimmed.toUpperCase()
  }

  return trimmed
}

function isModifierKey(key: string): key is (typeof MODIFIER_ORDER)[number] {
  return MODIFIER_ORDER.includes(key as (typeof MODIFIER_ORDER)[number])
}
