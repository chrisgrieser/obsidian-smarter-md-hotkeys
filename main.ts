import { COMMANDS } from "const";
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
		// Arrow functions are simpler
		// No need to specify the return-type, Typescript can infer it
		const offToPos = (offset: number) => editor.offsetToPos(offset);

		// Return type is infered
		function WordUnderCursor(ep: EditorPosition) {
			// https://codemirror.net/doc/manual.html#api_selection
			if (editor.cm?.findWordAt) return editor.cm.findWordAt(ep);
			//CM5
			else if (editor.cm?.state.wordAt)
				return editor.cm.state.wordAt(editor.posToOffset(ep)); //CM6
		}

		function trimSelection(
			trimBefArray: string[],
			trimAftArray: string[]
		): void {
			let selection = editor.getSelection();
			let sp = editor.posToOffset(editor.getCursor("from"));

			//before
			let trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimBefArray.forEach((str) => {
					if (selection.startsWith(str)) {
						selection = selection.slice(str.length);
						sp += str.length;
					} else cleanCount++;
				});
				// `a.length === 0` is the same as `!a.length`
				if (cleanCount == trimBefArray.length || !selection.length)
					trimFinished = true;
			}

			//after
			trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimAftArray.forEach((str) => {
					if (selection.endsWith(str)) {
						selection = selection.slice(0, -str.length);
					} else cleanCount++;
				});
				if (cleanCount == trimAftArray.length || !selection.length)
					trimFinished = true;
			}

			//block-ID
			const blockID = selection.match(/ \^\w+$/);
			// `===` is safer than `==`
			// https://stackoverflow.com/questions/359494/which-equals-operator-vs-should-be-used-in-javascript-comparisons
			if (blockID !== null)
				selection = selection.slice(0, -blockID[0].length);

			if (!selection.length) {
				console.log("only irrelevant characters where selected");
				return;
			}
			editor.setSelection(offToPos(sp), offToPos(sp + selection.length));
		}

		// I prefer defining similar variables inline using this syntax
		const [blen, alen] = [beforeStr.length, afterStr.length];
		let [wordExpanded, multiWordExpanded] = [false, false];

		// Expand Selection to Word if there is no selection
		const noSelPosition = editor.getCursor();
		if (!editor.somethingSelected()) {
			// Object Destructuring is a good way to get the properties you need without having to define a temporary variable
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
			const { anchor, head } = WordUnderCursor(noSelPosition);
			editor.setSelection(anchor, head);
			wordExpanded = true;
		}

		// Trim selection in case of leading or trailing sequences
		const trimBefore = ["- [ ] ", "- [x] ", "- ", " ", "\n", "\t"];
		const trimAfter = [" ", "\n", "\t"];
		trimSelection(trimBefore, trimAfter);

		// Expand selection to word boundaries if multiple words
		const [selStart, selEnd] = [
			editor.getCursor("from"),
			editor.getCursor("to"),
		];
		const selected = editor.getSelection();

		// Fix for punctuation messing up selection
		if (selected.includes(" ")) {
			const firstWordRange = WordUnderCursor(selStart);
			let lastWordRange;

			//findatword reads to the right, so without "-1" the space would be read
			if (selected.match(/[.,;:\-–—]$/) == null) {
				selEnd.ch--;
				lastWordRange = WordUnderCursor(selEnd);
				selEnd.ch++;
			} else {
				lastWordRange = WordUnderCursor(selEnd);
			}
			const { anchor, head } = lastWordRange;

			// Fix for punctuation messing up selection
			const lastWord = editor.getRange(anchor, head);
			// I think it's faster to `test` a regex than look for `match` if you only want to see if it matches
			if (/^[.,;:\-–—]/.test(lastWord)) {
				head.ch = anchor.ch + 1;
			}

			editor.setSelection(firstWordRange.anchor, head);
			multiWordExpanded = true;
		}

		// Get properties of selection
		const selectedText = editor.getSelection();
		// 'o' instead of 'p' because it's an offset, not a position
		const so = editor.posToOffset(editor.getCursor("from")); // Starting offset
		const len = selectedText.length;
		const eo = so + len; // Ending offset

		const [charsBefore, charsAfter] = [
			editor.getRange(offToPos(so - blen), offToPos(so)),
			editor.getRange(offToPos(eo), offToPos(eo + alen)),
		];

		const [firstChars, lastChars] = [
			editor.getRange(offToPos(so), offToPos(so + blen)),
			editor.getRange(offToPos(eo - alen), offToPos(eo)),
		];

		// Undo surrounding markup (outside selection)
		if (charsBefore === beforeStr && charsAfter === afterStr) {
			editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
			editor.replaceSelection(selectedText);
			if (wordExpanded) {
				// I've had issues when mutating properties of a `const` position before... I recommend making a copy of the position to use for this purpose only
				noSelPosition.ch -= blen;
				editor.setCursor(noSelPosition);
			} else if (multiWordExpanded) {
				// Same here. You might be introducing unintended side effects by mutating this object
				selStart.ch -= blen;
				selEnd.ch -= blen;
				editor.setSelection(selStart, selEnd);
			} else {
				editor.setSelection(
					offToPos(so - blen),
					offToPos(so - blen + len)
				);
			}

			// Undo surrounding markup (inside selection)
		} else if (firstChars == beforeStr && lastChars == afterStr) {
			editor.replaceSelection(selectedText.slice(blen, -alen));
			if (wordExpanded) {
				// Has to be considered, because findWordAt considers underscores as word-parts
				noSelPosition.ch -= blen;
				editor.setCursor(noSelPosition);
			} else if (multiWordExpanded) {
				selStart.ch -= blen;
				selEnd.ch -= blen;
				editor.setSelection(selStart, selEnd);
			} else {
				editor.setSelection(offToPos(so), offToPos(eo - (blen + alen)));
			}

			// Do Markup
		} else {
			editor.replaceSelection(beforeStr + selectedText + afterStr);
			if (wordExpanded) {
				noSelPosition.ch += blen;
				editor.setCursor(noSelPosition);
			} else if (multiWordExpanded) {
				selStart.ch += blen;
				selEnd.ch += blen;
				editor.setSelection(selStart, selEnd);
			} else {
				editor.setSelection(
					offToPos(so + blen),
					offToPos(so + blen + len)
				);
			}
		}
	}
}
