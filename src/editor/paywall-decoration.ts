import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { RangeSetBuilder, TransactionSpec, Extension } from '@codemirror/state';

const MARKER = '--members-only--';

/**
 * Widget rendered in place of the --members-only-- line in Live Preview.
 */
class PaywallWidget extends WidgetType {
	toDOM(): HTMLElement {
		const el = createDiv({ cls: 'ghost-paywall-line' });
		el.setAttribute('aria-label', 'Members-only paywall');

		el.createSpan({ cls: 'ghost-paywall-label', text: '⬇ members only below this line' });

		return el;
	}

	eq(): boolean {
		return true;
	}
}

/**
 * CodeMirror ViewPlugin that decorates --members-only-- lines.
 */
export const paywallDecorationPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = buildDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = buildDecorations(update.view);
			}
		}
	},
	{ decorations: instance => instance.decorations }
);

function buildDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();

	for (const { from, to } of view.visibleRanges) {
		let pos = from;
		while (pos <= to) {
			const line = view.state.doc.lineAt(pos);
			if (line.text.trim() === MARKER) {
				builder.add(
					line.from,
					line.to,
					Decoration.replace({ widget: new PaywallWidget(), block: false })
				);
			}
			pos = line.to + 1;
		}
	}

	return builder.finish();
}

/**
 * Transaction filter that removes all earlier --members-only-- markers
 * the moment a new one is added, keeping only the latest one.
 * The removal is merged into the same transaction — single undo step.
 */
export const paywallDeduplicateExtension: Extension = EditorView.updateListener.of(update => {
	if (!update.docChanged) return;

	const doc = update.state.doc;
	const markerLines: number[] = [];

	for (let i = 1; i <= doc.lines; i++) {
		if (doc.line(i).text.trim() === MARKER) {
			markerLines.push(i);
		}
	}

	if (markerLines.length <= 1) return;

	// Keep the last marker, delete everything before it (in reverse order to preserve positions)
	const toDelete = markerLines.slice(0, -1).reverse();
	const changes: TransactionSpec['changes'] = toDelete.map(lineNum => {
		const line = doc.line(lineNum);
		// Delete the line including its trailing newline (or leading if it's the last line)
		const from = line.from > 0 ? line.from - 1 : line.from;
		const to = line.from > 0 ? line.to : line.to + 1;
		return { from, to, insert: '' };
	});

	update.view.dispatch({ changes });
});
