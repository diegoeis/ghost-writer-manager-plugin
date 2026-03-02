import { App, Modal, Setting, Notice } from 'obsidian';
import { GhostAPIClient } from '../ghost/api-client';
import { GhostPost, GhostWriterSettings } from '../types';

/**
 * Extract Ghost post ID from an editor URL
 * Supports formats like:
 *   https://example.com/ghost/#/editor/post/6995c2b518d3e00001e1ca21
 *   https://example.com/ghost/#/editor/post/6995c2b518d3e00001e1ca21/
 */
export function extractPostIdFromUrl(url: string): string | null {
	const match = url.match(/\/editor\/post\/([a-f0-9]+)\/?$/i);
	return match ? match[1] : null;
}

/**
 * Build a Ghost editor URL from Ghost site URL and post ID
 */
export function buildGhostEditorUrl(ghostSiteUrl: string, postId: string): string {
	const base = ghostSiteUrl.replace(/\/$/, '');
	return `${base}/ghost/#/editor/post/${postId}`;
}

type OnImportCallback = (post: GhostPost, ghostUrl: string) => Promise<void>;

/**
 * Modal for importing an existing Ghost post as a new Obsidian note
 */
export class ImportFromGhostModal extends Modal {
	private ghostClient: GhostAPIClient;
	private settings: GhostWriterSettings;
	private onImport: OnImportCallback;
	private urlInput = '';

	constructor(
		app: App,
		ghostClient: GhostAPIClient,
		settings: GhostWriterSettings,
		onImport: OnImportCallback
	) {
		super(app);
		this.ghostClient = ghostClient;
		this.settings = settings;
		this.onImport = onImport;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		this.titleEl.setText('Import post from Ghost');

		contentEl.createEl('p', {
			text: 'Paste the Ghost editor URL of the post you want to import.',
			cls: 'ghost-modal-description'
		});

		new Setting(contentEl)
			.setName('Ghost editor URL')
			.setDesc('Example: https://yourblog.com/ghost/#/editor/post/6995c2b518d3e00001e1ca21')
			.addText(text => {
				text
					.setPlaceholder('https://yourblog.com/ghost/#/editor/post/...')
					.onChange(value => { this.urlInput = value.trim(); });

				text.inputEl.setAttribute('aria-label', 'Ghost editor URL');
				text.inputEl.style.width = '100%';

				// Allow submitting with Enter
				text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						void this.handleImport();
					}
				});
			});

		const buttonSetting = new Setting(contentEl)
			.addButton(btn => {
				btn
					.setButtonText('Import post')
					.setCta()
					.onClick(() => { void this.handleImport(); });
				btn.buttonEl.setAttribute('aria-label', 'Import post from Ghost');
			})
			.addButton(btn => {
				btn
					.setButtonText('Cancel')
					.onClick(() => { this.close(); });
				btn.buttonEl.setAttribute('aria-label', 'Cancel import');
			});

		buttonSetting.settingEl.style.borderTop = 'none';
		buttonSetting.settingEl.style.paddingTop = '0';
	}

	private async handleImport(): Promise<void> {
		if (!this.urlInput) {
			new Notice('Please enter a Ghost editor URL');
			return;
		}

		const postId = extractPostIdFromUrl(this.urlInput);
		if (!postId) {
			new Notice('Invalid Ghost editor URL. Make sure it contains /editor/post/{id}');
			return;
		}

		const ghostUrl = buildGhostEditorUrl(this.settings.ghostUrl, postId);

		try {
			new Notice('Fetching post from Ghost...');
			const post = await this.ghostClient.getPost(postId);
			this.close();
			await this.onImport(post, ghostUrl);
		} catch (error) {
			new Notice(`Failed to fetch post: ${(error as Error).message}`);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
