# Ghost Writer Manager

One-way synchronization from Obsidian to Ghost CMS with post scheduling, YAML metadata control, and automatic sync.

## Features

- 🔄 **One-way sync** from Obsidian to Ghost (keeps Ghost as your publishing platform)
- 📝 **YAML frontmatter control** - Manage all Ghost metadata directly in Obsidian
- 🕐 **Post scheduling** - Schedule posts for future publication with `g_published_at`
- 🔄 **Automatic sync** - Debounced sync on file save (2s delay)
- ⏰ **Periodic sync** - Configurable interval sync (default: 15 minutes)
- ✨ **Markdown to Lexical conversion** - Full markdown support including images
- 🔐 **JWT authentication** - Secure Ghost Admin API integration
- 📊 **Status bar indicator** - Visual feedback on sync status
- 🎯 **Flexible configuration** - Custom sync folder, prefix, and intervals

## Installation

### From GitHub Releases (Recommended)

1. Go to the [Releases page](https://github.com/diegoeis/ghost-writer-manager-plugin/releases)
2. Download the latest release files:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. In your vault, navigate to `.obsidian/plugins/` folder
4. Create a new folder called `ghost-writer-manager`
5. Move the downloaded files into `.obsidian/plugins/ghost-writer-manager/`
6. Restart Obsidian or reload the app
7. Go to **Settings** → **Community Plugins**
8. Enable **Ghost Writer Manager**

### From Source (For Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/diegoeis/ghost-writer-manager-plugin.git
   cd ghost-writer-manager-plugin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your vault path for hot reload:
   ```bash
   cp dev.config.example.json dev.config.json
   # Edit dev.config.json with your vault path
   ```

4. Start dev mode with hot reload:
   ```bash
   npm run dev
   ```
   This will automatically:
   - Watch for file changes
   - Build on every change
   - Copy `main.js`, `manifest.json`, and `styles.css` to your vault
   - No manual copying needed!

5. Enable the plugin in Obsidian settings

6. Reload Obsidian (Ctrl/Cmd + R) to see changes

## Configuration

### Getting Your Ghost Admin API Key

1. Log in to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Click **Add custom integration**
4. Give it a name (e.g., "Obsidian Sync")
5. Copy the **Admin API Key** (format: `id:secret`)

### Plugin Settings

1. Open Obsidian Settings
2. Navigate to **Ghost Writer Manager** under Community Plugins
3. Configure the following:
   - **Ghost URL**: Your Ghost site URL (e.g., `https://yourblog.ghost.io`)
   - **Admin API Key**: The key you copied from Ghost
   - **Sync Folder**: Where Ghost posts will be stored in your vault (default: `Ghost Posts`)
   - **Sync Interval**: How often to check for changes in minutes (default: 15)
   - **YAML Prefix**: Prefix for Ghost metadata fields (default: `ghost`)

4. Click **Test Connection** to verify your credentials

## Usage

### Commands

Available commands (Cmd/Ctrl + P):

- **Sync with Ghost** - Manually sync all files in sync folder
- **Test Ghost connection** - Verify your Ghost credentials
- **Create new Ghost post** - Generate new post with Ghost properties template
- **Add Ghost properties to current note** - Add Ghost properties to existing note
- **Sync current note to Ghost** - Force sync of active file
- **Debug commands** - Show properties, test JWT, view file data

### YAML Frontmatter

Control all Ghost post metadata using YAML frontmatter:

```yaml
---
g_post_access: paid              # Visibility: public, members, or paid
g_published: false               # Draft (false) or published (true)
g_published_at: ""               # Schedule: ISO date (e.g., "2026-12-25T10:00:00.000Z")
g_featured: false                # Mark as featured post
g_tags: [obsidian, ghost]        # Post tags
g_excerpt: "Post summary"        # Custom excerpt/description
g_feature_image: ""              # Featured image URL
g_slug: "custom-url"             # Custom URL slug
g_no_sync: false                 # Disable sync for this post
---

# Your Post Title

Your post content here...
```

### Post Scheduling

Control when posts are published:

- **Draft**: `g_published: false` (ignores `g_published_at`)
- **Publish now**: `g_published: true` + `g_published_at: ""`
- **Schedule**: `g_published: true` + `g_published_at: "2026-12-25T10:00:00.000Z"` (future date)
- **Backdate**: `g_published: true` + `g_published_at: "2020-01-01T10:00:00.000Z"` (past date)

## Development

### Project Structure

```
ghost-writer-manager-plugin/
├── main.ts                 # Main plugin file
├── src/
│   ├── types.ts           # TypeScript interfaces
│   └── ghost/
│       └── api-client.ts  # Ghost Admin API client
├── manifest.json          # Plugin manifest
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

### Commands

- `npm run dev` - Build in development mode with watch
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Roadmap

### ✅ Completed (v0.1.0)
- [x] Ghost API authentication (JWT with HMAC-SHA256)
- [x] Settings interface
- [x] Connection testing
- [x] One-way sync engine (Obsidian → Ghost)
- [x] YAML metadata control (full Ghost properties support)
- [x] Markdown to Lexical format conversion
- [x] Automatic sync on file save (debounced)
- [x] Periodic sync (configurable interval)
- [x] Post scheduling system
- [x] Status bar indicator
- [x] Manual sync commands

### 🚧 Future Features
- [ ] Two-way sync (Ghost → Obsidian)
- [ ] Editorial calendar view
- [ ] Ghost pages support
- [ ] Media upload support
- [ ] Conflict resolution
- [ ] Bulk operations
- [ ] Post templates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/diegoeis/ghost-writer-manager-plugin/issues).
