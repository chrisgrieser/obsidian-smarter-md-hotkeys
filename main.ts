import { COMMANDS } from "const";
import { Editor, EditorPosition, Plugin } from "obsidian";
declare module "obsidian" {
	// add type safety for the undocumented method
	interface Editor {
		cm: {
			findWordAt?: (pos: EditorPosition) => EditorSelection;
			state?: { wordAt: (offset: number) => { from: number, to: number} };
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

	async onunload() { console.log("Smarter MD Hotkeys unloaded.") }

	async expandAndWrap(frontMarkup: string, endMarkup: string, editor: Editor) {
		const debug = true;
		interface contentChange {
			line: number;
			shift: number;
		}

		// Utility Functions
		//-------------------------------------------------------------------
		function isOutsideSel (bef:string, aft:string) {
			const so = startOffset();
			const eo = endOffset();

			if ((so - bef.length) < 0) return false; // beginning of the document
			if ((eo - aft.length) > noteLength()) return false; // end of the document

			const charsBefore = editor.getRange(offToPos(so - bef.length), offToPos(so));
			const charsAfter = editor.getRange(offToPos(eo), offToPos(eo + aft.length));
			return (charsBefore === bef && charsAfter === aft);
		}
		const multiLineMarkup = () => (frontMarkup === "`" || frontMarkup === "%%" || frontMarkup === "<!--");
		const markupOutsideSel = () => isOutsideSel (frontMarkup, endMarkup);
		function markupOutsideMultiline (anchor: EditorPosition, head: EditorPosition) {
			if (anchor.line === 0) return false;
			if (head.line === editor.lastLine()) return false;

			const prevLineContent = editor.getLine(anchor.line - 1);
			const followLineContent = editor.getLine(head.line + 1);
			return (prevLineContent.startsWith(frontMarkup) && followLineContent.startsWith(endMarkup));
		}

		const noSel = () => !editor.somethingSelected();
		const multiLineSel = () => editor.getSelection().includes("\n");
		const noteLength = () => (editor.getValue()).length;

		const startOffset = () => editor.posToOffset(editor.getCursor("from"));
		const endOffset = () => editor.posToOffset(editor.getCursor("to"));
		const offToPos = (offset: number) => {

			// prevent error when at the start or beginning of document
			if (offset < 0) offset = 0;
			if (offset > noteLength()) offset = noteLength();

			return editor.offsetToPos(offset);
		};

		function deleteLine (lineNo: number) {
			// there is no 'next line' when cursor is on the last line
			if (lineNo < editor.lastLine()) {
				const lineStart = { line: lineNo, ch: 0 };
				const nextLineStart = { line: lineNo + 1, ch: 0 };
				editor.replaceRange("", lineStart, nextLineStart);
			} else {
				const previousLineEnd = { line: lineNo - 1, ch: editor.getLine(lineNo).length };
				const lineEnd = { line: lineNo, ch: editor.getLine(lineNo).length };
				editor.replaceRange("", previousLineEnd, lineEnd);
			}
		}

		function log (msg: string, appendSelection?: boolean) {
			if (!debug) return;
			let appended = "";
			if (appendSelection) appended = ": \"" + editor.getSelection() + "\"";
			if (!msg.startsWith("\n")) msg = "- " + msg;
			console.log(msg + appended);
		}

		// Core Functions
		//-------------------------------------------------------------------
		function textUnderCursor (ep: EditorPosition) {

			// prevent underscores (wrongly counted as words) to be expanded to
			if (markupOutsideSel() && noSel()) return { anchor: ep, head: ep };

			let endPos, startPos;
			if (frontMarkup !== "`") {
				// https://codemirror.net/doc/manual.html#api_selection
				// https://codemirror.net/6/docs/ref/#state
				// https://github.com/argenos/nldates-obsidian/blob/e6b95969d7215b9ded2b72c4e319e35bc6022199/src/utils.ts#L16
				// https://github.com/obsidianmd/obsidian-api/blob/fac5e67f5d83829a4e0126905494c8cbca27765b/obsidian.d.ts#L787

				if (editor.cm instanceof window.CodeMirror) return editor.cm.findWordAt(ep); // CM5

				const word = editor.cm.state.wordAt(editor.posToOffset (ep)); // CM6
				if (!word) return { anchor: ep, head: ep }; // for when there is no word close by

				startPos = offToPos(word.from);
				endPos = offToPos(word.to);
			}

			// Inline-Code: use only space as delimiter
			if (frontMarkup === "`") {
				log ("Getting Code under Cursor");
				const so = editor.posToOffset(ep);
				let charAfter, charBefore;
				let [i, j, endReached, startReached] = [0, 0, false, false];

				while (!/\s/.test(charBefore) && !startReached) {
					charBefore = editor.getRange(offToPos(so - (i+1)), offToPos(so - i));
					i++;
					if (so-(i-1) === 0) startReached = true;
				}
				while (!/\s/.test(charAfter) && !endReached) {
					charAfter = editor.getRange(offToPos(so + j), offToPos(so + j+1));
					j++;
					if (so+(j-1) === noteLength()) endReached = true;
				}

				startPos = offToPos(so - (i-1));
				endPos = offToPos(so + (j-1));
			}

			return { anchor: startPos, head: endPos };
		}

		function trimSelection() {
			let trimBefore = [
				"###### ",
				"##### ",
				"#### ",
				"### ",
				"## ",
				"# ",
				"- [ ] ",
				"- [x] ",
				"- ",
				" ",
				"\n",
				"\t",
				frontMarkup
			];
			const trimAfter = [" ", "\n", "\t", endMarkup];

			if (frontMarkup === "%%") trimBefore = [frontMarkup];

			let selection = editor.getSelection();
			let so = startOffset();
			log ("before trim", true);

			// before
			let trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimBefore.forEach(str => {
					if (selection.startsWith(str)) {
						selection = selection.slice(str.length);
						so += str.length;
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
			if (blockID) selection = selection.slice(0, -blockID[0].length);


			editor.setSelection(offToPos(so), offToPos(so + selection.length));
			log ("after trim", true);
		}

		function expandToWordBoundary () {
			const originalSel = editor.getSelection();
			trimSelection();
			log ("before expandToWordBoundary", true);
			const preSelExpAnchor = editor.getCursor("from");
			const preSelExpHead = editor.getCursor("to");

			const firstWordRange = textUnderCursor(preSelExpAnchor);
			const lastWordRange = textUnderCursor(preSelExpHead);

			editor.setSelection(firstWordRange.anchor, lastWordRange.head);

			// include quotation marks, if they are at both ends of selection
			if (isOutsideSel ("\"", "\"") || isOutsideSel ("'", "'")) {
				firstWordRange.anchor.ch--;
				lastWordRange.head.ch++;
				editor.setSelection(firstWordRange.anchor, lastWordRange.head);
			}

			log ("after punctuation fix", true);
			trimSelection();
			return { anchor: preSelExpAnchor, head: preSelExpHead };
		}

		function recalibratePos (pos: EditorPosition) {
			contentChangeList.forEach (change => {
				if (pos.line === change.line) pos.ch += change.shift;
			});
			return pos;
		}

		function applyMarkup (preSelExpAnchor: EditorPosition, preSelExpHead: EditorPosition, lineMode: string ) {
			const selectedText = editor.getSelection();
			const so = startOffset();
			const eo = endOffset();
			const anchor = preSelExpAnchor;
			const head = preSelExpHead;

			// abort if empty line & multi, since no markup on empty line in between desired
			if (noSel() && lineMode === "multi") return;

			// Do Markup
			if (!markupOutsideSel()) {
				editor.replaceSelection(frontMarkup + selectedText + endMarkup);
				contentChangeList.push(
					{ line: anchor.line, shift: blen },
					{ line: head.line, shift: alen }
				);
				anchor.ch += blen;
				head.ch += blen;
			}

			// Undo Markup (outside selection, inside not necessary as trimmed already)
			if (markupOutsideSel()) {
				editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
				editor.replaceSelection(selectedText);
				contentChangeList.push(
					{ line: anchor.line, shift: -blen },
					{ line: head.line, shift: -alen }
				);
				anchor.ch -= blen;
				head.ch -= blen;
			}

			if (lineMode === "single") editor.setSelection(anchor, head);
		}

		function wrapMultiLine() {
			const selAnchor = editor.getCursor("from");
			selAnchor.ch = 0;
			const selHead = editor.getCursor("to");
			selHead.ch = editor.getLine(selHead.line).length;

			if (frontMarkup === "`") { // switch to fenced code instead of inline code
				frontMarkup = "```";
				endMarkup = "```";
				alen = 3;
				blen = 3;
			}

			// do Markup
			if (!markupOutsideMultiline(selAnchor, selHead)) {
				editor.setSelection(selAnchor);
				editor.replaceSelection(frontMarkup + "\n");
				selHead.line++; // extra line to account for shift from inserting frontMarkup
				editor.setSelection(selHead);
				editor.replaceSelection("\n" + endMarkup);

				// when fenced code, position cursor for language definition
				if (frontMarkup === "```") {
					const languageDefPos = selAnchor;
					languageDefPos.ch = 3;
					editor.setSelection(languageDefPos);
				}
			}

			// undo Markup
			if (markupOutsideMultiline(selAnchor, selHead)) {
				deleteLine(selAnchor.line - 1);
				deleteLine(selHead.line + 1);
			}
		}

		async function insertURLtoMDLink () {
			const URLregex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/; // eslint-disable-line no-useless-escape
			const imageURLregex = /\.(png|jpe?g|gif|tiff?)$/;
			const cbText = (await navigator.clipboard.readText()).trim();

			let frontMarkup_ = frontMarkup;
			let endMarkup_ = endMarkup;
			if (URLregex.test(cbText)) {
				endMarkup_ = "](" + cbText + ")";
				if (imageURLregex.test(cbText)) frontMarkup_ = "![";
			}
			return [frontMarkup_, endMarkup_];
		}


		// MAIN
		//-------------------------------------------------------------------
		log("\nSmarterMD Hotkeys triggered\n---------------------------");

		if (endMarkup === "]()") [frontMarkup, endMarkup] = await insertURLtoMDLink();
		let [blen, alen] = [frontMarkup.length, endMarkup.length];

		// saves the amount of position shift for each line
		// used to calculate correct positions for multi-cursor
		const contentChangeList: contentChange[] = [];
		const allCursors = editor.listSelections();

		// sets markup for each cursor/selection
		allCursors.forEach(sel => {

			// account for shifts in Editor Positions due to applying markup to previous cursors
			sel.anchor = recalibratePos (sel.anchor);
			sel.head = recalibratePos (sel.head);

			editor.setSelection(sel.anchor, sel.head); // set the selection to the one current cursor
			trimSelection(); // prevent things like triple-click selection from triggering multi-line

			// wrap single line selection
			if (!multiLineSel()) {
				log ("single line");
				const { anchor: preSelExpAnchor, head: preSelExpHead } = expandToWordBoundary();
				applyMarkup(preSelExpAnchor, preSelExpHead, "single");
				return;
			}

			// Wrap multi line selection
			if (multiLineSel() && multiLineMarkup()) {
				log ("Multiline Wrap");
				wrapMultiLine();
				return;
			}

			// Wrap *each* line selection
			if (multiLineSel() && !multiLineMarkup()) {
				let pointerOff = startOffset();
				const lines = editor.getSelection().split("\n");
				log ("lines: " + lines.length.toString());

				// get offsets for each line and apply markup to each
				lines.forEach (line => {
					console.log("");
					editor.setSelection(offToPos(pointerOff), offToPos(pointerOff + line.length));

					const { anchor: preSelExpAnchor, head: preSelExpHead } = expandToWordBoundary();

					// Move Pointer to next line
					pointerOff += line.length + 1; // +1 to account for line break
					if (markupOutsideSel()) pointerOff-= (blen + alen); // account for removed markup
					else pointerOff += (blen + alen); // account for added markup

					applyMarkup(preSelExpAnchor, preSelExpHead, "multi");
				});
			}
		});


	}
}
