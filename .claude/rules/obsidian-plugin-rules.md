# Obsidian Plugin Development Rules

This file contains the essential rules and guidelines for developing the Ghost Writer Manager Plugin for Obsidian.

## Critical Plugin Rules

### Submission & Naming Requirements (Validation Bot Enforced)

1. **Plugin ID Rules:**
   - Must NOT contain "obsidian" anywhere
   - Must NOT end with "plugin"
   - Must be lowercase with hyphens only
   - ✅ Good: `ghost-writer-manager`
   - ❌ Bad: `obsidian-ghost-writer`, `ghost-writer-plugin`

2. **Plugin Name Rules:**
   - Must NOT contain "Obsidian" anywhere
   - Must NOT end with "Plugin"
   - Must NOT start with "Obsi" or end with "dian"
   - ✅ Good: `Ghost Writer Manager`
   - ❌ Bad: `Obsidian Ghost Writer`, `Ghost Writer Plugin`

3. **Description Rules:**
   - Must NOT contain: "Obsidian", "This plugin", "This is", "A plugin"
   - Must end with proper punctuation (`.?!)`)
   - Must be clear and concise
   - ✅ Good: `Bidirectional synchronization between your vault and Ghost CMS.`
   - ❌ Bad: `This plugin syncs Obsidian with Ghost CMS`

### Memory Management & Lifecycle

4. **Use `registerEvent()` for automatic cleanup**
   ```typescript
   // ✅ CORRECT - Auto cleanup
   this.registerEvent(this.app.vault.on('modify', this.handleFileChange));

   // ❌ WRONG - Manual cleanup required
   this.app.vault.on('modify', this.handleFileChange);
   ```

5. **Don't store view references in plugin class**
   ```typescript
   // ❌ WRONG - Memory leak
   class MyPlugin extends Plugin {
     view: MyView;
   }

   // ✅ CORRECT - Use getViewState() or leaves
   const view = this.app.workspace.getLeavesOfType('my-view')[0]?.view;
   ```

6. **Clean up in onunload()**
   ```typescript
   onunload() {
     // Clear intervals
     if (this.syncInterval) {
       window.clearInterval(this.syncInterval);
     }
     // Remove event listeners
     // Clear references
   }
   ```

### Type Safety

7. **Use `instanceof` instead of type casting**
   ```typescript
   // ✅ CORRECT - Type safe
   if (file instanceof TFile) {
     await this.app.vault.read(file);
   }

   // ❌ WRONG - Unsafe
   await this.app.vault.read(file as TFile);
   ```

8. **Avoid `any` types - use proper TypeScript types**
   ```typescript
   // ✅ CORRECT
   interface GhostPost {
     id: string;
     title: string;
     status: 'draft' | 'published';
   }

   // ❌ WRONG
   let post: any;
   ```

### API Best Practices

9. **Use `requestUrl()` instead of `fetch()`**
   ```typescript
   // ✅ CORRECT - Bypasses CORS
   const response = await requestUrl({
     url: 'https://ghost-api.com/posts',
     method: 'GET',
     headers: { 'Authorization': `Ghost ${token}` }
   });

   // ❌ WRONG - CORS issues
   const response = await fetch('https://ghost-api.com/posts');
   ```

10. **Use Editor API for active file edits**
    ```typescript
    // ✅ CORRECT - Preserves cursor
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    if (editor) {
      editor.replaceRange(text, from, to);
    }

    // ❌ WRONG - Loses cursor position
    await this.app.vault.modify(file, newContent);
    ```

11. **Use `Vault.process()` for background modifications**
    ```typescript
    // ✅ CORRECT - Safe for background edits
    await this.app.vault.process(file, (content) => {
      return content + '\n\n' + newSection;
    });
    ```

12. **Use `normalizePath()` for user-provided paths**
    ```typescript
    // ✅ CORRECT - Cross-platform
    const normalizedPath = normalizePath(userPath);

    // ❌ WRONG - Windows issues
    const path = userPath;
    ```

13. **Use `Platform` API for OS detection**
    ```typescript
    // ✅ CORRECT
    import { Platform } from 'obsidian';
    if (Platform.isMobile) { }

    // ❌ WRONG
    if (navigator.userAgent.includes('Mobile')) { }
    ```

### UI/UX Standards

14. **Use sentence case for all UI text**
    - ✅ Good: "Advanced settings", "Sync folder"
    - ❌ Bad: "Advanced Settings", "Sync Folder"

15. **No "command" in command names or IDs**
    ```typescript
    // ✅ CORRECT
    { id: 'sync-ghost', name: 'Sync with Ghost' }

    // ❌ WRONG
    { id: 'sync-ghost-command', name: 'Sync with Ghost command' }
    ```

16. **No plugin ID in command IDs** (Obsidian auto-namespaces)
    ```typescript
    // ✅ CORRECT
    { id: 'sync', name: 'Sync with Ghost' }

    // ❌ WRONG
    { id: 'ghost-writer-sync', name: 'Sync with Ghost' }
    ```

17. **No default hotkeys** (avoid conflicts)
    ```typescript
    // ✅ CORRECT
    this.addCommand({
      id: 'sync',
      name: 'Sync with Ghost',
      // No hotkeys property
    });

    // ❌ WRONG
    hotkeys: [{ modifiers: ["Ctrl"], key: "S" }]
    ```

18. **Use `.setHeading()` for settings headings**
    ```typescript
    // ✅ CORRECT
    containerEl.createEl('h2', { text: 'Settings' });
    // or
    new Setting(containerEl).setHeading().setName('Advanced');

    // ❌ WRONG
    containerEl.innerHTML = '<h2>Settings</h2>';
    ```

### Styling Rules

19. **Use Obsidian CSS variables** (respects themes)
    ```css
    /* ✅ CORRECT */
    .ghost-calendar {
      background-color: var(--background-primary);
      color: var(--text-normal);
      border: 1px solid var(--background-modifier-border);
    }

    /* ❌ WRONG */
    .ghost-calendar {
      background-color: #ffffff;
      color: #000000;
    }
    ```

20. **Scope CSS to plugin containers**
    ```css
    /* ✅ CORRECT */
    .ghost-writer-calendar .calendar-day { }

    /* ❌ WRONG */
    .calendar-day { }
    ```

### Accessibility (MANDATORY)

21. **Make all interactive elements keyboard accessible**
    - All clickable elements must be tabbable
    - Implement proper keyboard navigation
    - Support Enter/Space for activation

22. **Provide ARIA labels for icon buttons**
    ```typescript
    // ✅ CORRECT
    button.setAttribute('aria-label', 'Sync with Ghost');

    // ❌ WRONG - No label
    button.setIcon('sync');
    ```

23. **Define clear focus indicators**
    ```css
    /* ✅ CORRECT */
    button:focus-visible {
      outline: 2px solid var(--interactive-accent);
      outline-offset: 2px;
    }
    ```

### Security & Compatibility

24. **Don't use `innerHTML` or `outerHTML`** (XSS risk)
    ```typescript
    // ✅ CORRECT
    element.createEl('div', { text: userInput });

    // ❌ WRONG
    element.innerHTML = userInput;
    ```

25. **Avoid regex lookbehind** (iOS < 16.4 incompatible)
    ```typescript
    // ❌ WRONG
    /(?<=\w+)/

    // ✅ CORRECT - Use alternative approach
    ```

26. **Store secrets in Obsidian Keychain**
    ```typescript
    // ✅ CORRECT
    await (this.app as any).saveLocalStorage('ghost-api-key', apiKey);
    const key = await (this.app as any).loadLocalStorage('ghost-api-key');

    // ❌ WRONG - Plain text in data.json
    ```

### Code Quality

27. **Remove all sample/template code**
    - No `MyPlugin`, `SampleModal`, `SampleSettingTab`
    - No example commands or settings
    - No template comments

28. **No console.log in production code**
    ```typescript
    // ✅ CORRECT - Use for development only
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug info');
    }

    // ❌ WRONG
    console.log('Syncing...');
    ```

## Project-Specific Guidelines

### Ghost Writer Manager Plugin Architecture

1. **Use Secret Storage for Ghost API credentials**
   - Store Admin API key in Obsidian Keychain
   - Never save in plain text in settings

2. **Implement proper sync engine**
   - Use debounced sync (2s delay) for auto-sync
   - Implement periodic sync with configurable interval
   - Handle conflict resolution intelligently

3. **YAML Metadata Management**
   - Use configurable prefix (default: `g_`)
   - Support all Ghost post properties
   - Validate YAML before sync

4. **Content Conversion**
   - Bidirectional Markdown ↔ Lexical/HTML
   - Preserve formatting and embedded content
   - Handle Obsidian-specific syntax (wikilinks, embeds)

5. **Editorial Calendar View**
   - Implement as ItemView in sidebar
   - Group by status and publication date
   - Provide direct links to vault notes and Ghost Admin

## Resources

- [Obsidian Plugin Docs](https://docs.obsidian.md/)
- [Obsidian API Docs](https://docs.obsidian.md/Reference/TypeScript+API/)
- [Obsidian Secret Storage](https://docs.obsidian.md/plugins/guides/secret-storage)
- [Ghost Admin API](https://docs.ghost.org/admin-api/)
- `.claude/skills/obsidian/SKILL.md` - Complete reference guide
