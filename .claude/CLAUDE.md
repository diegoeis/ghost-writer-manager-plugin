# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ghost Writer Manager Plugin is an Obsidian plugin that provides bidirectional synchronization between Obsidian vaults and Ghost CMS. It enables content creators to write in Obsidian and manage Ghost publications directly from their vault, with full editorial control via YAML frontmatter and an integrated editorial calendar.

## Development Commands

The project has a fully configured build system with hot reload support:

- `npm install` - Install dependencies
- `npm run dev` - Build plugin in development mode with watch and hot reload to configured vault
- `npm run build` - Build plugin for production
- `npm run lint` - Run ESLint checks
- `npm version patch|minor|major` - Bump version for release

**Development Setup**: Copy `dev.config.example.json` to `dev.config.json` and set your test vault path for hot reload functionality.

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

**IMPORTANT**: When working on Obsidian plugin development tasks, always use the `/eis-obsidian-claude-plugin:obsdn.obsidian` skill to load comprehensive Obsidian plugin development guidelines. This includes all 27 ESLint rules, TypeScript best practices, memory management, API usage patterns, UI/UX standards, and submission requirements.

All development must follow the **27 Critical Rules** documented in `.claude/rules/obsidian-plugin-rules.md`:

- **Type Safety**: Strict TypeScript with no `any` types
- **Memory Management**: Proper cleanup in `onunload()`, use `registerEvent()` for auto-cleanup
- **API Usage**: Use `requestUrl()` for Ghost API calls (not `fetch()`), use `normalizePath()` for paths
- **Error Handling**: Graceful degradation with user-friendly notices
- **Accessibility**: Proper ARIA labels, keyboard navigation, focus indicators (MANDATORY)
- **UI/UX**: Sentence case, no default hotkeys, no "command" in command names
- **Security**: No `innerHTML`, store secrets in Obsidian Keychain
- **Compatibility**: No regex lookbehind (iOS < 16.4 incompatible)

For complete details, see:
- `.claude/rules/obsidian-plugin-rules.md` - Quick reference of all 27 rules
- `.claude/skills/obsidian/SKILL.md` - Comprehensive guidelines
- `AGENTS.md` - Agent-specific development guidance

### Key Obsidian APIs to Use

- `Plugin` class for main plugin structure
- `PluginSettingTab` for configuration UI
- `ItemView` for editorial calendar sidebar
- `TFile` and `Vault` for file operations
- `MetadataCache` for reading frontmatter
- `Notice` for user notifications
- `requestUrl` for Ghost API calls

## Product Requirements

Full product scope is defined in `docs/prd-001-ghost-writer-manager-plugin.md`.

### Current Status (v0.1.0 - Released)

**Implemented Features:**
- ✅ One-way sync (Obsidian → Ghost)
- ✅ Ghost Admin API integration with JWT authentication
- ✅ Secure credential storage via Obsidian Keychain
- ✅ YAML metadata control (all Ghost properties with `g_` prefix)
- ✅ Post scheduling system (draft, publish now, schedule, backdate)
- ✅ Periodic sync with configurable interval (default: 15 min)
- ✅ Auto-sync on file save with debounce (development mode)
- ✅ Markdown to Lexical format conversion
- ✅ Status bar indicator
- ✅ Manual sync commands and connection testing

### Planned Features (Future Releases)

- **FRD-001**: Editorial calendar sidebar view (v0.2.0)
- **FRD-002**: Bidirectional sync with conflict resolution (v0.2.0)
- **FRD-006**: Lexical/HTML → Markdown conversion (v0.2.0)
- Ghost Pages support (future)
- Historical sync capability (future)

### Scope Limitations (All Versions)

- Posts only (no Ghost Pages in v1)
- No Ghost member/newsletter/theme/analytics management
- Ghost-specific (not a generic CMS integration)
- No historical sync in v0.1.0 (only posts created after plugin installation)

## Important Technical Constraints

1. **Authentication**: Must use Ghost Admin API with JWT tokens, stored in Obsidian Keychain
2. **Sync Timing**: Only sync posts created/modified after plugin installation (no historical import in v1)
3. **Conflict Resolution**: Automatic merge when possible; user prompt only when necessary
4. **Data Integrity**: Verify content checksums before/after sync to prevent data loss
5. **Success Metrics**: Target ≥99% sync success rate, ≥95% automatic conflict resolution

## Documentation Structure

### Quick Start Files
- `README.md` - User-facing documentation and installation guide
- `AGENTS.md` - AI agent development guidance (common tasks, patterns, troubleshooting)
- `.claude/CLAUDE.md` - This file (project overview for Claude)

### Development Documentation
- `.claude/rules/obsidian-plugin-rules.md` - Quick reference of all 27 critical Obsidian rules
- `.claude/skills/obsidian/SKILL.md` - Comprehensive Obsidian plugin development guidelines
- `docs/DEVELOPMENT_GUIDELINES.md` - Detailed development workflow and patterns
- `docs/KEYCHAIN_SETUP.md` - Obsidian Secret Storage implementation guide
- `docs/SUBMISSION_GUIDE.md` - Publishing to Obsidian community plugins

### Product Documentation
- `docs/prd-001-ghost-writer-manager-plugin.md` - Product requirements (PRD)
- `docs/frd/` - Functional requirements documents (FRDs)
- `docs/RELEASE_NOTES.md` - Version history and release notes
- `CHANGELOG.md` - Detailed changelog

### External References
- Ghost Admin API: https://docs.ghost.org/admin-api/
- Ghost Content API: https://docs.ghost.org/content-api/
- Obsidian Plugin API: https://docs.obsidian.md/Reference/TypeScript+API/
- Obsidian Plugin Guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Obsidian Secret Storage: https://docs.obsidian.md/plugins/guides/secret-storage
