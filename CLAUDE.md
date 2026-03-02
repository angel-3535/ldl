# LDL — Design Philosophy

## Visual Identity

This project uses a **League of Legends client** aesthetic. All UI should feel like it belongs inside the LoL game client.

### Core Principles

- **Dark foundation**: Deep navy/black backgrounds (`#010a13`, `#0a1628`). Never use light themes or white backgrounds.
- **Gold accents**: All interactive borders, dividers, and highlights use the gold palette (`#c8aa6e` primary, `#785a28` dark, `#f0e6d2` light text). Gold is the signature color — use it intentionally, not everywhere.
- **Ornate details**: Diamond dividers, filigree-style separators, pulsing glow rings on selections. The UI should feel crafted, not generic.
- **Atmospheric depth**: Subtle radial gradients, background patterns, and layered transparencies create a sense of depth. Avoid flat solid-color surfaces.

### Typography

- **Display/headings**: `Cinzel` serif — ornate, medieval, matches the LoL fantasy tone.
- **Body/UI**: `Fira Sans` — clean and legible at small sizes.
- **Sizing**: Use restraint. Labels are small with generous letter-spacing and uppercase transforms. Let the icons and layout do the talking.

### Interaction Patterns

- **Glow on selection**: Selected elements get a colored box-shadow glow matching their category color, plus a pulsing outer ring animation.
- **Dimming**: Unselected siblings dim to ~35% opacity to draw focus to the active choice.
- **Hover reveals**: Tooltips, brightness changes, and subtle scale transforms on hover. No jarring transitions.
- **Grayscale-to-color**: Inactive icons are desaturated and dimmed; selection restores full color and brightness.

### Color by Context

Each rune path has a signature color used for glows, borders, and text when that path is active:

- Precision: `#c8aa6e` (gold)
- Domination: `#d44242` (red)
- Sorcery: `#9faafc` (blue)
- Resolve: `#a8d26a` (green)
- Inspiration: `#49aab9` (cyan)

### Assets

- Rune images come from Riot's Data Dragon CDN: `https://ddragon.leagueoflegends.com/cdn/img/`
- No local image downloads needed — reference the CDN directly.

## Tech Stack

- React 19 + TypeScript
- TanStack Router (file-based routes in `src/routes/`)
- TanStack Query + Dexie (IndexedDB) for local-first persistence
- Vite dev server
- pnpm package manager
