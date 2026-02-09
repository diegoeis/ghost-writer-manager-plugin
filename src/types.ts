/**
 * Plugin settings interface
 * Note: ghostAdminApiKey is stored securely in Obsidian's keychain, not in settings
 */
export interface GhostWriterSettings {
	ghostUrl: string;
	syncFolder: string;
	syncInterval: number; // in minutes
	yamlPrefix: string;
	lastSync: number;
	showSyncNotifications: boolean;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: GhostWriterSettings = {
	ghostUrl: '',
	syncFolder: 'Ghost Posts',
	syncInterval: 15,
	yamlPrefix: 'ghost_',
	lastSync: 0,
	showSyncNotifications: true
};

/**
 * Keychain key for storing Ghost Admin API Key securely
 */
export const GHOST_API_KEY_KEYCHAIN_KEY = 'ghost-admin-api-key';

/**
 * Ghost post status
 */
export type GhostPostStatus = 'draft' | 'published' | 'scheduled';

/**
 * Ghost post access (visibility)
 */
export type GhostPostAccess = 'public' | 'members' | 'paid';

/**
 * Ghost post interface (simplified for now)
 */
export interface GhostPost {
	id: string;
	uuid: string;
	title: string;
	slug: string;
	html: string;
	lexical: string;
	status: GhostPostStatus;
	visibility: GhostPostAccess; // Ghost API uses 'visibility' field
	featured: boolean;
	feature_image: string | null;
	excerpt: string | null;
	tags: Array<{ name: string }>;
	published_at: string | null;
	updated_at: string;
	created_at: string;
}
