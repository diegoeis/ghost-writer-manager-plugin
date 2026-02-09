# Ghost Writer Manager

Synchronize posts bidirectionally between Ghost CMS and Obsidian with editorial calendar and YAML metadata control.

## Features

- 🔄 Bidirectional sync between Ghost and Obsidian
- 📝 Manage Ghost posts using YAML frontmatter
- 📅 Editorial calendar view (coming soon)
- 🔐 Secure credential storage using Obsidian's secret storage
- ✨ Markdown to Ghost format conversion (coming soon)

## Installation

### Development Installation

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

- **Sync with Ghost**: Manually trigger synchronization (coming soon)
- **Test Ghost connection**: Verify your Ghost credentials are working

### YAML Frontmatter (Coming Soon)

Posts will use YAML frontmatter to control Ghost metadata:

```yaml
---
ghost_status: published
ghost_tags: [obsidian, ghost, tutorial]
ghost_featured: true
ghost_feature_image: https://example.com/image.jpg
ghost_excerpt: A brief description of the post
ghost_published_at: 2024-01-15T10:00:00Z
ghost_no_sync: false
---

# Your Post Title

Your post content here...
```

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

- [x] Ghost API authentication
- [x] Settings interface
- [x] Connection testing
- [ ] Bidirectional sync engine
- [ ] YAML metadata control
- [ ] Markdown to Ghost format conversion
- [ ] Editorial calendar view
- [ ] Conflict resolution
- [ ] Automatic sync

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/diegoeis/ghost-writer-manager-plugin/issues).
