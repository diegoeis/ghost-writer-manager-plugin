import { App, Plugin, PluginSettingTab, Setting, Notice, TFile, TFolder, normalizePath } from 'obsidian';
import { GhostWriterSettings, DEFAULT_SETTINGS } from './src/types';
import { GhostAPIClient } from './src/ghost/api-client';
import { generateNewPostTemplate, addGhostPropertiesToContent, hasGhostProperties } from './src/templates';
import { SyncEngine } from './src/sync/sync-engine';

export default class GhostWriterManagerPlugin extends Plugin {
	settings: GhostWriterSettings;
	ghostClient: GhostAPIClient;
	syncEngine: SyncEngine;
	private statusBarItem: HTMLElement;
	private periodicSyncInterval: number;

	async onload() {
		await this.loadSettings();

		// Get API key from secure keychain
		const apiKey = await this.loadApiKey();

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

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar('idle');

		// Setup periodic sync
		this.setupPeriodicSync();

		// Add settings tab
		this.addSettingTab(new GhostWriterSettingTab(this.app, this));

		// Add command to manually sync
		this.addCommand({
			id: 'sync-ghost-posts',
			name: 'Sync with Ghost',
			callback: async () => {
				await this.syncWithGhost();
			}
		});

		// Add command to test connection
		this.addCommand({
			id: 'test-ghost-connection',
			name: 'Test Ghost connection',
			callback: async () => {
				await this.testGhostConnection();
			}
		});

		// Add command to create new Ghost post
		this.addCommand({
			id: 'create-new-ghost-post',
			name: 'Create new Ghost post',
			callback: async () => {
				await this.createNewGhostPost();
			}
		});

		// Add command to add Ghost properties to current note
		this.addCommand({
			id: 'add-ghost-properties',
			name: 'Add Ghost properties to current note',
			editorCallback: async (editor, view) => {
				await this.addGhostPropertiesToCurrentNote(view.file);
			}
		});

		// Add command to sync current note
		this.addCommand({
			id: 'sync-current-note',
			name: 'Sync current note to Ghost',
			editorCallback: async (editor, view) => {
				if (view.file) {
					await this.syncEngine.syncFileToGhost(view.file);
				}
			}
		});

		// Add debug command to check file properties
		this.addCommand({
			id: 'debug-ghost-properties',
			name: 'Debug: Show Ghost properties in current note',
			editorCallback: async (editor, view) => {
				if (!view.file) {
					new Notice('No active file');
					return;
				}

				const cache = this.app.metadataCache.getFileCache(view.file);
				if (!cache?.frontmatter) {
					new Notice('No frontmatter found');
					console.log('[Ghost Debug] No frontmatter');
					return;
				}

				console.log('[Ghost Debug] Frontmatter:', cache.frontmatter);
				console.log('[Ghost Debug] YAML Prefix:', this.settings.yamlPrefix);

				const ghostKeys = Object.keys(cache.frontmatter).filter(key =>
					key.startsWith(this.settings.yamlPrefix)
				);

				if (ghostKeys.length === 0) {
					new Notice(`No properties with prefix "${this.settings.yamlPrefix}" found`);
					console.log('[Ghost Debug] Available keys:', Object.keys(cache.frontmatter));
				} else {
					new Notice(`Found ${ghostKeys.length} Ghost properties`);
					console.log('[Ghost Debug] Ghost properties:', ghostKeys);
				}
			}
		});

		// Add debug command to test JWT token
		this.addCommand({
			id: 'debug-test-jwt',
			name: 'Debug: Test JWT token generation',
			callback: async () => {
				const apiKey = await this.loadApiKey();
				if (!this.settings.ghostUrl || !apiKey) {
					new Notice('Please configure Ghost URL and Admin API Key first');
					return;
				}

				try {
					console.log('[Ghost Debug] Testing JWT generation...');
					console.log('[Ghost Debug] Ghost URL:', this.settings.ghostUrl);
					console.log('[Ghost Debug] API Key format:', apiKey.includes(':') ? 'Valid (contains :)' : 'Invalid (missing :)');

					// Test connection which will generate and use a JWT
					const result = await this.ghostClient.testConnection();
					if (result) {
						new Notice('✅ JWT generation successful! Connection works.');
						console.log('[Ghost Debug] ✅ JWT and connection working');
					} else {
						new Notice('❌ Connection failed - check console for details');
						console.log('[Ghost Debug] ❌ Connection failed');
					}
				} catch (error) {
					console.error('[Ghost Debug] Error:', error);
					new Notice(`❌ Error: ${error.message}`);
				}
			}
		});

		// Add debug command to show file content and metadata
		this.addCommand({
			id: 'debug-show-file-data',
			name: 'Debug: Show file content and metadata',
			editorCallback: async (editor, view) => {
				if (!view.file) {
					new Notice('No active file');
					return;
				}

				const content = await this.app.vault.read(view.file);
				const cache = this.app.metadataCache.getFileCache(view.file);

				console.log('[Ghost Debug] ===== FILE DEBUG =====');
				console.log('[Ghost Debug] File path:', view.file.path);
				console.log('[Ghost Debug] File content:', content);
				console.log('[Ghost Debug] Frontmatter:', cache?.frontmatter);
				console.log('[Ghost Debug] Content length:', content.length);
				console.log('[Ghost Debug] ===== END DEBUG =====');

				new Notice('File data logged to console');
			}
		});
	}

	onunload() {
		// Clear periodic sync interval
		if (this.periodicSyncInterval) {
			window.clearInterval(this.periodicSyncInterval);
		}
	}

	async setupPeriodicSync() {
		// Clear existing interval if any
		if (this.periodicSyncInterval) {
			window.clearInterval(this.periodicSyncInterval);
		}

		// Only setup periodic sync if credentials are configured
		const apiKey = await this.loadApiKey();
		if (!this.settings.ghostUrl || !apiKey) {
			return;
		}

		// Convert minutes to milliseconds
		const intervalMs = this.settings.syncInterval * 60 * 1000;

		console.log(`[Ghost Sync] Setting up periodic sync every ${this.settings.syncInterval} minutes`);

		// Setup periodic sync
		this.periodicSyncInterval = window.setInterval(async () => {
			console.log('[Ghost Sync] Running periodic sync...');
			await this.syncEngine.syncAllFiles();
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
		this.setupPeriodicSync();
	}

	/**
	 * Load Ghost Admin API Key from Obsidian Secrets
	 */
	async loadApiKey(): Promise<string> {
		if (!this.settings.ghostApiKeySecretName) {
			console.warn('[Ghost] No secret name configured');
			return '';
		}

		console.log('[Ghost] Attempting to load secret:', this.settings.ghostApiKeySecretName);

		try {
			// Use the correct API: app.secretStorage.getSecret()
			if (!this.app.secretStorage) {
				console.error('[Ghost] app.secretStorage is not available. Obsidian version may be too old.');
				new Notice('Obsidian Secrets API not available. Please update Obsidian to the latest version.');
				return '';
			}

			const apiKey = this.app.secretStorage.getSecret(this.settings.ghostApiKeySecretName);

			if (!apiKey) {
				console.error('[Ghost] Secret not found or empty:', this.settings.ghostApiKeySecretName);
				new Notice(`Secret "${this.settings.ghostApiKeySecretName}" not found in Keychain. Please create it in Settings → Keychain.`);
				return '';
			}

			console.log('[Ghost] Successfully loaded secret (length:', apiKey.length, ')');
			return apiKey;
		} catch (error) {
			console.error('[Ghost] Error loading API key from secrets:', error);
			new Notice(`Error loading secret: ${error.message}`);
			return '';
		}
	}

	async testGhostConnection(): Promise<void> {
		const apiKey = await this.loadApiKey();
		if (!this.settings.ghostUrl || !apiKey) {
			new Notice('Please configure Ghost URL and Admin API Key first');
			return;
		}

		try {
			const isValid = await this.ghostClient.testConnection();
			if (isValid) {
				new Notice('Successfully connected to Ghost!');
			} else {
				new Notice('Failed to connect to Ghost. Please check your credentials.');
			}
		} catch (error) {
			console.error('Ghost connection test failed:', error);
			new Notice(`Connection failed: ${error.message}`);
		}
	}

	async syncWithGhost(): Promise<void> {
		const apiKey = await this.loadApiKey();
		if (!this.settings.ghostUrl || !apiKey) {
			new Notice('Please configure Ghost URL and Admin API Key first');
			return;
		}

		try {
			await this.syncEngine.syncAllFiles();
		} catch (error) {
			console.error('Sync failed:', error);
			new Notice(`Sync failed: ${error.message}`);
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

			new Notice('New Ghost post created!');
		} catch (error) {
			console.error('Error creating new Ghost post:', error);
			new Notice(`Failed to create new post: ${error.message}`);
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
				new Notice('This note already has all Ghost properties');
				return;
			}

			// Write back to file
			await this.app.vault.modify(file, newContent);

			new Notice('Ghost properties added! This note will now sync with Ghost.');

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
			new Notice(`Failed to add Ghost properties: ${error.message}`);
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

		// Ghost Configuration heading
		new Setting(containerEl)
			.setHeading()
			.setName('Ghost configuration');

		new Setting(containerEl)
			.setName('Ghost URL')
			.setDesc('Your Ghost site URL (e.g., https://yourblog.ghost.io)')
			.addText(text => text
				.setPlaceholder('https://yourblog.ghost.io')
				.setValue(this.plugin.settings.ghostUrl)
				.onChange(async (value) => {
					this.plugin.settings.ghostUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Admin API key secret name')
			.setDesc('Name of the secret in Settings → Keychain that contains your Ghost Admin API key (format: id:secret)')
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
						.setTooltip('Open Keychain settings')
						.onClick(() => {
							// @ts-ignore - Open settings tab
							this.app.setting.open();
							// @ts-ignore - Navigate to Keychain tab
							this.app.setting.openTabById('keychain');
						});
				});
			});

		new Setting(containerEl)
			.setName('Test connection')
			.setDesc('Verify that your Ghost credentials are working')
			.addButton(button => button
				.setButtonText('Test connection')
				.setCta()
				.onClick(async () => {
					await this.plugin.testGhostConnection();
				}));

		// Sync Settings heading
		new Setting(containerEl)
			.setHeading()
			.setName('Sync settings');

		new Setting(containerEl)
			.setName('Sync folder')
			.setDesc('Folder in your vault where Ghost posts will be stored')
			.addText(text => text
				.setPlaceholder('Ghost Posts')
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
			.setDesc('Prefix for Ghost metadata in YAML frontmatter (e.g., "ghost_" will create ghost_status, ghost_tags)')
			.addText(text => text
				.setPlaceholder('ghost_')
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
