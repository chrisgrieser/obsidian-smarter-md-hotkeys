import { COMMANDS } from "const"; // commands exported into separate file
import { Editor, EditorPosition, Plugin } from "obsidian";

declare module "obsidian" {
	// Override the obsidian module by adding the non-documented Editor methods
	// This makes it so that TypeScript stops shouting at you for accessing a property that it thinks doesn't exist
	// And gives you type-safety
	interface Editor {
		cm: {
			state?: { wordAt: (offset: number) => EditorSelection };
			findWordAt?: (pos: EditorPosition) => EditorSelection;
		};
	}
}

export default class SmarterMDhotkeys extends Plugin {

	async onload() {
		COMMANDS.forEach((command) => {
			const { id, name, before, after } = command;
			this.addCommand({
				id,
				name,
				editorCallback: (editor) =>
					this.expandAndWrap(before, after, editor),
			});
		});
		console.log("Smarter MD Hotkeys loaded.");
	}

	async onunload() {
		console.log("Smarter MD Hotkeys unloaded.");
	}

	expandAndWrap(frontMarkup: string, endMarkup: string, editor: Editor): void {
		const [blen, alen] = [frontMarkup.length, endMarkup.length];

		function textUnderCursor(ep: EditorPosition){

			function wordUnderCursor(ep_: EditorPosition) {
				// https://codemirror.net/doc/manual.html#api_selection
				if (editor.cm?.findWordAt) return editor.cm.findWordAt(ep);	// CM5
				else if (editor.cm?.state.wordAt) return editor.cm.state.wordAt(editor.posToOffset(ep)); // CM6
			}

			// Expand Selection based on Space as delimiter for Inline-Code
			function codeUnderCursor(ep_: EditorPosition){
				const so_ = editor.posToOffset(editor.getCursor("from")); // start offset

				let charBefore, charAfter;
				let [ i, j, endReached, startReached ] = [0, 0, false, false];
				const noteLength = (editor.getValue()).length; // editor.getValue() gets the editor content

				while (!/\s/.test(charBefore) && !startReached){
					charBefore = editor.getRange(offToPos(so_ - (i+1)), offToPos(so_ - i));
					i++;
					if (so_-(i-1) === 0) startReached = true;
				}
				while (!/\s/.test(charAfter) && !endReached){
					charAfter = editor.getRange(offToPos(so_ + j), offToPos(so_ + j+1));
					j++;
					if (so_+(j-1) === noteLength) endReached = true;
				}

				return {anchor: offToPos(so_ - (i-1)), head: offToPos(so_ + (j-1))};
			}

			// depending on command use either word or code under Cursor
			if (frontMarkup === "`") return codeUnderCursor(ep);
			return wordUnderCursor(ep);
		}

		function trimSelection(): void {
			const trimBefore = ["- [ ] ", "- [x] ", "- ", " ", "\n", "\t", frontMarkup];
			const trimAfter = [" ", "\n", "\t", endMarkup];
			let selection = editor.getSelection();
			let so_ = startOffset();

			// before
			let trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimBefore.forEach(str => {
					if (selection.startsWith(str)) {
						selection = selection.slice(str.length);
						so_ += str.length;
					} else {
						cleanCount++;
					}
				});
				if (cleanCount === trimBefore.length || !selection.length) trimFinished = true;
			}

			// after
			trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimAfter.forEach((str) => {
					if (selection.endsWith(str)) selection = selection.slice(0, -str.length);
					else cleanCount++;
				});
				if (cleanCount === trimAfter.length || !selection.length) trimFinished = true;
			}

			// block-ID
			const blockID = selection.match(/ \^\w+$/);
			if (blockID !== null) selection = selection.slice(0, -blockID[0].length);

			editor.setSelection(offToPos(so_), offToPos(so_ + selection.length));
		}

		// Boolean Functions to check properties of selection
		function markupOutsideSel(){
			const so_ = startOffset();
			const eo_ = endOffset();
			const charsBefore_ = editor.getRange(offToPos(so_ - blen), offToPos(so_));
			const charsAfter_ = editor.getRange(offToPos(eo_), offToPos(eo_ + alen));
			return (charsBefore_ === frontMarkup && charsAfter_ === endMarkup);
		}
		const nothingSelected = () => !editor.somethingSelected();
		const multiWordSel = () => editor.getSelection().includes(" ");
		const multiLineSel = () => editor.getSelection().includes("\n");
		const partialWordSel = () => (!nothingSelected() && !multiWordSel() && !multiLineSel());

		// Offset Functions
		const startOffset = () => editor.posToOffset(editor.getCursor("from"));
		const endOffset = () => editor.posToOffset(editor.getCursor("from")) + editor.getSelection().length;
		const offToPos = (offset: number) => editor.offsetToPos(offset);

		//-------------------------------------------------------------------

		// if nothing selected and markup outside, just undo markup
		if (nothingSelected() && markupOutsideSel()) {
			const so_ = startOffset();
			const eo_ = endOffset();
			editor.setSelection(offToPos(so_ - blen), offToPos(eo_ + alen));
			editor.replaceSelection("");
			editor.setSelection(offToPos(so_ - blen), offToPos(eo_ - alen) );
			return;
		}

		// Expand Selection to word if there is no selection
		let preNothingExpPos;
		if (nothingSelected() && !markupOutsideSel()) {
			preNothingExpPos = editor.getCursor();
			const { anchor, head } = textUnderCursor(preNothingExpPos);
			editor.setSelection(anchor, head);
		}
		trimSelection();

		// Expand Selection to word if partial word
		let prePartialWordExpAnchor, prePartialWordExpHead;
		if (partialWordSel()){
			prePartialWordExpAnchor = editor.getCursor("from");
			prePartialWordExpHead = editor.getCursor("to");
			const { anchor, head } = textUnderCursor(prePartialWordExpAnchor);
			editor.setSelection(anchor, head);
		}

		// Expand Selection to word boundaries if multiple words
		let preMultiWordExpAnchor, preMultiWordExpHead;
		if (multiWordSel()) {
			preMultiWordExpAnchor = editor.getCursor("from");
			preMultiWordExpHead = editor.getCursor("to");

			const firstWordRange = textUnderCursor(preMultiWordExpAnchor);

			// findAtWord reads to the right, so w/o "-1" the space would be read, not the word
			preMultiWordExpHead.ch--;
			const lastWordRange = textUnderCursor(preMultiWordExpHead);
			preMultiWordExpHead.ch++;

			// Fix for punctuation messing up selection due do findAtWord
			const lastWord = editor.getRange(lastWordRange.anchor, lastWordRange.head);
			if (/^[.,;:\-–—]/.test(lastWord)) lastWordRange.head.ch = lastWordRange.anchor.ch + 1;

			editor.setSelection(firstWordRange.anchor, lastWordRange.head);
		}
		trimSelection();

		//-------------------------------------------------------------------

		// Get properties of new selection
		const selectedText = editor.getSelection();
		const so = startOffset();
		const eo = endOffset();
		console.log("Final Selection: '" + selectedText + "'");

		// No selection → just insert markup by itself
		if (nothingSelected()){
			editor.replaceSelection(frontMarkup + endMarkup);
			const cursor = editor.getCursor();
			cursor.ch -= alen;
			editor.setCursor(cursor);
			return;
		}

		// Do Markup
		if (!markupOutsideSel() && !nothingSelected()){
			editor.replaceSelection(frontMarkup + selectedText + endMarkup);
			if (preNothingExpPos) {
				const pos = preNothingExpPos;
				pos.ch += blen;
				editor.setCursor(pos);
			} else if (preMultiWordExpAnchor) {
				const anchor = preMultiWordExpAnchor;
				const head = preMultiWordExpHead;
				anchor.ch += blen;
				head.ch += alen;
				editor.setSelection(anchor, head);
			} else if (prePartialWordExpAnchor) {
				const anchor = prePartialWordExpAnchor;
				const head = prePartialWordExpHead;
				anchor.ch += blen;
				head.ch += blen;
				editor.setSelection(anchor, head);
			} else {
				editor.setSelection(offToPos(so + blen), offToPos(eo + blen) );
			}
			return;
		}

		// Undo Markup (outside selection, inside not necessary as trimmed already)
		if (markupOutsideSel() && !nothingSelected()) {
			editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
			editor.replaceSelection(selectedText);
			if (preNothingExpPos) {
				const pos = preNothingExpPos;
				pos.ch -= blen; // to avoid issues with mutating properties
				editor.setCursor(pos);
			} else if (preMultiWordExpAnchor) {
				const anchor = preMultiWordExpAnchor;
				const head = preMultiWordExpHead;
				anchor.ch -= blen;
				head.ch -= alen;
				editor.setSelection(anchor, head);
			} else if (prePartialWordExpAnchor) {
				const anchor = prePartialWordExpAnchor;
				const head = prePartialWordExpHead;
				anchor.ch -= blen;
				head.ch -= alen;
				editor.setSelection(anchor, head);
			} else {
				editor.setSelection(offToPos(so - blen), offToPos(eo - alen) );
			}
			return;
		}

	}
}
