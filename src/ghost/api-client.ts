import { App, requestUrl, RequestUrlResponse } from 'obsidian';
import { GhostPost } from '../types';

/**
 * Ghost Admin API Client
 * Uses Obsidian's requestUrl instead of fetch to bypass CORS
 */
export class GhostAPIClient {
	private apiUrl: string;
	private apiKey: string;
	private app: App;

	constructor(ghostUrl: string, apiKey: string, app: App) {
		this.apiUrl = ghostUrl;
		this.apiKey = apiKey;
		this.app = app;
	}

	/**
	 * Update credentials
	 */
	updateCredentials(ghostUrl: string, apiKey: string): void {
		this.apiUrl = ghostUrl;
		this.apiKey = apiKey;
	}

	/**
	 * Generate JWT token for Ghost Admin API
	 * Format: {id}:{secret}
	 */
	private async generateToken(): Promise<string> {
		if (!this.apiKey) {
			throw new Error('Admin API key not configured');
		}

		const [id, secret] = this.apiKey.split(':');

		if (!id || !secret) {
			throw new Error('Invalid Admin API key format. Expected format: id:secret');
		}

		console.log('[Ghost JWT] Generating token...');
		console.log('[Ghost JWT] ID length:', id.length);
		console.log('[Ghost JWT] Secret length:', secret.length);
		console.log('[Ghost JWT] Secret is hex?', /^[0-9a-f]+$/i.test(secret));

		// Generate JWT token
		// Header (order matters for some JWT implementations)
		const header = {
			alg: 'HS256',
			kid: id,
			typ: 'JWT'
		};

		// Payload
		const payload = {
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
			aud: '/admin/'
		};

		console.log('[Ghost JWT] Payload:', payload);

		// Encode header and payload
		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

		console.log('[Ghost JWT] Encoded header:', encodedHeader);
		console.log('[Ghost JWT] Encoded payload:', encodedPayload);

		// Create signature
		const unsignedToken = `${encodedHeader}.${encodedPayload}`;
		const signature = await this.createSignature(unsignedToken, secret);

		console.log('[Ghost JWT] Signature:', signature);

		const token = `${unsignedToken}.${signature}`;
		console.log('[Ghost JWT] Final token length:', token.length);

		return token;
	}

	/**
	 * Base64 URL encode
	 */
	private base64UrlEncode(str: string): string {
		const base64 = btoa(str);
		return base64
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * Convert hex string to buffer
	 */
	private hexToBuffer(hex: string): Uint8Array {
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
		}
		return bytes;
	}

	/**
	 * Create HMAC SHA256 signature
	 */
	private async createSignature(data: string, secret: string): Promise<string> {
		const encoder = new TextEncoder();

		// Ghost Admin API secret is in hex format, need to convert to buffer
		const keyData = this.hexToBuffer(secret);
		const messageData = encoder.encode(data);

		// Import key
		const key = await crypto.subtle.importKey(
			'raw',
			keyData as BufferSource,
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign']
		);

		// Sign
		const signature = await crypto.subtle.sign('HMAC', key, messageData);

		// Convert to base64url
		const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
		return base64
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * Make authenticated request to Ghost Admin API
	 */
	private async makeRequest(
		endpoint: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
		body?: unknown
	): Promise<RequestUrlResponse> {
		const token = await this.generateToken();
		const url = `${this.apiUrl}/ghost/api/admin${endpoint}`;

		const headers: Record<string, string> = {
			'Authorization': `Ghost ${token}`,
			'Content-Type': 'application/json',
			'Accept-Version': 'v5.0'
		};

		const options: Parameters<typeof requestUrl>[0] = {
			url,
			method,
			headers,
			throw: false // Don't throw on HTTP errors, we'll handle them
		};

		if (body) {
			options.body = JSON.stringify(body);
		}

		return await requestUrl(options);
	}

	/**
	 * Test connection to Ghost Admin API
	 */
	async testConnection(): Promise<boolean> {
		try {
			const response = await this.makeRequest('/site/');

			if (response.status === 200) {
				return true;
			}

			console.error('Ghost connection test failed:', response.status, response.text);
			return false;
		} catch (error) {
			console.error('Ghost connection test error:', error);
			return false;
		}
	}

	/**
	 * Get all posts
	 */
	async getPosts(filter?: string): Promise<GhostPost[]> {
		try {
			let endpoint = '/posts/?formats=html,lexical&include=tags';
			if (filter) {
				endpoint += `&filter=${encodeURIComponent(filter)}`;
			}

			const response = await this.makeRequest(endpoint);

			if (response.status !== 200) {
				throw new Error(`Failed to fetch posts: ${response.status} ${response.text}`);
			}

			const data = response.json as { posts: GhostPost[] };
			return data.posts || [];
		} catch (error) {
			console.error('Error fetching posts:', error);
			throw error;
		}
	}

	/**
	 * Get a single post by ID
	 */
	async getPost(postId: string): Promise<GhostPost> {
		try {
			const endpoint = `/posts/${postId}/?formats=html,lexical&include=tags`;
			const response = await this.makeRequest(endpoint);

			if (response.status !== 200) {
				throw new Error(`Failed to fetch post: ${response.status} ${response.text}`);
			}

			const data = response.json as { posts: GhostPost[] };
			return data.posts[0];
		} catch (error) {
			console.error('Error fetching post:', error);
			throw error;
		}
	}

	/**
	 * Create a new post
	 */
	async createPost(post: Partial<GhostPost>): Promise<GhostPost> {
		try {
			const response = await this.makeRequest('/posts/', 'POST', { posts: [post] });

			if (response.status !== 201) {
				throw new Error(`Failed to create post: ${response.status} ${response.text}`);
			}

			const data = response.json as { posts: GhostPost[] };
			return data.posts[0];
		} catch (error) {
			console.error('Error creating post:', error);
			throw error;
		}
	}

	/**
	 * Update an existing post
	 */
	async updatePost(postId: string, post: Partial<GhostPost>): Promise<GhostPost> {
		try {
			// First, get the current post to retrieve updated_at
			const currentPost = await this.getPost(postId);

			// Include updated_at from current post for version control
			const postWithVersion = {
				...post,
				updated_at: currentPost.updated_at
			};

			console.log('[Ghost API] Sending update with fields:', Object.keys(postWithVersion));
			console.log('[Ghost API] Excerpt value:', postWithVersion.excerpt);
			console.log('[Ghost API] Full post data:', JSON.stringify(postWithVersion, null, 2).substring(0, 500));

			const response = await this.makeRequest(`/posts/${postId}/`, 'PUT', { posts: [postWithVersion] });

			if (response.status !== 200) {
				throw new Error(`Failed to update post: ${response.status} ${response.text}`);
			}

			const data = response.json as { posts: GhostPost[] };
			return data.posts[0];
		} catch (error) {
			console.error('Error updating post:', error);
			throw error;
		}
	}

	/**
	 * Delete a post
	 */
	async deletePost(postId: string): Promise<void> {
		try {
			const response = await this.makeRequest(`/posts/${postId}/`, 'DELETE');

			if (response.status !== 204) {
				throw new Error(`Failed to delete post: ${response.status} ${response.text}`);
			}
		} catch (error) {
			console.error('Error deleting post:', error);
			throw error;
		}
	}
}
