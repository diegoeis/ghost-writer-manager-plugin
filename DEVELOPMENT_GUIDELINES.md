# Development Guidelines for Ghost Writer Manager Plugin

## ⚠️ CRITICAL: Always Follow Obsidian Official Documentation

**IMPORTANT**: Before implementing ANY feature, tool, API, method, or functionality:

1. **CHECK the official Obsidian documentation first**
   - Plugin Development Docs: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
   - API Reference: https://docs.obsidian.md/Reference/TypeScript+API
   - GitHub API Docs: https://github.com/obsidianmd/obsidian-api

2. **USE the official Obsidian APIs and methods**
   - Don't assume how things work
   - Don't create workarounds when official APIs exist
   - Follow the documented patterns and best practices

3. **VERIFY** your understanding
   - Read the TypeScript definitions in `obsidian` package
   - Check example plugins for reference implementations
   - Test thoroughly before committing

## Recent Examples of Mistakes to Avoid

### ❌ Mistake: Using `localStorage` Instead of Obsidian Secrets

**What happened**: Initially implemented API key storage using `app.loadLocalStorage()` and `app.saveLocalStorage()`.

**Why it was wrong**: Obsidian has a dedicated **Secrets (Keychain)** feature in Settings that is specifically designed for secure credential storage.

**Correct approach**: Use `app.loadSecret(secretName)` to read from Obsidian's Keychain where users manually create and manage secrets.

**Lesson**: Always check if Obsidian has a built-in feature before implementing custom solutions.

### ✅ Correct: Using Obsidian's Secrets API

```typescript
// User creates secret in Settings → Keychain
// Plugin references secret by name
const apiKey = await this.app.loadSecret(this.settings.ghostApiKeySecretName);
```

## Development Checklist

Before implementing any feature:

- [ ] Check official Obsidian documentation
- [ ] Review TypeScript API definitions
- [ ] Look for existing plugins that implement similar features
- [ ] Verify the approach with documentation
- [ ] Test thoroughly
- [ ] Document the implementation

## Key Obsidian Features to Use Correctly

### 1. Secrets Management
- **Use**: `app.loadSecret(name)` for reading secrets
- **Don't**: Store credentials in settings or localStorage
- **Users manage**: Secrets in Settings → Keychain

### 2. File Operations
- **Use**: Obsidian's Vault API (`app.vault.read`, `app.vault.modify`, etc.)
- **Don't**: Direct file system operations
- **Why**: Vault API handles permissions, events, and cache correctly

### 3. Network Requests
- **Use**: `requestUrl()` from Obsidian
- **Don't**: Use `fetch()` directly
- **Why**: `requestUrl()` bypasses CORS and works with Electron

### 4. Metadata Cache
- **Use**: `app.metadataCache.getFileCache(file)`
- **Don't**: Parse YAML frontmatter manually
- **Why**: Cache is updated automatically and optimized

### 5. Settings Storage
- **Use**: `this.loadData()` and `this.saveData()`
- **Don't**: Write to files manually
- **Why**: Obsidian manages the data folder location

## Documentation Resources

### Official Docs
- **Plugin Guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **Plugin Review**: https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md
- **API Reference**: https://docs.obsidian.md/Reference/TypeScript+API
- **Sample Plugin**: https://github.com/obsidianmd/obsidian-sample-plugin

### Community Resources
- **Discord**: https://discord.gg/obsidianmd
- **Forum**: https://forum.obsidian.md/
- **Plugin Stats**: https://obsidian-plugin-stats.vercel.app/

### TypeScript Definitions
The `obsidian` package includes full TypeScript definitions:
```bash
node_modules/obsidian/obsidian.d.ts
```

## Code Review Principles

When reviewing code (AI or human):

1. **Verify against docs**: Does this match official Obsidian patterns?
2. **Check for built-in features**: Is there an Obsidian API for this?
3. **Security**: Are we handling credentials correctly?
4. **Performance**: Are we using cached data when available?
5. **User experience**: Does this follow Obsidian UI patterns?

## Testing

Always test:

1. **Fresh install**: Does it work on first setup?
2. **Reload**: Does it survive Obsidian restart?
3. **Settings changes**: Do updates apply correctly?
4. **Error cases**: Are errors handled gracefully?
5. **Mobile**: Does it work on mobile? (if not desktop-only)

## Common Pitfalls

### ❌ Don't
- Store secrets in plain text
- Use `fetch()` for external requests
- Parse YAML manually
- Write files outside vault API
- Block the main thread
- Use `eval()` or dangerous code execution
- Leave `console.log` in production code

### ✅ Do
- Use Obsidian's Secrets for credentials
- Use `requestUrl()` for network requests
- Use `metadataCache` for frontmatter
- Use Vault API for all file operations
- Use async operations
- Validate all user input
- Use `console.warn()` or `console.error()` for important logs

## Version Compatibility

- **Current minimum**: Obsidian 1.0.0
- **Check API availability**: Some features were added in later versions
- **Test on mobile**: Mobile has restrictions (e.g., Node.js APIs)

## When in Doubt

1. **Read the docs**: Start with official documentation
2. **Check the types**: TypeScript definitions are authoritative
3. **Look at examples**: Official sample plugin and popular plugins
4. **Ask the community**: Discord or Forum
5. **Test thoroughly**: Better to catch issues early

---

## Summary

**Always consult Obsidian's official documentation BEFORE implementing any feature.**

This prevents:
- Implementing non-standard solutions
- Missing built-in features
- Creating security vulnerabilities
- Breaking plugin guidelines
- Failing plugin review

**When working on this plugin, documentation comes FIRST, implementation comes SECOND.**
