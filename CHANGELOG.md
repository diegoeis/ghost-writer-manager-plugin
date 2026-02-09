# Changelog

All notable changes to the Ghost Writer Manager plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/diegoeis/ghost-write-manager/releases/tag/0.1.0
