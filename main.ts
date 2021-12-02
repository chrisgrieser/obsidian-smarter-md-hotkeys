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
		const offToPos = (offset: number) => editor.offsetToPos(offset); // Arrow function
		const startOffset = () => editor.posToOffset(editor.getCursor("from"));
		const endOffset = () => editor.posToOffset(editor.getCursor("from")) + editor.getSelection().length;

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

		function markupOutsideSel(){
			const so_ = startOffset();
			const eo_ = endOffset();
			const charsBefore_ = editor.getRange(offToPos(so_ - blen), offToPos(so_));
			const charsAfter_ = editor.getRange(offToPos(eo_), offToPos(eo_ + alen));
			return (charsBefore_ === frontMarkup && charsAfter_ === endMarkup);
		}

		//-------------------------------------------------------------------

		// if nothing selected and markup outside, just undo markup
		let so = startOffset();
		let eo = endOffset();
		if (!editor.somethingSelected() && markupOutsideSel()) {
			editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
			editor.replaceSelection("");
			editor.setSelection(offToPos(so - blen), offToPos(eo - alen) );
			return;
		}

		// Expand Selection to word if there is no selection
		let wordExpanded = false;
		const beforeWordExpPos = editor.getCursor();
		if (!editor.somethingSelected() && !markupOutsideSel()) {
			const { anchor, head } = textUnderCursor(beforeWordExpPos);
			editor.setSelection(anchor, head);
			wordExpanded = true;
		}
		trimSelection();

		// Expand selection to word boundaries if multiple words
		let multiWordExpanded = false;
		const [befMultiWordExpPos, aftMultiWordExpPos] = [ editor.getCursor("from"), editor.getCursor("to")];
		if (editor.getSelection().includes(" ")) {
			const firstWordRange = textUnderCursor(befMultiWordExpPos);

			// findAtWord reads to the right, so w/o "-1" the space would be read, not the word
			aftMultiWordExpPos.ch--;
			const lastWordRange = textUnderCursor(aftMultiWordExpPos);
			aftMultiWordExpPos.ch++;

			// Fix for punctuation messing up selection due do findAtWord
			const lastWord = editor.getRange(lastWordRange.anchor, lastWordRange.head);
			if (/^[.,;:\-–—]/.test(lastWord)) lastWordRange.head.ch = lastWordRange.anchor.ch + 1;

			editor.setSelection(firstWordRange.anchor, lastWordRange.head);
			multiWordExpanded = true;
		}
		trimSelection();

		// get properties of new selection
		const selectedText = editor.getSelection();
		so = startOffset();
		eo = endOffset();

		// No selection → just insert markup by itself
		if (!editor.somethingSelected()){
			editor.replaceSelection(frontMarkup + endMarkup);
			const cursor = editor.getCursor();
			cursor.ch -= alen;
			editor.setCursor(cursor);
		}

		// Do Markup
		if (!markupOutsideSel() && editor.somethingSelected()){
			editor.replaceSelection(frontMarkup + selectedText + endMarkup);
			if (wordExpanded) {
				const temp = beforeWordExpPos;
				temp.ch += blen;
				editor.setCursor(temp);
			} else if (multiWordExpanded) {
				const befMultiWordExpPos_ = befMultiWordExpPos;
				const aftMultiWordExpPos_ = aftMultiWordExpPos;
				befMultiWordExpPos_.ch += blen;
				aftMultiWordExpPos_.ch += blen;
				editor.setSelection(befMultiWordExpPos_, aftMultiWordExpPos_);
			} else {
				editor.setSelection(offToPos(so + blen), offToPos(eo + blen) );
			}
		}

		// Undo markup (outside selection, inside not necessary as trimmed)
		if (markupOutsideSel() && editor.somethingSelected()) {
			editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
			editor.replaceSelection(selectedText);
			if (wordExpanded) {
				const temp = beforeWordExpPos; // to avoid issues with mutating properties
				temp.ch -= blen;
				editor.setCursor(temp);
			} else if (multiWordExpanded) {
				const befMultiWordExpPosTemp = befMultiWordExpPos;
				const aftMultiWordExpPosTemp = aftMultiWordExpPos;
				befMultiWordExpPosTemp.ch -= blen;
				aftMultiWordExpPosTemp.ch -= blen;
				editor.setSelection(befMultiWordExpPosTemp, aftMultiWordExpPosTemp);
			} else {
				editor.setSelection(offToPos(so - blen), offToPos(eo - alen) );
			}
		}

	}
}
