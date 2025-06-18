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
- `npm run test -- src/lib/storage.spec.ts` - Run specific test file

### Code Quality

- `npm run lint` - Run all linters (ESLint on JS/TS files)
- `npm run lint:js` - Run ESLint specifically
- `npm run fix` - Auto-fix linting and formatting issues
- `npm run fix:js` - Auto-fix ESLint issues only
- `npm run fix:prettier` - Auto-format with Prettier

## Architecture

### Core Concept

Eternal History is a Chrome extension that provides unlimited browser history storage by serializing history data into Chrome bookmarks with hierarchical folder organization. The extension replaces the New Tab page with a searchable history interface.

### Key Components

**Background Script (`background.ts`)**

- Initializes storage system on extension startup
- Listens for Chrome history events (`chrome.history.onVisited`)
- Converts Chrome history items to internal HistoryItem format
- Handles delayed title updates (10-second delay for JS-rendered titles)

**Storage System (`lib/storage.ts`)**

- Core storage abstraction using Chrome bookmarks API
- Hierarchical folder structure: `Eternal History/YYYY/MM/DD/HH/`
- Must call `initializeStorage()` before any other storage operations
- Provides search, insertion, and recent history retrieval

**Bookmark Serialization (`lib/bookmark-serializer.ts`)**

- Serializes HistoryItem metadata into bookmark titles using 💾 separator
- Format: `"Original Title 💾{"v":1,"t":timestamp,"vc":visitCount}"`
- Handles legacy bookmarks without metadata gracefully
- Provides precise timestamp preservation beyond folder-based organization

**UI Components (`components/`)**

- React components for the New Tab replacement interface
- `Root.tsx` - Main layout component
- `SearchBox.tsx` - Search input with real-time filtering
- `Histories.tsx` - Results display with highlighting
- `HistoryItem.tsx` - Individual history item display

### Data Flow

1. User visits page → `chrome.history.onVisited` triggers
2. Background script converts to HistoryItem and calls `insertHistories()`
3. Storage system creates hierarchical folders based on timestamp
4. HistoryItem serialized with metadata and stored as bookmark
5. New Tab interface searches via `search()` or `getRecentHistories()`
6. Results deserialized from bookmarks back to HistoryItem format

### Important Patterns

- All storage operations require `initializeStorage()` first
- Bookmark metadata uses version field (`v`) for future compatibility
- Search performs progressive filtering (first term via Chrome API, rest via client-side filtering)
- Folder structure enables efficient date-based queries
- Duplicate URL handling: updates existing bookmarks instead of creating duplicates

### Testing Strategy

- Unit tests for core utilities (storage, serialization, date handling)
- Mock Chrome APIs via `__mocks__/chrome_bookmarks.mock.ts`
- Vitest for test runner with TypeScript support
- Component tests via Storybook for visual regression testing

### Build Configuration

- Vite with dual entry points: `index.html` (main UI) and `background.ts` (service worker)
- TypeScript compilation with strict mode
- Output: `dist/` directory with `background.js` and hashed assets
- Extension manifest in `public/manifest.json`
