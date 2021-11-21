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
		const offToPos = (offset: number) => editor.offsetToPos(offset); // Arrow functions

		function WordUnderCursor(ep: EditorPosition) {
			// https://codemirror.net/doc/manual.html#api_selection
			if (editor.cm?.findWordAt) return editor.cm.findWordAt(ep);	//CM5
			else if (editor.cm?.state.wordAt) return editor.cm.state.wordAt(editor.posToOffset(ep)); //CM6
		}

		function trimSelection(trimBefArray: string[], trimAftArray: string[]): void {
			let selection = editor.getSelection();
			let sp = editor.posToOffset(editor.getCursor("from"));

			//before
			let trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimBefArray.forEach(str => {
					if (selection.startsWith(str)) {
						selection = selection.slice(str.length);
						sp += str.length;
					} else {
						cleanCount++;
					}
				});
				if (cleanCount == trimBefArray.length || !selection.length) trimFinished = true;
			}

			//after
			trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimAftArray.forEach((str) => {
					if (selection.endsWith(str)) selection = selection.slice(0, -str.length);
					else cleanCount++;
				});
				if (cleanCount == trimAftArray.length || !selection.length) trimFinished = true;
			}

			//block-ID
			const blockID = selection.match(/ \^\w+$/);
			if (blockID !== null) selection = selection.slice(0, -blockID[0].length);

			if (!selection.length) {
				console.log("only irrelevant characters were selected");
				return;
			}
			editor.setSelection(offToPos(sp), offToPos(sp + selection.length));
		}

		const [blen, alen] = [beforeStr.length, afterStr.length];
		let [wordExpanded, multiWordExpanded] = [false, false];

		// Expand Selection to Word if there is no selection
		const noSelPosition = editor.getCursor();
		if (!editor.somethingSelected()) {
			const { anchor, head } = WordUnderCursor(noSelPosition);
			editor.setSelection(anchor, head);
			wordExpanded = true;
		}

		// Trim selection in case of certain leading or trailing sequences
		const trimBefore = ["- [ ] ", "- [x] ", "- ", " ", "\n", "\t"];
		const trimAfter = [" ", "\n", "\t"];
		trimSelection(trimBefore, trimAfter);

		// Expand selection to word boundaries if multiple words
		const [selStart, selEnd] = [ editor.getCursor("from"), editor.getCursor("to")];
		const selected = editor.getSelection();
		if (selected.includes(" ")) {
			const firstWordRange = WordUnderCursor(selStart);
			let lastWordRange;

			//findAtWord reads to the right, so w/o "-1" the space would be read, not the word
			if (selected.match(/[.,;:\-–—]$/) === null) {
				selEnd.ch--;
				lastWordRange = WordUnderCursor(selEnd);
				selEnd.ch++;
			} else {
				lastWordRange = WordUnderCursor(selEnd);
			}

			// Fix for punctuation messing up selection due do findAtWord
			const lastWord = editor.getRange(lastWordRange.anchor, lastWordRange.head);
			if (/^[.,;:\-–—]/.test(lastWord)) head.ch = anchor.ch + 1;

			editor.setSelection(firstWordRange.anchor, lastWordRange.head);
			multiWordExpanded = true;
		}

		// Get properties of selection
		const selectedText = editor.getSelection();
		const len = selectedText.length;
		const so = editor.posToOffset(editor.getCursor("from")); // Starting offset
		const eo = so + len; // Ending offset
		const charsBefore = editor.getRange(offToPos(so - blen), offToPos(so));
		const charsAfter = editor.getRange(offToPos(eo), offToPos(eo + alen));
		const firstChars = editor.getRange(offToPos(so), offToPos(so + blen));
		const lastChars = editor.getRange(offToPos(eo - alen), offToPos(eo));
		const markupOutsideSel = charsBefore === beforeStr && charsAfter === afterStr;
		const markupInsideSel = firstChars === beforeStr && lastChars === afterStr;

		// Do Markup
		if (!markupOutsideSel && !markupInsideSel){
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

		// Undo markup (outside selection)
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

		// Undo markup (inside selection)
		if (markupInsideSel) {
			editor.replaceSelection(selectedText.slice(blen, -alen));
			if (wordExpanded) {
				const temp = noSelPosition;
				temp.ch -= blen;
				editor.setCursor(temp);
			} else if (multiWordExpanded) {
				const selStartTemp = selStart;
				const selEndTemp = selEnd;
				selStartTemp.ch -= blen;
				selEndTemp.ch -= blen;
				editor.setSelection(selStartTemp, selEndTemp);
			} else {
				editor.setSelection(offToPos(so), offToPos(eo - (blen + alen)));
			}
		}

	}
}
