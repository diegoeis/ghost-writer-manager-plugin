/**
 * Convert Ghost HTML to Obsidian Markdown
 *
 * Handles the common HTML elements Ghost produces so content
 * imported from Ghost is readable and editable in Obsidian.
 */

/**
 * Convert a Ghost HTML string to Markdown.
 */
export function htmlToMarkdown(html: string): string {
	if (!html || html.trim() === '') return '';

	let md = html;

	// ── Normalise line endings ──────────────────────────────────────────────
	md = md.replace(/\r\n/g, '\n');

	// ── Code blocks (must come before inline-code / paragraph handling) ────
	// <pre><code class="language-js">…</code></pre>
	md = md.replace(
		/<pre[^>]*><code(?:\s+class="language-([^"]*)")?[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
		(_, lang, code) => {
			const language = lang ?? '';
			return `\`\`\`${language}\n${unescapeHtml(code.trim())}\n\`\`\``;
		}
	);

	// ── Headings ────────────────────────────────────────────────────────────
	md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${stripTags(t).trim()}\n`);
	md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${stripTags(t).trim()}\n`);
	md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${stripTags(t).trim()}\n`);
	md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `#### ${stripTags(t).trim()}\n`);
	md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, t) => `##### ${stripTags(t).trim()}\n`);
	md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, t) => `###### ${stripTags(t).trim()}\n`);

	// ── Blockquotes ─────────────────────────────────────────────────────────
	md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
		const text = stripTags(inner).trim();
		return text.split('\n').map(line => `> ${line}`).join('\n') + '\n';
	});

	// ── Lists ───────────────────────────────────────────────────────────────
	// Unordered
	md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner: string) => {
		return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m: string, item: string) =>
			`- ${stripTags(item).trim()}`
		) + '\n';
	});

	// Ordered
	md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner: string) => {
		let index = 1;
		return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m: string, item: string) =>
			`${index++}. ${stripTags(item).trim()}`
		) + '\n';
	});

	// ── Images ──────────────────────────────────────────────────────────────
	md = md.replace(/<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
	md = md.replace(/<img[^>]+alt="([^"]*)"[^>]+src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
	md = md.replace(/<img[^>]+src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

	// ── Figures (Ghost wraps images in <figure>) ─────────────────────────
	md = md.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_, inner) => {
		// figcaption becomes italic text under the image
		const caption = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
		const imgMd = inner.replace(/<figcaption[\s\S]*?<\/figcaption>/gi, '').trim();
		const captionText = caption ? `\n*${stripTags(caption[1]).trim()}*` : '';
		return `${imgMd}${captionText}\n`;
	});

	// ── Inline formatting ───────────────────────────────────────────────────
	md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
	md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
	md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
	md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
	md = md.replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, '~~$1~~');
	md = md.replace(/<del[^>]*>([\s\S]*?)<\/del>/gi, '~~$1~~');
	md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

	// ── Links ───────────────────────────────────────────────────────────────
	md = md.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

	// ── Horizontal rules ────────────────────────────────────────────────────
	md = md.replace(/<hr[^>]*\/?>/gi, '\n---\n');

	// ── Line breaks ─────────────────────────────────────────────────────────
	md = md.replace(/<br[^>]*\/?>/gi, '\n');

	// ── Paragraphs ──────────────────────────────────────────────────────────
	md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => {
		const text = inner.trim();
		return text ? `${text}\n\n` : '';
	});

	// ── Divs / sections (generic block wrappers) ────────────────────────────
	md = md.replace(/<\/?(div|section|article|aside|header|footer|main|nav)[^>]*>/gi, '\n');

	// ── Strip any remaining HTML tags ───────────────────────────────────────
	md = stripTags(md);

	// ── Unescape HTML entities ───────────────────────────────────────────────
	md = unescapeHtml(md);

	// ── Clean up excess blank lines (max 2 consecutive) ─────────────────────
	md = md.replace(/\n{3,}/g, '\n\n');

	return md.trim();
}

/**
 * Remove all HTML tags from a string.
 */
function stripTags(html: string): string {
	return html.replace(/<[^>]+>/g, '');
}

/**
 * Decode common HTML entities.
 */
function unescapeHtml(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#039;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&mdash;/g, '—')
		.replace(/&ndash;/g, '–')
		.replace(/&hellip;/g, '…')
		.replace(/&ldquo;/g, '"')
		.replace(/&rdquo;/g, '"')
		.replace(/&lsquo;/g, "'")
		.replace(/&rsquo;/g, "'");
}
