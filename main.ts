import { MarkdownView, Plugin, EditorPosition, Editor } from "obsidian";

export default class SmarterMDhotkeys extends Plugin {
	async onload() {
		this.addCommand({
			id: "smarter-asterisk-bold",
			name: "Smarter Bold",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("**", "**", editor),
		});
		this.addCommand({
			id: "smarter-underscore-bold",
			name: "Smarter Underscore Bold",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("__", "__", editor),
		});
		this.addCommand({
			id: "smarter-asterisk-italics",
			name: "Smarter Italics",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("*", "*", editor),
		});
		this.addCommand({
			id: "smarter-underscore-italics",
			name: "Smarter Underscore Italics",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("_", "_", editor),
		});
		this.addCommand({
			id: "smarter-comments",
			name: "Smarter Comments",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("%%", "%%", editor),
		});
		this.addCommand({
			id: "smarter-inline-code",
			name: "Smarter Inline Code",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("`", "`", editor),
		});
		this.addCommand({
			id: "smarter-highlight",
			name: "Smarter Highlight",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("==", "==", editor),
		});
		this.addCommand({
			id: "smarter-strikethrough",
			name: "Smarter Strikethrough",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("~~", "~~", editor),
		});
		this.addCommand({
			id: "smarter-wikilink",
			name: "Smarter wikilink (internal link)",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("[[", "]]", editor),
		});
		this.addCommand({
			id: "smarter-md-link",
			name: "Smarter Markdown Link",
			editorCallback: (editor: Editor, view: MarkdownView) => this
				.expandAndWrap("[", "]()", editor),
		});

		console.log ("Smarter MD Hotkeys loaded.");
	}

	async onunload() {
		console.log ("Smarter MD Hotkeys unloaded.");
	}

	expandAndWrap(beforeStr: string, afterStr: string, editor: Editor): void {

		function offToPos(offset: number): EditorPosition {
			return editor.offsetToPos(offset);
		}
		function WordUnderCursor (ep: EditorPosition): Range{
			// https://codemirror.net/doc/manual.html#api_selection
			if (editor.cm?.findWordAt) return editor.cm.findWordAt(ep); //CM5
			else if (editor.cm?.state.wordAt) return editor.cm.state.wordAt(editor.posToOffset(ep)); //CM6
		}
		function trimSelection (trimBefArray: string[], trimAftArray: string[], editor: Editor): void{
			let selection = editor.getSelection();
			let sp = editor.posToOffset(editor.getCursor("from"));

			//before
			let trimFinished = false;
			while (!trimFinished){
				let cleanCount = 0;
				trimBefArray.forEach(str =>{
					if (selection.startsWith(str)) {
						selection = selection.slice (str.length);
						sp += str.length;
					} else cleanCount++;
				});
				if (cleanCount == trimBefArray.length || selection.length == 0) trimFinished = true;
			}

			//after
			trimFinished = false;
			while (!trimFinished){
				let cleanCount = 0;
				trimAftArray.forEach(str =>{
					if (selection.endsWith(str)) selection = selection.slice (0, -str.length);
					else cleanCount++;
				});
				if (cleanCount == trimAftArray.length || selection.length == 0) trimFinished = true;
			}

			//block-ID
			const blockID = selection.match(/ \^\w+$/);
			if (blockID != null) selection = selection.slice (0, -blockID[0].length);

			if (selection.length == 0) return; //dont change selection when only irrelevant characters where selected
			editor.setSelection(offToPos(sp), offToPos(sp + selection.length));
		}

		const blen = beforeStr.length;
		const alen = afterStr.length;
		let wordExpanded = false;
		let multiWordExpanded = false;

		// Expand Selection to Word if there is no selection
		const noSelPosition = editor.getCursor()
		if (!editor.somethingSelected()) {
			const wordRange = WordUnderCursor (noSelPosition);
			editor.setSelection(wordRange.anchor, wordRange.head);
			wordExpanded = true;
		}

		// Trim selection in case of leading or trailing spaces
		const trimBefore = ["- [ ] ", "- [x] ", "- ", " ", "\n", "\t"];
		const trimAfter = [" ", "\n", "\t"];
		trimSelection(trimBefore, trimAfter, editor);

		// Expand selection to word boundaries if multiple words
		const selStart = editor.getCursor("from");
		const selEnd = editor.getCursor("to");
		if (editor.getSelection().includes(" ")){
			const firstWordRange = WordUnderCursor (selStart);
			const lastWordRange = WordUnderCursor (selEnd);
			editor.setSelection(firstWordRange.anchor, lastWordRange.head);
			multiWordExpanded = true;
		}

		// Get properties of selection
		const selectedText = editor.getSelection();
		const sp = editor.posToOffset(editor.getCursor("from")); // Starting position
		const len = editor.getSelection().length;
		const charsBefore = editor.getRange(offToPos(sp - blen), offToPos(sp));
		const charsAfter = editor.getRange(offToPos(sp + len), offToPos(sp + len + alen));
		const firstChars = editor.getRange(offToPos(sp), offToPos(sp + blen));
		const lastChars = editor.getRange(offToPos(sp + len - alen), offToPos(sp + len));

		// Undo surrounding markup (outside selection)
		if (charsBefore == beforeStr && charsAfter == afterStr) {
			editor.setSelection(offToPos(sp - blen), offToPos(sp + len + alen));
			editor.replaceSelection(selectedText);
			if (wordExpanded) {
				noSelPosition.ch -= blen;
				editor.setCursor(noSelPosition);
			} else if (multiWordExpanded){
				selStart.ch -= blen;
				selEnd.ch -= blen;
				editor.setSelection(selStart, selEnd);
			} else {
				editor.setSelection(offToPos(sp - blen), offToPos(sp - blen + len));
			}

		// Undo surrounding markup (inside selection)
		} else if (firstChars == beforeStr && lastChars == afterStr) {
			editor.replaceSelection(selectedText.slice(blen,-alen));
			if (wordExpanded) { //has to be considered, because findWordAt considers underscores as word-parts
				noSelPosition.ch -= blen;
				editor.setCursor(noSelPosition);
			} else if (multiWordExpanded){
				selStart.ch -= blen;
				selEnd.ch -= blen;
				editor.setSelection(selStart, selEnd);
			} else {
				editor.setSelection(offToPos(sp), offToPos(sp + len - (blen + alen)));
			}

		// Do Markup
		} else {
			editor.replaceSelection(beforeStr + selectedText + afterStr);
			if (wordExpanded) {
				noSelPosition.ch += blen;
				editor.setCursor(noSelPosition);
			} else if (multiWordExpanded){
				selStart.ch += blen;
				selEnd.ch += blen;
				editor.setSelection(selStart, selEnd);
			} else {
				editor.setSelection(offToPos(sp + blen), offToPos(sp + blen + len));
			}
		}


	}
}
