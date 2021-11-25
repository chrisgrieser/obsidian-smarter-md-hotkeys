import { COMMANDS } from "const"; // commands exported into seperate file
import { Editor, EditorPosition, Plugin } from "obsidian";

// Override the obsidian module by adding the non-documented Editor methods
// This makes it so that TypeScript stops shouting at you for accessing a property that it thinks doesn't exist
// And gives you type-safety
declare module "obsidian" {
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

	expandAndWrap(beforeStr: string, afterStr: string, editor: Editor): void {

		const offToPos = (offset: number) => editor.offsetToPos(offset); // Arrow function

		// depending on command use either word or code under Cursor
		function textUnderCursor(ep: EditorPosition){

			function wordUnderCursor(ep: EditorPosition) {
				// https://codemirror.net/doc/manual.html#api_selection
				if (editor.cm?.findWordAt) return editor.cm.findWordAt(ep);	// CM5
				else if (editor.cm?.state.wordAt) return editor.cm.state.wordAt(editor.posToOffset(ep)); // CM6
			}

			// Expand Selection based on Space as delimitor for Inline-Code
			function codeUnderCursor(ep: EditorPosition){
				const so = editor.posToOffset(editor.getCursor("from")); // start offset

				let charBefore, charAfter;
				let [ i, j, endReached, startReached ] = [0, 0, false, false];
				const noteLength = (editor.getValue()).length; // editor.getValue() gets the editor content

				while (!/\s/.test(charBefore) && !startReached){
					charBefore = editor.getRange(offToPos(so - (i+1)), offToPos(so - i));
					i++;
					if (so-(i-1) === 0) startReached = true;
				}
				while (!/\s/.test(charAfter) && !endReached){
					charAfter = editor.getRange(offToPos(so + j), offToPos(so + j+1));
					j++;
					if (so+(j-1) === noteLength) endReached = true;
				}

				return {anchor: offToPos(so - (i-1)), head: offToPos(so + (j-1))};
			}

			if (beforeStr === "`") return codeUnderCursor(ep);
			return wordUnderCursor(ep);
		}

		function trimSelection(trimBefArray: string[], trimAftArray: string[]): void {
			let selection = editor.getSelection();
			let so = editor.posToOffset(editor.getCursor("from"));

			// before
			let trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimBefArray.forEach(str => {
					if (selection.startsWith(str)) {
						selection = selection.slice(str.length);
						so += str.length;
					} else {
						cleanCount++;
					}
				});
				if (cleanCount === trimBefArray.length || !selection.length) trimFinished = true;
			}

			// after
			trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimAftArray.forEach((str) => {
					if (selection.endsWith(str)) selection = selection.slice(0, -str.length);
					else cleanCount++;
				});
				if (cleanCount === trimAftArray.length || !selection.length) trimFinished = true;
			}

			// block-ID
			const blockID = selection.match(/ \^\w+$/);
			if (blockID !== null) selection = selection.slice(0, -blockID[0].length);

			editor.setSelection(offToPos(so), offToPos(so + selection.length));
		}

		const [blen, alen] = [beforeStr.length, afterStr.length];
		const trimBefore = ["- [ ] ", "- [x] ", "- ", " ", "\n", "\t", beforeStr];
		const trimAfter = [" ", "\n", "\t", afterStr];
		let [wordExpanded, multiWordExpanded] = [false, false];

		// Expand Selection to word if there is no selection
		const noSelPosition = editor.getCursor();
		if (!editor.somethingSelected()) {
			const { anchor, head } = textUnderCursor(noSelPosition);
			editor.setSelection(anchor, head);
			wordExpanded = true;
		}

		trimSelection(trimBefore, trimAfter);

		// Expand selection to word boundaries if multiple words
		const [selStart, selEnd] = [ editor.getCursor("from"), editor.getCursor("to")];
		const selected = editor.getSelection();
		if (selected.includes(" ")) {
			const firstWordRange = textUnderCursor(selStart);

			// findAtWord reads to the right, so w/o "-1" the space would be read, not the word
			selEnd.ch--;
			const lastWordRange = textUnderCursor(selEnd);
			selEnd.ch++;

			// Fix for punctuation messing up selection due do findAtWord
			const lastWord = editor.getRange(lastWordRange.anchor, lastWordRange.head);
			if (/^[.,;:\-–—]/.test(lastWord)) lastWordRange.head.ch = lastWordRange.anchor.ch + 1;

			editor.setSelection(firstWordRange.anchor, lastWordRange.head);
			multiWordExpanded = true;
		}

		trimSelection(trimBefore, trimAfter);

		// Get properties of selection
		const selectedText = editor.getSelection();
		const len = selectedText.length;
		const so = editor.posToOffset(editor.getCursor("from")); // Starting offset
		const eo = so + len; // Ending offset
		const charsBefore = editor.getRange(offToPos(so - blen), offToPos(so));
		const charsAfter = editor.getRange(offToPos(eo), offToPos(eo + alen));
		const markupOutsideSel = charsBefore === beforeStr && charsAfter === afterStr;

		// No selection → just insert markup by itself
		if (!editor.somethingSelected()){
			editor.replaceSelection(beforeStr + afterStr);
			const cursor = editor.getCursor();
			cursor.ch -= alen;
			editor.setCursor(cursor);
		}

		// Do Markup
		if (!markupOutsideSel && editor.somethingSelected()){
			editor.replaceSelection(beforeStr + selectedText + afterStr);
			if (wordExpanded) {
				const temp = noSelPosition;
				temp.ch += blen;
				editor.setCursor(temp);
			} else if (multiWordExpanded) {
				const selStartTemp = selStart;
				const selEndTemp = selEnd;
				selStartTemp.ch += blen;
				selEndTemp.ch += blen;
				editor.setSelection(selStartTemp, selEndTemp);
			} else {
				editor.setSelection(offToPos(so + blen), offToPos(eo + blen) );
			}
		}

		// Undo markup (outside selection, inside not necessary as trimmed away)
		if (markupOutsideSel) {
			editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
			editor.replaceSelection(selectedText);
			if (wordExpanded) {
				const temp = noSelPosition; // to avoid issues with mutating properties
				temp.ch -= blen;
				editor.setCursor(temp);
			} else if (multiWordExpanded) {
				const selStartTemp = selStart;
				const selEndTemp = selEnd;
				selStartTemp.ch -= blen;
				selEndTemp.ch -= blen;
				editor.setSelection(selStartTemp, selEndTemp);
			} else {
				editor.setSelection(offToPos(so - blen), offToPos(eo - blen) );
			}
		}

	}
}
