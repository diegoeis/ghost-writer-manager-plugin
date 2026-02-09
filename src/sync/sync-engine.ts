import { App, TFile, Notice } from 'obsidian';
import { GhostAPIClient } from '../ghost/api-client';
import { GhostWriterSettings } from '../types';
import { parseGhostMetadata, extractContent, updateFrontmatterWithGhostId } from '../frontmatter-parser';
import { markdownToHtml, extractTitle, generateSlug } from '../converters/markdown-to-html';
import { markdownToLexical } from '../converters/markdown-to-lexical';

/**
 * Sync Engine - Handles synchronization from Obsidian to Ghost
 */
export class SyncEngine {
	private app: App;
	private settings: GhostWriterSettings;
	private ghostClient: GhostAPIClient;
	public onStatusChange?: (status: 'idle' | 'syncing' | 'success' | 'error', message?: string) => void;

	constructor(app: App, settings: GhostWriterSettings, ghostClient: GhostAPIClient) {
		this.app = app;
		this.settings = settings;
		this.ghostClient = ghostClient;
	}

	/**
	 * Sync a single file to Ghost
	 */
	async syncFileToGhost(file: TFile): Promise<boolean> {
		try {
			// Read file content
			const content = await this.app.vault.read(file);

			// Parse frontmatter - need to wait for cache to be ready
			let cache = this.app.metadataCache.getFileCache(file);

			// If cache is not ready, wait a bit
			if (!cache) {
				await new Promise(resolve => setTimeout(resolve, 100));
				cache = this.app.metadataCache.getFileCache(file);
			}

			if (!cache?.frontmatter) {
				// Silently skip files without frontmatter (not an error)
				return false;
			}

			// Extract Ghost metadata
			const metadata = parseGhostMetadata(cache.frontmatter, this.settings.yamlPrefix);
			if (!metadata) {
				// Silently skip files without Ghost properties (not an error)
				return false;
			}

			// Check if sync is disabled
			if (metadata.no_sync) {
				return false;
			}

			// Log that we're starting sync
			console.log(`[Ghost Sync] Starting sync for ${file.path}`);
			this.onStatusChange?.('syncing', 'Syncing...');

			// Extract markdown content (without frontmatter)
			const markdownContent = extractContent(content);
			console.log('[Ghost Sync] Markdown content length:', markdownContent.length);
			console.log('[Ghost Sync] Markdown preview:', markdownContent.substring(0, 200));

			// Convert to Lexical format (Ghost's editor format)
			const lexical = markdownToLexical(markdownContent);
			console.log('[Ghost Sync] Lexical length:', lexical.length);
			console.log('[Ghost Sync] Lexical preview:', lexical.substring(0, 200));

			// Extract title
			const title = extractTitle(markdownContent);
			console.log('[Ghost Sync] Extracted title:', title);

			// Generate or use existing slug
			const slug = metadata.slug || generateSlug(title);
			console.log('[Ghost Sync] Slug:', slug);

			// Determine status based on g_published and g_published_at
			let status: 'draft' | 'published' | 'scheduled' = 'draft';
			let publishedAt: string | undefined;

			if (metadata.published) {
				// Check if there's a published_at date
				if (metadata.published_at) {
					const scheduledDate = new Date(metadata.published_at);
					const now = new Date();

					// If date is in the future, schedule it
					if (scheduledDate > now) {
						status = 'scheduled';
						publishedAt = scheduledDate.toISOString();
						console.log('[Ghost Sync] Scheduling post for:', publishedAt);
					} else {
						// Date is in the past or now, publish immediately
						status = 'published';
						publishedAt = scheduledDate.toISOString();
						console.log('[Ghost Sync] Publishing post with custom date:', publishedAt);
					}
				} else {
					// No date specified, publish now
					status = 'published';
					console.log('[Ghost Sync] Publishing post immediately');
				}
			} else {
				// g_published is false, keep as draft regardless of date
				console.log('[Ghost Sync] Keeping post as draft (g_published: false)');
			}

			console.log('[Ghost Sync] Final status:', status);

			// Prepare Ghost post data
			const postData: Record<string, unknown> = {
				title,
				lexical,
				status,
				visibility: metadata.post_access,
				featured: metadata.featured,
				slug
			};

			// Add published_at if scheduling or custom publish date
			if (publishedAt) {
				postData.published_at = publishedAt;
			}

			// Add optional fields
			if (metadata.excerpt) {
				postData.excerpt = metadata.excerpt;
			}
			if (metadata.feature_image) {
				postData.feature_image = metadata.feature_image;
			}
			if (metadata.tags.length > 0) {
				postData.tags = metadata.tags.map(name => ({ name }));
			}

			// Debug logging
			console.log('[Ghost Sync] Post data to send:', {
				title,
				lexical: lexical.substring(0, 200) + '...',
				lexicalLength: lexical.length,
				excerpt: metadata.excerpt,
				tags: metadata.tags,
				status,
				published_at: publishedAt,
				visibility: metadata.post_access,
				featured: metadata.featured,
				slug
			});

			// Check if this is an update or create
			let ghostPost;
			if (metadata.ghost_id) {
				// Update existing post
				console.log(`[Ghost Sync] Updating post ${metadata.ghost_id}`);
				ghostPost = await this.ghostClient.updatePost(metadata.ghost_id, postData);
				if (this.settings.showSyncNotifications) {
					new Notice(`✅ Updated in Ghost: ${title}`);
				}
				console.log(`[Ghost Sync] ✅ Updated: ${title}`);
				console.log('[Ghost Sync] Ghost returned post:', {
					id: ghostPost.id,
					title: ghostPost.title,
					htmlLength: ghostPost.html?.length || 0,
					lexicalLength: ghostPost.lexical?.length || 0
				});
			} else {
				// Create new post
				console.log(`[Ghost Sync] Creating new post`);
				ghostPost = await this.ghostClient.createPost(postData);
				if (this.settings.showSyncNotifications) {
					new Notice(`✅ Created in Ghost: ${title}`);
				}
				console.log(`[Ghost Sync] ✅ Created: ${title}`, ghostPost);

				// IMPORTANT: Don't trigger another sync by modifying the file immediately
				// Wait a bit to avoid the debounced sync from being called again
				setTimeout(async () => {
					// Update file with Ghost ID and slug
					const updatedContent = updateFrontmatterWithGhostId(
						content,
						ghostPost.id,
						ghostPost.slug,
						this.settings.yamlPrefix
					);
					await this.app.vault.modify(file, updatedContent);
					console.log('[Ghost Sync] Frontmatter updated with Ghost ID');
				}, 3000); // Wait 3 seconds (longer than debounce timeout)
			}

			// Update last sync time
			this.settings.lastSync = Date.now();

			this.onStatusChange?.('success', `Synced: ${title}`);
			return true;
		} catch (error) {
			console.error(`[Ghost Sync] ❌ Error syncing ${file.path}:`, error);
			if (this.settings.showSyncNotifications) {
				new Notice(`❌ Failed to sync ${file.name}: ${error.message}`);
			}
			this.onStatusChange?.('error', `Error: ${error.message}`);
			return false;
		}
	}

	/**
	 * Sync all files in sync folder
	 */
	async syncAllFiles(): Promise<{ success: number; failed: number }> {
		const results = { success: 0, failed: 0 };

		try {
			// Get all files in sync folder
			const syncFolder = this.app.vault.getAbstractFileByPath(this.settings.syncFolder);
			if (!syncFolder) {
				new Notice(`Sync folder not found: ${this.settings.syncFolder}`);
				return results;
			}

			// Get all markdown files recursively
			const files = this.app.vault.getMarkdownFiles().filter(file =>
				file.path.startsWith(this.settings.syncFolder)
			);

			if (files.length === 0) {
				new Notice('No files to sync');
				return results;
			}

			new Notice(`Syncing ${files.length} file(s)...`);

			// Sync each file
			for (const file of files) {
				const success = await this.syncFileToGhost(file);
				if (success) {
					results.success++;
				} else {
					results.failed++;
				}
			}

			new Notice(`Sync complete: ${results.success} succeeded, ${results.failed} skipped/failed`);
		} catch (error) {
			console.error('[Ghost Sync] Error in syncAllFiles:', error);
			new Notice(`Sync failed: ${error.message}`);
		}

		return results;
	}

	/**
	 * Check if file should be synced
	 */
	shouldSyncFile(file: TFile): boolean {
		// Must be in sync folder
		if (!file.path.startsWith(this.settings.syncFolder)) {
			return false;
		}

		// Must be markdown
		if (file.extension !== 'md') {
			return false;
		}

		return true;
	}
}
