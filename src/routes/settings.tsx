import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  HOTKEY_DEFINITIONS,
  eventToHotkeyString,
  getBindingLabel,
  getHotkeyConflict,
  resetAllHotkeys,
  resetHotkeyBinding,
  updateHotkeyBinding,
  useHotkeyBindings,
  type HotkeyActionId,
} from '../hotkeys'
import './settings.css'

function SettingsPage() {
  const bindings = useHotkeyBindings()
  const [recordingAction, setRecordingAction] = useState<HotkeyActionId | null>(null)

  return (
    <div className="settings-page">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/" className="settings-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to canvas
        </Link>
      </div>

      <header className="settings-header">
        <p className="settings-kicker">Preferences</p>
        <h1>Keyboard Shortcuts</h1>
        <p className="settings-subtitle">
          Click a binding to rebind it. Press any key combination to set, <kbd style={{
            display: 'inline-block', padding: '0.05rem 0.35rem', borderRadius: 2,
            border: '1px solid rgba(200,170,110,0.15)', background: 'rgba(20,30,45,0.8)',
            fontFamily: '"Fira Sans", sans-serif', fontSize: '0.72rem', color: 'rgba(240,230,210,0.6)',
          }}>Esc</kbd> to cancel, or <kbd style={{
            display: 'inline-block', padding: '0.05rem 0.35rem', borderRadius: 2,
            border: '1px solid rgba(200,170,110,0.15)', background: 'rgba(20,30,45,0.8)',
            fontFamily: '"Fira Sans", sans-serif', fontSize: '0.72rem', color: 'rgba(240,230,210,0.6)',
          }}>Backspace</kbd> to clear.
        </p>
      </header>

      <div className="settings-divider">
        <span className="settings-divider-diamond" />
      </div>

      <section className="settings-panel">
        <div className="settings-panel-top">
          <span className="settings-section-label">All shortcuts</span>
          <button className="settings-reset-all" onClick={() => resetAllHotkeys()}>
            Reset all
          </button>
        </div>

        <div className="settings-hotkey-list">
          {HOTKEY_DEFINITIONS.map((def) => {
            const binding = bindings[def.id]
            const conflict = getHotkeyConflict(def.id, binding, bindings)
            const isRecording = recordingAction === def.id

            return (
              <div
                key={def.id}
                className={`settings-hotkey-row${conflict ? ' has-conflict' : ''}`}
              >
                <div className="settings-hotkey-info">
                  <div className="settings-hotkey-label">
                    <h3>{def.label}</h3>
                    <span className="settings-scope-tag">{def.scope}</span>
                  </div>
                  <p className="settings-hotkey-desc">{def.description}</p>
                  {conflict && (
                    <p className="settings-conflict-text">
                      Conflicts with "{conflict.label}"
                    </p>
                  )}
                </div>

                <button
                  className={`settings-keycap-btn${isRecording ? ' recording' : ''}${!binding && !isRecording ? ' unbound' : ''}`}
                  onClick={() => setRecordingAction((cur) => (cur === def.id ? null : def.id))}
                  onKeyDown={(e) => {
                    if (recordingAction !== def.id) return

                    if (e.key === 'Backspace' || e.key === 'Delete') {
                      e.preventDefault()
                      updateHotkeyBinding(def.id, null)
                      setRecordingAction(null)
                      return
                    }

                    if (e.key === 'Escape') {
                      e.preventDefault()
                      setRecordingAction(null)
                      return
                    }

                    const next = eventToHotkeyString(e)
                    if (!next) return

                    e.preventDefault()
                    updateHotkeyBinding(def.id, next)
                    setRecordingAction(null)
                  }}
                >
                  {isRecording ? '…' : getBindingLabel(binding)}
                </button>

                <div className="settings-hotkey-actions">
                  <button
                    className="settings-icon-btn"
                    title="Reset to default"
                    onClick={() => resetHotkeyBinding(def.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                  <button
                    className="settings-icon-btn danger"
                    title="Clear binding"
                    onClick={() => updateHotkeyBinding(def.id, null)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="settings-hint">
        <span className="settings-hint-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
        </span>
        <p>
          Bindings are saved to this browser's local storage. They won't sync across devices.
        </p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})
