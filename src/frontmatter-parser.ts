import { GhostPostAccess } from './types';

/**
 * Ghost metadata extracted from frontmatter
 */
export interface GhostMetadata {
	post_access: GhostPostAccess;
	published: boolean;
	published_at?: string; // ISO date string for scheduling
	featured: boolean;
	tags: string[];
	excerpt: string;
	feature_image: string;
	no_sync: boolean;
	ghost_id?: string; // Ghost post ID if already synced
	slug?: string; // Custom slug
}

/**
 * Parse Ghost metadata from frontmatter
 */
export function parseGhostMetadata(
	frontmatter: Record<string, unknown>,
	prefix: string
): GhostMetadata | null {
	console.debug('[Ghost Parse] Starting parse with prefix:', prefix);
	console.debug('[Ghost Parse] Frontmatter keys:', Object.keys(frontmatter));

	// Helper to get prefixed property
	const get = (key: string): unknown => {
		return frontmatter[`${prefix}${key}`];
	};

	// Check if has any Ghost properties
	const hasGhostProps = Object.keys(frontmatter).some(key => {
		// Handle both with and without trailing underscore
		return key.startsWith(prefix) || key.startsWith(prefix.replace(/_$/, ''));
	});

	console.debug('[Ghost Parse] Has Ghost props?', hasGhostProps);

	if (!hasGhostProps) {
		return null;
	}

	// Parse post_access (visibility)
	const rawPostAccess = get('post_access');
	let post_access: GhostPostAccess = 'paid'; // Default: paid-members only
	if (rawPostAccess === 'public' || rawPostAccess === 'members' || rawPostAccess === 'paid') {
		post_access = rawPostAccess as GhostPostAccess;
	}

	// Parse tags
	let tags: string[] = [];
	const rawTags = get('tags');
	if (Array.isArray(rawTags)) {
		tags = rawTags.filter(t => typeof t === 'string') as string[];
	}

	// Parse boolean values properly (Obsidian can store as true/false or "true"/"false")
	const parseBool = (value: unknown): boolean => {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'string') return value.toLowerCase() === 'true';
		return Boolean(value);
	};

	const featured = parseBool(get('featured'));
	const published = parseBool(get('published'));
	const no_sync = parseBool(get('no_sync'));

	console.debug('[Ghost Parse] Featured value:', get('featured'), '=> parsed:', featured);
	console.debug('[Ghost Parse] Published value:', get('published'), '=> parsed:', published);

	// Parse excerpt and feature_image (only if not empty)
	console.debug('[Ghost Parse] Excerpt raw value:', get('excerpt'));
	const rawExcerpt = get('excerpt');
	const excerpt = rawExcerpt && typeof rawExcerpt === 'string' && rawExcerpt.trim() !== '' ? rawExcerpt : (rawExcerpt && typeof rawExcerpt !== 'object' ? String(rawExcerpt) : '');

	const rawFeatureImage = get('feature_image');
	const feature_image = rawFeatureImage && typeof rawFeatureImage === 'string' && rawFeatureImage.trim() !== '' ? rawFeatureImage : (rawFeatureImage && typeof rawFeatureImage !== 'object' ? String(rawFeatureImage) : '');

	console.debug('[Ghost Parse] Excerpt parsed:', excerpt, '(length:', excerpt.length, ')');

	// Parse published_at (optional date for scheduling)
	const rawPublishedAt = get('published_at');
	const published_at = rawPublishedAt && typeof rawPublishedAt !== 'object' ? String(rawPublishedAt) : undefined;

	return {
		post_access,
		published,
		published_at,
		featured,
		tags,
		excerpt,
		feature_image,
		no_sync,
		ghost_id: get('id') ? String(get('id')) : undefined,
		slug: get('slug') ? String(get('slug')) : undefined
	};
}

/**
 * Extract content without frontmatter
 */
export function extractContent(fileContent: string): string {
	const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
	return fileContent.replace(frontmatterRegex, '').trim();
}

/**
 * Update frontmatter with Ghost ID after sync
 */
export function updateFrontmatterWithGhostId(
	fileContent: string,
	ghostId: string,
	slug: string,
	prefix: string
): string {
	const frontmatterRegex = /^(---\n)([\s\S]*?)(\n---\n)/;
	const match = fileContent.match(frontmatterRegex);

	if (!match) {
		// No frontmatter, add it
		return `---
${prefix}id: ${ghostId}
${prefix}slug: ${slug}
---

${fileContent}`;
	}

	const [fullMatch, start, content, end] = match;

	// Check if ghost_id already exists
	const idPattern = new RegExp(`^${prefix}id:.*$`, 'm');
	const slugPattern = new RegExp(`^${prefix}slug:.*$`, 'm');

	let newContent = content;

	if (idPattern.test(content)) {
		// Update existing id
		newContent = content.replace(idPattern, `${prefix}id: ${ghostId}`);
	} else {
		// Add new id
		newContent = `${content}\n${prefix}id: ${ghostId}`;
	}

	if (slugPattern.test(newContent)) {
		// Update existing slug
		newContent = newContent.replace(slugPattern, `${prefix}slug: ${slug}`);
	} else {
		// Add new slug
		newContent = `${newContent}\n${prefix}slug: ${slug}`;
	}

	return `${start}${newContent}${end}${fileContent.substring(fullMatch.length)}`;
}
