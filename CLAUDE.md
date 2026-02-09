# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ghost Writer Manager Plugin is an Obsidian plugin that provides bidirectional synchronization between Obsidian vaults and Ghost CMS. It enables content creators to write in Obsidian and manage Ghost publications directly from their vault, with full editorial control via YAML frontmatter and an integrated editorial calendar.

## Development Commands

This project is in early development and does not yet have a build system configured. When the TypeScript codebase is established, typical Obsidian plugin commands will include:

- `npm install` - Install dependencies
- `npm run dev` - Build plugin in development mode with watch
- `npm run build` - Build plugin for production
- `npm run lint` - Run ESLint checks
- Testing commands will be added as the project matures

## Architecture

### Core Components

The plugin follows standard Obsidian plugin architecture with these key modules:

1. **Ghost API Integration** (`src/ghost/`)
   - Uses Ghost Admin API with JWT authentication
   - Credentials stored securely via Obsidian Secret Storage (Keychain)
   - Handles CRUD operations for Ghost posts
   - Reference: https://docs.ghost.org/admin-api/

2. **Bidirectional Sync Engine** (`src/sync/`)
   - Monitors configured sync folder in the vault
   - Detects changes in both Obsidian and Ghost
   - Implements intelligent conflict resolution/merge
   - Uses configurable sync frequency

3. **Content Conversion** (`src/converters/`)
   - Bidirectional conversion between Markdown and Ghost's Lexical/HTML format
   - Preserves formatting, images, and embedded content
   - Handles Obsidian-specific syntax (wikilinks, embeds)

4. **YAML Metadata Controller** (`src/metadata/`)
   - Manages configurable prefixed YAML properties (e.g., `ghost_status`, `ghost_tags`)
   - Maps Obsidian frontmatter to Ghost post metadata
   - Supports: status, tags, featured image, excerpt, published_at, no-sync flag

5. **Editorial Calendar View** (`src/views/`)
   - Sidebar view showing publications grouped by status
   - Organized by publication date
   - Provides direct links to vault notes and Ghost Admin

### File Management

- **Sync Folder**: Configured folder in vault where Ghost posts are stored as Markdown files
- **Auto-movement**: Notes moved into/out of sync folder based on Ghost sync status
- **Isolation**: Only files in sync folder are considered for Ghost synchronization

## Plugin Development Guidelines

**IMPORTANT**: When working on Obsidian plugin development tasks, always use the `/obsidian` slash command to load comprehensive Obsidian plugin development guidelines. This includes all 27 ESLint rules, TypeScript best practices, memory management, API usage patterns, UI/UX standards, and submission requirements.

This project must follow Obsidian plugin development best practices as defined in `.claude/skills/obsidian/SKILL.md`:

- **Type Safety**: Strict TypeScript with no `any` types
- **Memory Management**: Proper cleanup in `onunload()`, remove event listeners, clear intervals
- **API Usage**: Use `requestUrl()` for Ghost API calls (not `fetch()`)
- **Error Handling**: Graceful degradation with user-friendly notices
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **UI/UX**: Follow Obsidian's design patterns and component guidelines

### Key Obsidian APIs to Use

- `Plugin` class for main plugin structure
- `PluginSettingTab` for configuration UI
- `ItemView` for editorial calendar sidebar
- `TFile` and `Vault` for file operations
- `MetadataCache` for reading frontmatter
- `Notice` for user notifications
- `requestUrl` for Ghost API calls

## Product Requirements

Full product scope is defined in `docs/prd-001-ghost-writer-manager-plugin.md`. Key FRDs:

- **FRD-001**: Editorial calendar sidebar view
- **FRD-002**: Bidirectional auto-sync with conflict resolution
- **FRD-003**: Sync folder configuration and file management
- **FRD-004**: YAML-based metadata control
- **FRD-005**: Ghost Admin API integration with secure auth
- **FRD-006**: Markdown ↔ Lexical/HTML conversion

### Scope Limitations (v1)

- Posts only (no Ghost Pages)
- No historical sync (only posts created after plugin installation)
- No Ghost member/newsletter/theme/analytics management
- Ghost-specific (not a generic CMS integration)

## Important Technical Constraints

1. **Authentication**: Must use Ghost Admin API with JWT tokens, stored in Obsidian Keychain
2. **Sync Timing**: Only sync posts created/modified after plugin installation (no historical import in v1)
3. **Conflict Resolution**: Automatic merge when possible; user prompt only when necessary
4. **Data Integrity**: Verify content checksums before/after sync to prevent data loss
5. **Success Metrics**: Target ≥99% sync success rate, ≥95% automatic conflict resolution

## Documentation References

- Ghost Admin API: https://docs.ghost.org/admin-api/
- Ghost Content API: https://docs.ghost.org/content-api/
- Obsidian Plugin Docs: https://docs.obsidian.md/
- Obsidian Secret Storage: https://docs.obsidian.md/plugins/guides/secret-storage
- Obsidian Plugin Guidelines: `.claude/skills/obsidian/SKILL.md`
