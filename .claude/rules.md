# Project Rules - Ghost Writer Manager Plugin

## 🚨 CRITICAL: Documentation-First Development

### Rule 1: ALWAYS Consult Official Documentation Before Implementation

**NEVER assume how APIs, methods, or features work. ALWAYS verify with official documentation FIRST.**

#### For Obsidian Plugin Development:
1. **Check official docs FIRST**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
2. **Verify API reference**: https://docs.obsidian.md/Reference/TypeScript+API
3. **Check TypeScript definitions**: `node_modules/obsidian/obsidian.d.ts`
4. **Review plugin guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
5. **Study sample plugin**: https://github.com/obsidianmd/obsidian-sample-plugin

#### For Ghost CMS Integration:
1. **Check Ghost Admin API docs**: https://ghost.org/docs/admin-api/
2. **Review Content API docs**: https://ghost.org/docs/content-api/
3. **Verify authentication methods**: JWT specifications in Ghost docs
4. **Check Lexical format**: https://ghost.org/docs/admin-api/#lexical

#### For Obsidian Plugin Submission:
1. **Read submission guidelines**: https://github.com/obsidianmd/obsidian-releases/blob/master/README.md
2. **Follow plugin review checklist**: https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md
3. **Add to END of community-plugins.json**: NOT alphabetically, but at the END of the array
4. **Use the ESLint plugin for Obsidian**: https://github.com/obsidianmd/eslint-plugin

### Rule 2: No Assumptions Without Verification

Before implementing ANY feature:
- [ ] Read official documentation
- [ ] Check TypeScript type definitions
- [ ] Look for existing plugin examples
- [ ] Verify the approach matches official patterns
- [ ] Test thoroughly

**Examples of past mistakes to NEVER repeat:**
- ❌ Using `app.loadLocalStorage()` instead of `app.secretStorage.getSecret()`
- ❌ Using non-existent `app.loadSecret()` instead of checking actual API
- ❌ Assuming alphabetical order in community-plugins.json (should be at END)

## 📝 Language and Communication Rules

### Rule 3: All Code-Related Text Must Be in English

**ALWAYS write in English:**
- ✅ Git commit messages
- ✅ Git release notes
- ✅ Code comments
- ✅ Documentation (README, CHANGELOG, etc.)
- ✅ Error messages shown to users
- ✅ Variable and function names
- ✅ GitHub Pull Request titles and descriptions

**Conversation with user can be in Portuguese, but all code artifacts in English.**

### Rule 4: Commit Message Standards

Follow Conventional Commits specification:

```
<type>: <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**
- ✅ `feat: Add support for post scheduling with g_published_at`
- ✅ `fix: Use correct Obsidian SecretStorage API`
- ✅ `docs: Update installation instructions in README`
- ❌ `Adicionado suporte para agendamento` (wrong language)
- ❌ `fixed stuff` (too vague)

## 🔒 Security Rules

### Rule 5: NEVER Expose Sensitive Information

**NEVER commit, log, or expose:**
- ❌ API keys or secrets
- ❌ Passwords or tokens
- ❌ Private URLs or endpoints
- ❌ User data or personal information
- ❌ Internal system paths (use relative paths in documentation)
- ❌ Environment variables with sensitive data

**ALWAYS:**
- ✅ Use Obsidian's `app.secretStorage` for credentials
- ✅ Store secrets in `.gitignore`d files or environment variables
- ✅ Use placeholder examples in documentation (e.g., `your-api-key-here`)
- ✅ Validate and sanitize all user input
- ✅ Use HTTPS for all external requests
- ✅ Remove `console.log()` statements in production (use `console.warn()`/`console.error()` only)

### Rule 6: Secure Coding Practices

**ALWAYS:**
- ✅ Use Obsidian's `requestUrl()` for HTTP requests (bypasses CORS, works with Electron)
- ✅ Never use `eval()` or dangerous code execution
- ✅ Validate all inputs from Ghost API
- ✅ Handle errors gracefully with user-friendly messages
- ✅ Use TypeScript strict mode
- ✅ Sanitize content before sending to Ghost API

**NEVER:**
- ❌ Store credentials in plain text
- ❌ Use `fetch()` directly (use Obsidian's `requestUrl()`)
- ❌ Trust external data without validation
- ❌ Execute arbitrary code from user input

## 🏗️ Development Best Practices

### Rule 7: Use Official Obsidian APIs

**File Operations:**
- ✅ Use `app.vault.read()`, `app.vault.modify()`, `app.vault.create()`
- ❌ Never use Node.js `fs` module directly

**Network Requests:**
- ✅ Use `requestUrl()` from Obsidian
- ❌ Never use `fetch()` directly

**Metadata:**
- ✅ Use `app.metadataCache.getFileCache()`
- ❌ Never parse YAML frontmatter manually

**Settings:**
- ✅ Use `this.loadData()` and `this.saveData()`
- ❌ Never write to files manually for settings

**Secrets:**
- ✅ Use `app.secretStorage.getSecret()` and `app.secretStorage.setSecret()`
- ❌ Never use localStorage or plain settings for credentials

### Rule 8: Development Mode vs Production

**Before ANY production build or release:**
- [ ] Set `DEV_MODE = false` in `main.ts`
- [ ] Run `npm run build` (not `npm run dev`)
- [ ] Test the production build
- [ ] Create GitHub release with compiled files
- [ ] Verify `main.js`, `manifest.json`, and `styles.css` are included

### Rule 9: Code Quality Standards

**ALWAYS:**
- ✅ Use TypeScript with proper type annotations
- ✅ Handle all promise rejections
- ✅ Provide clear error messages to users
- ✅ Use async/await for asynchronous operations
- ✅ Clean up resources in `onunload()`
- ✅ Test on actual Obsidian installation before release

**NEVER:**
- ❌ Leave `console.log()` in production code
- ❌ Block the main thread with synchronous operations
- ❌ Ignore TypeScript errors or use `@ts-ignore` without good reason
- ❌ Skip error handling

## 📦 Release Process

### Rule 10: Release Checklist

Before creating a release:

1. **Code Quality:**
   - [ ] Set `DEV_MODE = false`
   - [ ] All TypeScript errors resolved
   - [ ] No `console.log()` statements
   - [ ] All features tested

2. **Documentation:**
   - [ ] README.md updated
   - [ ] CHANGELOG.md updated
   - [ ] Version bumped in `manifest.json`
   - [ ] Version added to `versions.json`

3. **Build:**
   - [ ] Run `npm run build`
   - [ ] Verify `main.js` is generated
   - [ ] Verify `styles.css` exists
   - [ ] Test in actual Obsidian

4. **Git:**
   - [ ] All changes committed
   - [ ] Commit messages in English
   - [ ] Tag created with version number
   - [ ] Pushed to GitHub

5. **GitHub Release:**
   - [ ] Create release with tag
   - [ ] Attach `main.js`
   - [ ] Attach `manifest.json`
   - [ ] Attach `styles.css`
   - [ ] Release notes in English

## 🎯 Project-Specific Rules

### Rule 11: Ghost Integration Specifics

**Post Status Logic:**
- If `g_published = false`: Always draft, regardless of date
- If `g_published = true` AND `g_published_at` is future: Scheduled
- If `g_published = true` AND `g_published_at` is past/now: Published
- If `g_published = true` AND no `g_published_at`: Published now

**YAML Properties (with `g_` prefix by default):**
- `g_published`: boolean - Draft or published status
- `g_published_at`: ISO date string - Scheduling date
- `g_post_access`: "public" | "members" | "paid"
- `g_featured`: boolean
- `g_tags`: array of strings
- `g_excerpt`: string
- `g_feature_image`: URL string
- `g_no_sync`: boolean - Disable sync for specific note
- `g_slug`: string - Custom URL slug

### Rule 12: Testing Requirements

**Before any release, test:**
- [ ] Fresh plugin installation
- [ ] Obsidian restart/reload
- [ ] Settings changes
- [ ] Connection to Ghost API
- [ ] Post creation in Ghost
- [ ] Post updates in Ghost
- [ ] Post scheduling
- [ ] Error handling (invalid credentials, network errors)
- [ ] Manual sync commands

## 📚 Reference Links

Keep these handy:

**Obsidian:**
- Docs: https://docs.obsidian.md
- Plugin API: https://docs.obsidian.md/Reference/TypeScript+API
- Sample Plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- Plugin Guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Community Plugins: https://github.com/obsidianmd/obsidian-releases

**Ghost:**
- Admin API: https://ghost.org/docs/admin-api/
- Content API: https://ghost.org/docs/content-api/
- Lexical Format: https://ghost.org/docs/admin-api/#lexical

**Development:**
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Conventional Commits: https://www.conventionalcommits.org/

---

## 🔄 When in Doubt

1. **Read the official documentation FIRST**
2. **Check TypeScript definitions for actual API signatures**
3. **Look at official examples and sample plugins**
4. **Ask the user for clarification if documentation is unclear**
5. **Test thoroughly before committing**

**Documentation comes FIRST, implementation comes SECOND.**

This prevents:
- Implementing non-standard solutions
- Missing built-in features
- Creating security vulnerabilities
- Breaking plugin guidelines
- Failing plugin review
- Wasting time on wrong approaches

---

**Remember: The goal is to build a reliable, secure, and maintainable plugin that follows Obsidian and Ghost best practices.**
