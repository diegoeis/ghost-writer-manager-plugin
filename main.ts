import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, normalizePath, debounce } from 'obsidian';
import { GhostWriterSettings, DEFAULT_SETTINGS } from './src/types';
import { GhostAPIClient } from './src/ghost/api-client';
import { generateNewPostTemplate, addGhostPropertiesToContent } from './src/templates';
import { SyncEngine } from './src/sync/sync-engine';
import { CalendarView, CALENDAR_VIEW_TYPE } from './src/views/calendar-view';

// ⚠️ IMPORTANT: Set to false before production build/release
// Development mode flag - enables auto-sync on file changes (2s debounce)
// Production mode - only syncs according to configured interval
const DEV_MODE = false;

export default class GhostWriterManagerPlugin extends Plugin {
	settings: GhostWriterSettings;
	ghostClient: GhostAPIClient;
	syncEngine: SyncEngine;
	private syncDebounced?: (file: TFile) => void;
	private statusBarItem: HTMLElement;
	private periodicSyncInterval: number;

	async onload() {
		await this.loadSettings();

		// Get API key from secure keychain
		const apiKey = this.loadApiKey();

		// Initialize Ghost API client
		this.ghostClient = new GhostAPIClient(
			this.settings.ghostUrl,
			apiKey,
			this.app
		);

		// Initialize sync engine
		this.syncEngine = new SyncEngine(this.app, this.settings, this.ghostClient);

		// Connect sync engine to status bar
		this.syncEngine.onStatusChange = (status, message) => {
			this.updateStatusBar(status, message);
		};

		// Development mode: Enable auto-sync on file changes with debounce
		if (DEV_MODE) {
			console.debug('[Ghost] DEV_MODE enabled: Auto-sync on file changes (2s debounce)');
			this.syncDebounced = debounce(
				async (file: TFile) => {
					if (this.syncEngine.shouldSyncFile(file)) {
						await this.syncEngine.syncFileToGhost(file);
					}
				},
				2000,
				true  // Reset timer on each change
			);

			// Watch for file modifications in dev mode
			this.registerEvent(
				this.app.vault.on('modify', (file) => {
					if (file instanceof TFile && this.syncDebounced) {
						this.syncDebounced(file);
					}
				})
			);
		}

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar('idle');

		// Setup periodic sync
		void this.setupPeriodicSync();

		// Register editorial calendar view
		this.registerView(
			CALENDAR_VIEW_TYPE,
			(leaf) => new CalendarView(leaf, this.settings, this.ghostClient)
		);

		// Ribbon icon to open editorial calendar
		this.addRibbonIcon('calendar-days', 'Open ghost editorial calendar', () => {
			void this.activateCalendarView();
		});

		// Add settings tab
		this.addSettingTab(new GhostWriterSettingTab(this.app, this));

		// Add command to open editorial calendar
		this.addCommand({
			id: 'open-editorial-calendar',
			name: 'Open editorial calendar',
			callback: () => { void this.activateCalendarView(); }
		});

		// Add command to manually sync
		this.addCommand({
			id: 'sync-ghost-posts',
			name: 'Sync with ghost',
			callback: async () => {
				await this.syncWithGhost();
			}
		});

		// Add command to test connection
		this.addCommand({
			id: 'test-ghost-connection',
			name: 'Test ghost connection',
			callback: async () => {
				await this.testGhostConnection();
			}
		});

		// Add command to create new Ghost post
		this.addCommand({
			id: 'create-new-ghost-post',
			name: 'Create new ghost post',
			callback: async () => {
				await this.createNewGhostPost();
			}
		});

		// Add command to add Ghost properties to current note
		this.addCommand({
			id: 'add-ghost-properties',
			name: 'Add ghost properties to current note',
			editorCallback: (editor, view) => {
				void this.addGhostPropertiesToCurrentNote(view.file);
			}
		});

		// Add command to sync current note
		this.addCommand({
			id: 'sync-current-note',
			name: 'Sync current note to ghost',
			editorCallback: (editor, view) => {
				if (view.file) {
					void this.syncEngine.syncFileToGhost(view.file);
				}
			}
		});

		// Add debug command to check file properties
		this.addCommand({
			id: 'debug-ghost-properties',
			name: 'Debug: show ghost properties in current note',
			editorCallback: (editor, view) => {
				if (!view.file) {
					new Notice('No active file');
					return;
				}

				const cache = this.app.metadataCache.getFileCache(view.file);
				if (!cache?.frontmatter) {
					new Notice('No frontmatter found');
					console.debug('[Ghost Debug] No frontmatter');
					return;
				}

				console.debug('[Ghost Debug] Frontmatter:', cache.frontmatter);
				console.debug('[Ghost Debug] YAML prefix:', this.settings.yamlPrefix);

				const ghostKeys = Object.keys(cache.frontmatter).filter(key =>
					key.startsWith(this.settings.yamlPrefix)
				);

				if (ghostKeys.length === 0) {
					new Notice(`No properties with prefix "${this.settings.yamlPrefix}" found`);
					console.debug('[Ghost Debug] Available keys:', Object.keys(cache.frontmatter));
				} else {
					new Notice(`Found ${ghostKeys.length} Ghost properties`);
					console.debug('[Ghost Debug] Ghost properties:', ghostKeys);
				}
			}
		});

		// Add debug command to test JWT token
		this.addCommand({
			id: 'debug-test-jwt',
			name: 'Debug: test JWT token generation',
			callback: async () => {
				const apiKey = this.loadApiKey();
				if (!this.settings.ghostUrl || !apiKey) {
					new Notice('Please configure ghost URL and admin API key first');
					return;
				}

				try {
					console.debug('[Ghost Debug] Testing JWT generation...');
					console.debug('[Ghost Debug] Ghost URL:', this.settings.ghostUrl);
					console.debug('[Ghost Debug] API key format:', apiKey.includes(':') ? 'Valid (contains :)' : 'Invalid (missing :)');

					// Test connection which will generate and use a JWT
					const result = await this.ghostClient.testConnection();
					if (result) {
						new Notice('JWT generation successful! Connection works.');
						console.debug('[Ghost Debug] JWT and connection working');
					} else {
						new Notice('Connection failed - check console for details');
						console.debug('[Ghost Debug] Connection failed');
					}
				} catch (error) {
					console.error('[Ghost Debug] Error:', error);
					new Notice(`Error: ${(error as Error).message}`);
				}
			}
		});

		// Add debug command to show file content and metadata
		this.addCommand({
			id: 'debug-show-file-data',
			name: 'Debug: show file content and metadata',
			editorCallback: (editor, view) => {
				const file = view.file;
				if (!file) {
					new Notice('No active file');
					return;
				}

				void this.app.vault.read(file).then((content) => {
					const cache = this.app.metadataCache.getFileCache(file);

					console.debug('[Ghost Debug] ===== FILE DEBUG =====');
					console.debug('[Ghost Debug] File path:', file.path);
					console.debug('[Ghost Debug] File content:', content);
					console.debug('[Ghost Debug] Frontmatter:', cache?.frontmatter);
					console.debug('[Ghost Debug] Content length:', content.length);
					console.debug('[Ghost Debug] ===== END DEBUG =====');

					new Notice('File data logged to console');
				}).catch((error: Error) => {
					console.error('[Ghost Debug] Error reading file:', error);
					new Notice(`Error reading file: ${error.message}`);
				});
			}
		});
	}

	async activateCalendarView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
		if (existing.length > 0) {
			void this.app.workspace.revealLeaf(existing[0]);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: CALENDAR_VIEW_TYPE, active: true });
		void this.app.workspace.revealLeaf(leaf);
	}

	onunload() {
		// Clear periodic sync interval
		if (this.periodicSyncInterval) {
			window.clearInterval(this.periodicSyncInterval);
		}
	}

	setupPeriodicSync() {
		// Clear existing interval if any
		if (this.periodicSyncInterval) {
			window.clearInterval(this.periodicSyncInterval);
		}

		// Only setup periodic sync if credentials are configured
		const apiKey = this.loadApiKey();
		if (!this.settings.ghostUrl || !apiKey) {
			return;
		}

		// Convert minutes to milliseconds
		const intervalMs = this.settings.syncInterval * 60 * 1000;

		console.debug(`[Ghost Sync] Setting up periodic sync every ${this.settings.syncInterval} minutes`);

		// Setup periodic sync
		this.periodicSyncInterval = window.setInterval(() => {
			console.debug('[Ghost Sync] Running periodic sync...');
			void this.syncEngine.syncAllFiles();
		}, intervalMs);
	}

	updateStatusBar(status: 'idle' | 'syncing' | 'success' | 'error', message?: string) {
		const icons = {
			idle: '⚪',
			syncing: '🔄',
			success: '✅',
			error: '❌'
		};

		const texts = {
			idle: 'Ghost: Ready',
			syncing: 'Ghost: Syncing...',
			success: 'Ghost: Synced',
			error: 'Ghost: Error'
		};

		this.statusBarItem.setText(`${icons[status]} ${message || texts[status]}`);

		// Auto-reset to idle after success/error
		if (status === 'success' || status === 'error') {
			setTimeout(() => this.updateStatusBar('idle'), 3000);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Restart periodic sync with new settings
		void this.setupPeriodicSync();
	}

	/**
	 * Load Ghost Admin API Key from Obsidian Secrets
	 */
	loadApiKey(): string {
		if (!this.settings.ghostApiKeySecretName) {
			console.warn('[Ghost] No secret name configured');
			return '';
		}

		console.debug('[Ghost] Attempting to load secret:', this.settings.ghostApiKeySecretName);

		try {
			// Use the correct API: app.secretStorage.getSecret()
			if (!this.app.secretStorage) {
				console.error('[Ghost] app.secretStorage is not available. Obsidian version may be too old.');
				new Notice('Obsidian secrets API not available. Please update Obsidian to the latest version.');
				return '';
			}

			const apiKey = this.app.secretStorage.getSecret(this.settings.ghostApiKeySecretName);

			if (!apiKey) {
				console.error('[Ghost] Secret not found or empty:', this.settings.ghostApiKeySecretName);
				new Notice(`Secret "${this.settings.ghostApiKeySecretName}" not found in Keychain. Please create it in Settings → Keychain.`);
				return '';
			}

			console.debug('[Ghost] Successfully loaded secret (length:', apiKey.length, ')');
			return apiKey;
		} catch (error) {
			console.error('[Ghost] Error loading API key from secrets:', error);
			new Notice(`Error loading secret: ${(error as Error).message}`);
			return '';
		}
	}

	async testGhostConnection(): Promise<void> {
		const apiKey = this.loadApiKey();
		if (!this.settings.ghostUrl || !apiKey) {
			new Notice('Please configure ghost URL and admin API key first');
			return;
		}

		try {
			const isValid = await this.ghostClient.testConnection();
			if (isValid) {
				new Notice('Successfully connected to ghost!');
			} else {
				new Notice('Failed to connect to ghost. Please check your credentials.');
			}
		} catch (error) {
			console.error('Ghost connection test failed:', error);
			new Notice(`Connection failed: ${(error as Error).message}`);
		}
	}

	async syncWithGhost(): Promise<void> {
		const apiKey = this.loadApiKey();
		if (!this.settings.ghostUrl || !apiKey) {
			new Notice('Please configure ghost URL and admin API key first');
			return;
		}

		try {
			await this.syncEngine.syncAllFiles();
		} catch (error) {
			console.error('Sync failed:', error);
			new Notice(`Sync failed: ${(error as Error).message}`);
		}
	}

	async createNewGhostPost(): Promise<void> {
		try {
			// Ensure sync folder exists
			const syncFolderPath = normalizePath(this.settings.syncFolder);
			const syncFolder = this.app.vault.getAbstractFileByPath(syncFolderPath);

			if (!syncFolder) {
				await this.app.vault.createFolder(syncFolderPath);
			}

			// Generate unique filename
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const fileName = `ghost-post-${timestamp}.md`;
			const filePath = normalizePath(`${syncFolderPath}/${fileName}`);

			// Generate content with Ghost properties
			const content = generateNewPostTemplate(this.settings);

			// Create the file
			const file = await this.app.vault.create(filePath, content);

			// Open the file
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);

			new Notice('New ghost post created!');
		} catch (error) {
			console.error('Error creating new Ghost post:', error);
			new Notice(`Failed to create new post: ${(error as Error).message}`);
		}
	}

	async addGhostPropertiesToCurrentNote(file: TFile | null): Promise<void> {
		if (!file) {
			new Notice('No active file');
			return;
		}

		try {
			// Read current content
			const content = await this.app.vault.read(file);

			// Add Ghost properties (will add only missing ones)
			const newContent = addGhostPropertiesToContent(content, this.settings);

			// Check if anything was added
			if (newContent === content) {
				new Notice('This note already has all ghost properties');
				return;
			}

			// Write back to file
			await this.app.vault.modify(file, newContent);

			new Notice('Ghost properties added! This note will now sync with ghost.');

			// Move file to sync folder if not already there
			const syncFolderPath = normalizePath(this.settings.syncFolder);
			const currentFolder = file.parent?.path || '';

			if (currentFolder !== syncFolderPath) {
				// Ensure sync folder exists
				const syncFolder = this.app.vault.getAbstractFileByPath(syncFolderPath);
				if (!syncFolder) {
					await this.app.vault.createFolder(syncFolderPath);
				}

				// Move file
				const newPath = normalizePath(`${syncFolderPath}/${file.name}`);
				await this.app.fileManager.renameFile(file, newPath);

				new Notice(`File moved to sync folder: ${this.settings.syncFolder}`);
			}
		} catch (error) {
			console.error('Error adding Ghost properties:', error);
			new Notice(`Failed to add Ghost properties: ${(error as Error).message}`);
		}
	}
}

class GhostWriterSettingTab extends PluginSettingTab {
	plugin: GhostWriterManagerPlugin;

	constructor(app: App, plugin: GhostWriterManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Ghost configuration heading
		new Setting(containerEl)
			.setHeading()
			.setName('Ghost configuration');

		new Setting(containerEl)
			.setName('Ghost URL')
			.setDesc('Your ghost site URL (e.g., https://yourblog.ghost.io)')
			.addText(text => text
				.setPlaceholder('https://yourblog.ghost.io')
				.setValue(this.plugin.settings.ghostUrl)
				.onChange(async (value) => {
					this.plugin.settings.ghostUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Admin api key secret name')
			.setDesc('Name of the secret in settings > keychain that contains your ghost admin api key (format: id:secret)')
			.addText(text => text
				.setPlaceholder('ghost-api-key')
				.setValue(this.plugin.settings.ghostApiKeySecretName)
				.onChange(async (value) => {
					this.plugin.settings.ghostApiKeySecretName = value.trim();
					await this.plugin.saveSettings();
				}))
			.then((setting) => {
				// Add a button to open Keychain settings
				setting.addExtraButton((button) => {
					button
						.setIcon('key')
						.setTooltip('Open keychain settings')
						.onClick(() => {
							// @ts-ignore - Open settings tab
							this.app.setting.open();
							// @ts-ignore - Navigate to Keychain tab
							this.app.setting.openTabById('keychain');
						});
					button.extraSettingsEl.setAttribute('aria-label', 'Open keychain settings');
				});
			});

		new Setting(containerEl)
			.setName('Test connection')
			.setDesc('Verify that your ghost credentials are working')
			.addButton(button => button
				.setButtonText('Test connection')
				.setCta()
				.onClick(async () => {
					await this.plugin.testGhostConnection();
				}));

		// Sync settings heading
		new Setting(containerEl)
			.setHeading()
			.setName('Sync settings');

		new Setting(containerEl)
			.setName('Sync folder')
			.setDesc('Folder in your vault where ghost posts will be stored')
			.addText(text => text
				.setPlaceholder('Ghost posts')
				.setValue(this.plugin.settings.syncFolder)
				.onChange(async (value) => {
					this.plugin.settings.syncFolder = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Sync interval')
			.setDesc('How often to check for changes (in minutes)')
			.addText(text => text
				.setPlaceholder('15')
				.setValue(String(this.plugin.settings.syncInterval))
				.onChange(async (value) => {
					const interval = parseInt(value);
					if (!isNaN(interval) && interval > 0) {
						this.plugin.settings.syncInterval = interval;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('YAML prefix')
			.setDesc('Prefix for ghost metadata in frontmatter (e.g., "ghost_" will create ghost_status, ghost_tags)')
			.addText(text => text
				.setPlaceholder('Eg: ghost_')
				.setValue(this.plugin.settings.yamlPrefix)
				.onChange(async (value) => {
					this.plugin.settings.yamlPrefix = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show sync notifications')
			.setDesc('Show notification popups when syncing files (status bar always shows sync status)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showSyncNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showSyncNotifications = value;
					await this.plugin.saveSettings();
				}));
	}
}
