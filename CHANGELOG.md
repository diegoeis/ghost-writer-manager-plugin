# Changelog

All notable changes to the Ghost Writer Manager plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-02-19

### Fixed
- Replace `TFile` type cast with safe `instanceof` narrowing when opening vault notes from calendar
- Remove unnecessary `async` from `onClose` (no await expression)
- Add explicit `void` operator to unhandled `revealLeaf` promises in `activateCalendarView`

## [0.2.0] - 2026-02-19

### Added
- Editorial calendar sidebar view (`CalendarView`) showing all published and scheduled posts for the current month
- Monthly grid with navigation buttons (previous/next month and year)
- Status dots on day cells via CSS pseudo-elements: purple for published posts, green for scheduled, both when mixed
- Bold day numbers for days that have posts
- Click a day cell to filter the post list to that day; click again to deselect and show all
- Today button to return to the current month
- Current day highlighted with a subtle grey border
- Post list grouped by day, each entry showing status badge, title and external link to Ghost Admin
- Post titles with linked vault notes open in a new Obsidian tab
- Full keyboard navigation and ARIA labels for accessibility
- "Open Ghost editorial calendar" command

## [0.1.2] - 2026-02-18

### Fixed
- Replace all `console.log` calls with `console.debug` for production compliance (60+ occurrences)
- Resolve floating promises with `void` operator and `.then()/.catch()` patterns
- Fix async `editorCallback` functions that had no `await` (made synchronous)
- Replace deprecated `substr()` with `substring()` in API client
- Fix unnecessary regex escape characters in markdown-to-lexical converter
- Remove unsafe `as BufferSource` type assertion; use `keyData.buffer as ArrayBuffer` instead
- Fix potential `[object Object]` stringification in frontmatter parser for excerpt, feature_image, and published_at
- Remove unused imports (`TFolder`, `hasGhostProperties`, `GhostPostStatus`, `markdownToHtml`)
- Fix emoji characters in Notice messages (replaced with plain text)
- Fix `error.message` references to use proper `(error as Error).message` casting
- Enforce sentence case in all UI command names and placeholders
- Add `aria-label` to Keychain icon button for screen reader accessibility (Rule 22)

## [0.1.0] - 2026-02-09

### Added
- Initial release of Ghost Writer Manager
- Obsidian to Ghost synchronization (one-way sync)
- Automatic sync on file modification (debounced 2 seconds)
- Periodic sync based on configurable interval (default: 15 minutes)
- Post scheduling system with `g_published_at` property
  - Schedule posts for future dates
  - Publish posts with custom dates
  - Automatic status detection (draft/published/scheduled)
- YAML frontmatter-based metadata control with customizable prefix
- Ghost properties:
  - `g_post_access` - Control post visibility (public/members/paid)
  - `g_published` - Boolean to control draft/published state
  - `g_published_at` - ISO date for scheduling posts
  - `g_featured` - Mark posts as featured
  - `g_tags` - Array of tags
  - `g_excerpt` - Post excerpt/description
  - `g_feature_image` - Featured image URL
  - `g_no_sync` - Disable sync for specific posts
  - `g_slug` - Custom slug for posts
- Markdown to Lexical format conversion
  - Full markdown support (headings, lists, blockquotes, code blocks)
  - Image rendering
  - Link support
  - Inline formatting (bold, italic, code)
- JWT authentication with Ghost Admin API
- Commands:
  - "Sync with Ghost" - Manual sync of all files
  - "Test Ghost connection" - Verify credentials
  - "Create new Ghost post" - Create template with properties
  - "Add Ghost properties to current note" - Add missing properties
  - "Sync current note to Ghost" - Manual sync of active file
  - Debug commands for troubleshooting
- Status bar indicator showing sync status
- Configurable sync folder
- Optional sync notifications
- Hot reload system for development

### Technical Details
- Uses Obsidian's `requestUrl` to bypass CORS
- Implements HMAC-SHA256 JWT token generation
- Debounced file watching to prevent excessive API calls
- Proper error handling and logging
- TypeScript-based with full type safety

### Known Limitations
- One-way sync only (Obsidian → Ghost)
- Excerpt field may not persist in Ghost (Ghost API limitation)
- No support for Ghost pages (posts only)
- No media upload support yet

[0.2.1]: https://github.com/diegoeis/ghost-writer-manager-plugin/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/diegoeis/ghost-writer-manager-plugin/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/diegoeis/ghost-writer-manager-plugin/compare/0.1.0...0.1.2
[0.1.0]: https://github.com/diegoeis/ghost-writer-manager-plugin/releases/tag/0.1.0
