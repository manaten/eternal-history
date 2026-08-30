# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start development build with watch mode
- `npm run storybook` - Start Storybook for component development on port 6006
- `npm run preview` - Preview production build

### Building

- `npm run build` - Production build (runs TypeScript compilation + Vite build)
- `npm run typecheck` - Run TypeScript type checking without emitting files

### Testing

- `npm test` - Run test suite with Vitest
- `npm run test -- --watch` - Run tests in watch mode
- `npm run test -- src/common/history/store/index.spec.ts` - Run specific test file

### Code Quality

- `npm run lint` - Run all linters (ESLint on JS/TS files)
- `npm run lint:js` - Run ESLint specifically
- `npm run fix` - Auto-fix linting and formatting issues
- `npm run fix:js` - Auto-fix ESLint issues only
- `npm run fix:prettier` - Auto-format with Prettier

## Architecture

### Core Concept

Eternal History is a Chrome extension that provides unlimited browser history storage by serializing history data into Chrome bookmarks with hierarchical folder organization. The extension replaces the New Tab page with a searchable history interface.

### Directory Layout: Execution Context First

`src/` is split by **execution context** — the path tells you where code runs.
Import direction is enforced by ESLint (`no-restricted-imports`):
`worker → common` and `client → common` only. `client ⇄ worker` never import
each other; runtime interaction goes through the RPC contract in
`common/messages.ts`. Promote code to `common/` only when a second context
actually starts importing it.

**`worker/`** — background service worker

- `index.ts` - Single entry point / composition root: registers listeners,
  wires dependencies (cross-domain edges live ONLY here)
- `word-index/{service,cache,handler}.ts` - WordIndex lifecycle
  (stale-while-revalidate on `builtAt`), chrome.storage persistence,
  onMessage handler

**`client/`** — New Tab & Options UI. Domain-colocated: each domain dir
owns its logic AND its components.

- `index.html` / `options.html` / `index.css` - page shells (vite root is
  `src/client`)
- `main.tsx` / `options-main.tsx` / `App.tsx` / `OptionsApp.tsx` -
  entry points = composition roots (side effects injected into components
  from here; see pure-components skill)
- `history/` - history UI domain: `components/`, `savedQueries.ts`,
  `highlight.ts`
- `settings/` - settings UI domain: `components/`, `index.ts` (load/save),
  `theme.ts`, `types.ts`
- `word-index/` - RPC stub asking the worker for suggestions
- `ui/` - generic presentational components (Button, Dropdown, …)
- `i18n/` - locale strings (Storybook stories colocated with components)

**`common/`** — code both contexts import

- `history/domain/` - HistoryItem type, search/filter/group (pure)
- `history/store/` - bookmark persistence: hierarchical folders
  `Eternal History/YYYY/MM/DD/HH/`, metadata serialized into bookmark
  titles with 💾 separator (`"Title 💾{"v":1,"t":timestamp,"vc":visitCount}"`)
- `word-index/` - pure word index build/lookup (worker builds it,
  client DebugTools uses it for analysis)
- `chrome/` - thin chrome API wrappers (direct `chrome.bookmarks`/`chrome.history`
  access outside these is lint-forbidden) and their test mocks
- `messages.ts` - the worker⇔client RPC message contract

### Data Flow

1. User visits page → `chrome.history.onVisited` triggers in the worker
2. Worker converts to HistoryItem and inserts via `common/history/store`
3. Store creates hierarchical folders based on timestamp
4. HistoryItem serialized with metadata and stored as bookmark
5. New Tab interface (client) searches the store directly via chrome.bookmarks
6. Results deserialized from bookmarks back to HistoryItem format
7. Suggestions only: client asks the worker over `common/messages.ts` RPC

### Important Patterns

- All storage operations require `initializeStorage()` first
- Bookmark metadata uses version field (`v`) for future compatibility
- Search performs progressive filtering (first term via Chrome API, rest via client-side filtering)
- Folder structure enables efficient date-based queries
- Duplicate URL handling: updates existing bookmarks instead of creating duplicates

### Testing Strategy

- Unit tests for core utilities (storage, serialization, date handling)
- Mock Chrome APIs via `src/common/chrome/__mocks__/`
- Vitest for test runner with TypeScript support
- Component tests via Storybook for visual regression testing

### Build Configuration

- Vite with root `src/client`; entry points: `client/index.html` / `client/options.html` (UI) and `worker/index.ts` (service worker, emitted as `background.js`)
- TypeScript compilation with strict mode
- Output: `dist/` directory with `background.js` and hashed assets
- Extension manifest in `public/manifest.json`
