import * as constant from "const";
import { Editor, EditorPosition, EditorSelection, Notice, Plugin, requireApiVersion } from "obsidian";
declare module "obsidian" {
	// add type safety for the undocumented methods
	interface Editor {
		cm: {
			findWordAt?: (pos: EditorPosition) => EditorSelection;
			state?: { wordAt: (offset: number) => { from: number, to: number } };
		};
	}
	interface App {
		commands: { executeCommandById: (commandID: string) => void };
	}
	interface Vault {
		setConfig: (config: string, newValue: boolean) => void;
		getConfig: (config: string) => boolean;
	}
}

// needed for Chinese Word Delimiter Fix https://github.com/chrisgrieser/obsidian-smarter-md-hotkeys/pull/30
const posEqual = (a: EditorPosition, b: EditorPosition) => a.line === b.line && a.ch === b.ch;
const rangeEqual = (a: EditorSelection, b: EditorSelection) => posEqual(a.anchor, b.anchor) && posEqual(a.head, b.head);

export default class SmarterMDhotkeys extends Plugin {

	async onload() {
		constant.MD_COMMANDS.forEach((command) => {
			const { id, name, before, after } = command;
			this.addCommand({
				id,
				name,
				editorCallback: (editor) => this.expandAndWrap(before, after, editor),
			});
		});

		constant.OTHER_COMMANDS.forEach((command) => {
			const { id, name } = command;
			this.addCommand({
				id,
				name,
				callback: () => this.otherCommands(id),
			});
		});

		console.log("Smarter MD Hotkeys loaded.");
	}

	async onunload() { console.log("Smarter MD Hotkeys unloaded.") }

	async otherCommands(commandID: string) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return; // no file open

		// File Deletion
		if (commandID === "smarter-delete-current-file") {
			const runCommand = (str: string) => this.app.commands.executeCommandById(str);

			const deletionPromptEnabled = this.app.vault.getConfig("promptDelete");
			if (deletionPromptEnabled) {
				new Notice("This command requires that the core Obsidian setting \"Confirm file deletion\" is *disabled*.");
				return; // the quite simple method below only works the prompt is disabled.
			}

			runCommand("app:delete-file");
			runCommand("app:go-back");
			runCommand("app:go-back");
			new Notice("\"" + activeFile.name + "\" deleted.");

			// Copy Path
		} else if (commandID === "smarter-copy-path") {
			let noticeText;
			const relativePath = activeFile.path;
			// @ts-ignore, basePath not part of API
			const absolutePath = this.app.vault.adapter.basePath + "/" + relativePath;
			let parentFolder;
			if (relativePath.includes("/")) parentFolder = relativePath.replace(/(.*)\/.*/, "$1");
			else parentFolder = "/"; // root

			const currentClipboardText = await navigator.clipboard.readText();

			if (currentClipboardText === relativePath) {
				await navigator.clipboard.writeText(absolutePath);
				noticeText = "Absolute path copied: \n" + absolutePath;
			} else if (currentClipboardText === absolutePath) {
				await navigator.clipboard.writeText(parentFolder);
				noticeText = "Parent Folder copied: \n" + parentFolder;
			} else {
				await navigator.clipboard.writeText(relativePath);
				noticeText = "Relative path copied: \n" + relativePath;
			}

			// slightly longer Notice so a longer path can be read
			new Notice(noticeText, 7000); // eslint-disable-line no-magic-numbers

			// Copy File Name
		} else if (commandID === "smarter-copy-file-name") {
			const currentClipboardText = await navigator.clipboard.readText();
			let fileName = activeFile.basename;

			if (currentClipboardText === fileName) fileName += "." + activeFile.extension;
			await navigator.clipboard.writeText(fileName);

			new Notice("File Name copied: \n" + fileName);

			// Toggle Line Numbers
		} else if (commandID === "toggle-line-numbers") {
			const optionEnabled = this.app.vault.getConfig("showLineNumber");
			this.app.vault.setConfig("showLineNumber", !optionEnabled);

			// Toggle Readable Line Length
		} else if (commandID === "toggle-readable-line-length") {
			const optionEnabled = this.app.vault.getConfig("readableLineLength");
			this.app.vault.setConfig("readableLineLength", !optionEnabled);

			// Hide Notice
		} else if (commandID === "hide-notice") {
			const isVersionFifteen = requireApiVersion("0.15.0");
			if (isVersionFifteen) {
				// @ts-ignore
				for (const el of activeDocument.body.getElementsByClassName("notice")) el.hide();
			} else {
				// @ts-ignore
				for (const el of document.body.getElementsByClassName("notice")) el.hide();
			}
		}

	}

	async expandAndWrap(frontMarkup: string, endMarkup: string, editor: Editor) {
		interface contentChange {
			line: number;
			shift: number;
		}

		// Utility Functions TODO: export these to an `utils.ts`
		//-------------------------------------------------------------------
		const startOffset = () => editor.posToOffset(editor.getCursor("from"));
		const endOffset = () => editor.posToOffset(editor.getCursor("to"));
		const noteLength = () => editor.getValue().length;
		const offToPos = (offset: number) => {
			// prevent error when at the start or beginning of document
			if (offset < 0) offset = 0;
			if (offset > noteLength()) offset = noteLength();
			return editor.offsetToPos(offset);
		};
		function isOutsideSel(bef: string, aft: string) {
			const so = startOffset();
			const eo = endOffset();

			if (so - bef.length < 0) return false; // beginning of the document
			if (eo - aft.length > noteLength()) return false; // end of the document

			const charsBefore = editor.getRange(offToPos(so - bef.length), offToPos(so));
			const charsAfter = editor.getRange(offToPos(eo), offToPos(eo + aft.length));
			return charsBefore === bef && charsAfter === aft;
		}

		const isMultiLineMarkup = () => ["`", "%%", "<!--", "$"].includes(frontMarkup);
		const markupOutsideSel = () => isOutsideSel(frontMarkup, endMarkup);
		function markupOutsideMultiline(anchor: EditorPosition, head: EditorPosition) {
			if (anchor.line === 0) return false;
			if (head.line === editor.lastLine()) return false;

			const prevLineContent = editor.getLine(anchor.line - 1);
			const followLineContent = editor.getLine(head.line + 1);
			return prevLineContent.startsWith(frontMarkup) && followLineContent.startsWith(endMarkup);
		}

		const noSel = () => !editor.somethingSelected();
		const multiLineSel = () => editor.getSelection().includes("\n");


		function deleteLine(lineNo: number) {
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

		function log(msg: string, appendSelection?: boolean) {
			if (!constant.DEBUGGING) return;
			let appended = "";
			if (appendSelection) appended = ": \"" + editor.getSelection() + "\"";
			if (!msg.startsWith("\n")) msg = "- " + msg;
			console.log(msg + appended);
		}

		// Core Functions
		//-------------------------------------------------------------------
		function textUnderCursor(ep: EditorPosition) {

			// prevent underscores (wrongly counted as words) to be expanded to
			if (markupOutsideSel() && noSel()) return { anchor: ep, head: ep };

			let endPos, startPos;
			if (frontMarkup !== "`") {
				// https://codemirror.net/doc/manual.html#api_selection
				// https://codemirror.net/6/docs/ref/#state
				// https://github.com/argenos/nldates-obsidian/blob/e6b95969d7215b9ded2b72c4e319e35bc6022199/src/utils.ts#L16
				// https://github.com/obsidianmd/obsidian-api/blob/fac5e67f5d83829a4e0126905494c8cbca27765b/obsidian.d.ts#L787

				// TODO: update for mobile https://github.com/obsidianmd/obsidian-releases/pull/712#issuecomment-1004417481
				if (editor.cm instanceof window.CodeMirror) return editor.cm.findWordAt(ep); // CM5

				const word = editor.cm.state.wordAt(editor.posToOffset(ep)); // CM6
				if (!word) return { anchor: ep, head: ep }; // for when there is no word close by

				startPos = offToPos(word.from);
				endPos = offToPos(word.to);
			}

			// Inline-Code: use only space as delimiter
			if (frontMarkup === "`" || frontMarkup === "$") {
				log("Getting Code under Cursor");
				const so = editor.posToOffset(ep);
				let charAfter, charBefore;
				let [i, j, endReached, startReached] = [0, 0, false, false];

				while (!/\s/.test(charBefore) && !startReached) {
					charBefore = editor.getRange(offToPos(so - (i + 1)), offToPos(so - i));
					i++;
					if (so - (i - 1) === 0) startReached = true;
				}
				while (!/\s/.test(charAfter) && !endReached) {
					charAfter = editor.getRange(offToPos(so + j), offToPos(so + j + 1));
					j++;
					if (so + (j - 1) === noteLength()) endReached = true;
				}

				startPos = offToPos(so - (i - 1));
				endPos = offToPos(so + (j - 1));
			}

			return { anchor: startPos, head: endPos };
		}

		function trimSelection() {
			let trimAfter = constant.TRIMAFTER;
			let trimBefore = constant.TRIMBEFORE;

			// modify what to trim based on command
			if (isMultiLineMarkup()) {
				trimBefore = [frontMarkup];
				trimAfter = [endMarkup];
			} else if (endMarkup) { // check needed to ensure no special commands are added
				trimBefore.push(frontMarkup);
				trimAfter.push(endMarkup);
			}

			let selection = editor.getSelection();
			let so = startOffset();
			log("before trim", true);

			// before
			let trimFinished = false;
			while (!trimFinished) {
				let cleanCount = 0;
				trimBefore.forEach(str => {
					if (selection.startsWith(str)) {
						selection = selection.slice(str.length);
						so += str.length;
					}
					else cleanCount++;

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
			log("after trim", true);
		}

		function expandSelection() {
			trimSelection();
			log("before expandSelection", true);

			// expand to word
			const preSelExpAnchor = editor.getCursor("from");
			const preSelExpHead = editor.getCursor("to");

			const firstWordRange = textUnderCursor(preSelExpAnchor);
			let lastWordRange = textUnderCursor(preSelExpHead);

			// Chinese Word Delimiter Fix https://github.com/chrisgrieser/obsidian-smarter-md-hotkeys/pull/30
			if (!posEqual(preSelExpAnchor, preSelExpHead) && preSelExpHead.ch > 0) {
				const lastWordRangeInner = textUnderCursor({
					...preSelExpHead,
					ch: preSelExpHead.ch - 1,
				});
				// if the result of last word range is not the same as the result of
				// head going back one character, use the inner result
				if (!rangeEqual(lastWordRange, lastWordRangeInner)) lastWordRange = lastWordRangeInner;
			}

			editor.setSelection(firstWordRange.anchor, lastWordRange.head);
			log("after expandSelection", true);
			trimSelection();

			// has to come after trimming to include things like brackets
			const expandWhenOutside = constant.EXPANDWHENOUTSIDE;
			expandWhenOutside.forEach(pair => {
				if (pair[0] === frontMarkup || pair[1] === endMarkup) return; // allow undoing of the command creating the syntax
				const trimLastSpace = Boolean(pair[2]);

				if (isOutsideSel(pair[0], pair[1])) {
					firstWordRange.anchor.ch -= pair[0].length;
					lastWordRange.head.ch += pair[1].length;
					if (trimLastSpace) lastWordRange.head.ch--; // to avoid conflicts between trimming and expansion
					editor.setSelection(firstWordRange.anchor, lastWordRange.head);
				}
			});


			return { anchor: preSelExpAnchor, head: preSelExpHead };
		}

		function recalibratePos(pos: EditorPosition) {
			contentChangeList.forEach(change => {
				if (pos.line === change.line) pos.ch += change.shift;
			});
			return pos;
		}

		function applyMarkup(preAnchor: EditorPosition, preHead: EditorPosition, lineMode: string) {
			let selectedText = editor.getSelection();
			const so = startOffset();
			let eo = endOffset();

			// abort if empty line & multi, since no markup on empty line in between desired
			if (noSel() && lineMode === "multi") return;

			// Do Markup
			if (!markupOutsideSel()) {
				// insert extra space for comments
				if (["%%", "<!--"].includes(frontMarkup)) {
					selectedText = " " + selectedText + " ";
					// account for shift in positining for the cursor repositioning
					eo = eo + 2;
					blen++;
					alen++;
				}
				editor.replaceSelection(frontMarkup + selectedText + endMarkup);

				contentChangeList.push(
					{ line: preAnchor.line, shift: blen },
					{ line: preHead.line, shift: alen }
				);
				preAnchor.ch += blen;
				preHead.ch += blen;
			}

			// Undo Markup (outside selection, inside not necessary as trimmed already)
			if (markupOutsideSel()) {
				editor.setSelection(offToPos(so - blen), offToPos(eo + alen));
				editor.replaceSelection(selectedText);

				contentChangeList.push(
					{ line: preAnchor.line, shift: -blen },
					{ line: preHead.line, shift: -alen }
				);
				preAnchor.ch -= blen;
				preHead.ch -= blen;
			}

			if (lineMode === "single") editor.setSelection(preAnchor, preHead);
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
			else if (frontMarkup === "$") { // switch to block mathjax syntax instead of inline mathjax
				frontMarkup = "$$";
				endMarkup = "$$";
				alen = 2;
				blen = 2;
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

			// undo Block Markup
			if (markupOutsideMultiline(selAnchor, selHead)) {
				deleteLine(selAnchor.line - 1);
				deleteLine(selHead.line); // not "+1" due to shift from previous line deletion
			}
		}

		async function insertURLtoMDLink() {
			const URLregex = constant.URL_REGEX;
			const cbText = (await navigator.clipboard.readText()).trim();

			if (URLregex.test(cbText)) {
				endMarkup = "](" + cbText + ")";
				const urlExtension = cbText.split(".").pop();
				if (constant.IMAGEEXTENSIONS.includes(urlExtension)) frontMarkup = "![";
			} else if (!editor.somethingSelected() && cbText.length) {
				const shortenedText = cbText.length > 800 ? cbText.substring(0, 800) : cbText;//let's stay reasonable
				frontMarkup = "[" + shortenedText
			}
			return [frontMarkup, endMarkup];
		}

		function smartDelete() {
			// expand selection to prevent double spaces after deletion
			if (isOutsideSel(" ", "")) {
				const anchor = editor.getCursor("from");
				const head = editor.getCursor("to");
				if (anchor.ch) anchor.ch--; // do not apply to first line position
				editor.setSelection(anchor, head);
			}

			// delete
			editor.replaceSelection("");
		}

		function smartCaseSwitch(preAnchor: EditorPosition, preHead: EditorPosition) {
			function sentenceCase(str: string) {
				// Move i to index of first letter (using this trick: https://stackoverflow.com/a/32567789)
				let i = 0;
				while (str.charAt(i).toLowerCase() === str.charAt(i).toUpperCase()) {
					i++;
					if (i > str.length) break;
				}
				return str.charAt(i).toUpperCase() + str.slice(i + 1).toLowerCase();
			}

			let sel = editor.getSelection();

			// Other/Lower → Sentence, Sentence → Upper, Upper → Lower
			if (sel === sel.toLowerCase()) sel = sentenceCase(sel);
			else if (sel === sentenceCase(sel)) sel = sel.toUpperCase();
			else if (sel === sel.toUpperCase()) sel = sel.toLowerCase();
			else sel = sentenceCase(sel);

			editor.replaceSelection(sel);
			editor.setSelection(preAnchor, preHead);
		}

		// required to not apply some changes at the end of the function
		let doIt = true;
		// new parameters, line number et column from the loop before on multilines
		function smartHeading(direction: string, lineNumber = 0, column = 0) {
			// used later to check if we are multilines. if so lineNumb is defined
			const multiLines = Boolean(lineNumber);
			// if single line get variable else we already have them 
			if (lineNumber === 0) {
				lineNumber = editor.getCursor("head").line;
				column = editor.getCursor("head").ch;
			}

			const lineContent = editor.getLine(lineNumber);
			const hasHeading = lineContent.match(/^#{1,6}(?= )/);
			let currentHeadingLvl;
			let newLineContent;
			let newColumn;

			if (direction === "increase" && hasHeading) {
				currentHeadingLvl = hasHeading[0];
				// else if header >6 and not mutiline,ok. else multiline don't doIt  
				if (currentHeadingLvl.length < 6) {
					newLineContent = "#" + lineContent;
					newColumn = column + 1;
				} else if (multiLines === false) {
					newLineContent = lineContent.slice(7);
					if (column > 6) newColumn = column - 7;
					else newColumn = 0;
				} else doIt = false;
			} else if (direction === "increase" && !hasHeading) {
				newLineContent = "# " + lineContent;
				newColumn = column + 2;
			} else if (direction === "decrease" && hasHeading) {
				currentHeadingLvl = hasHeading[0];
				// same with decrease
				if (currentHeadingLvl.length > 1) {
					newLineContent = lineContent.slice(1);
					newColumn = column - 1;
				} else if (multiLines === false) {
					newLineContent = lineContent.slice(2);
					newColumn = column - 2;
				} else doIt = false;
			} else if (direction === "decrease" && !hasHeading) {
				newLineContent = "###### " + lineContent;
				newColumn = column + 7;
			}
			// if doIt we can do this
			if (doIt) {
				editor.setLine(lineNumber, newLineContent);
				editor.setCursor(lineNumber, newColumn);
			}
		}

		// MAIN
		//-------------------------------------------------------------------
		log("\nSmarterMD Hotkeys triggered\n---------------------------");

		// does not have to occur in multi-cursor loop since it already works
		// on every cursor
		if (frontMarkup === "new-line") {
			// @ts-expect-error, not typed
			editor.newlineOnly();
			return;
		}

		// TODO: remove this
		// eslint-disable-next-line require-atomic-updates
		if (endMarkup === "]()") [frontMarkup, endMarkup] = await insertURLtoMDLink();
		let blen = frontMarkup.length;
		let alen = endMarkup.length;

		// saves the amount of position shift for each line
		// used to calculate correct positions for multi-cursor
		const contentChangeList: contentChange[] = [];
		const allCursors = editor.listSelections();

		// sets markup for each cursor/selection
		allCursors.forEach(sel => {
			// account for shifts in Editor Positions due to applying markup to previous cursors
			sel.anchor = recalibratePos(sel.anchor);
			sel.head = recalibratePos(sel.head);
			editor.setSelection(sel.anchor, sel.head);

			// prevent things like triple-click selection from triggering multi-line
			trimSelection();

			// run special cases instead
			if (frontMarkup === "delete") {
				log("Smart Delete");
				expandSelection();
				smartDelete();
			}
			else if (frontMarkup === "case-switch") {
				log("Smart Case Switch");
				const { anchor: preSelExpAnchor, head: preSelExpHead } = expandSelection();
				smartCaseSwitch(preSelExpAnchor, preSelExpHead);
			} else if (frontMarkup === "heading") {
				log("Smart Toggle Heading");
				// get selection range and check if several lines
				const selected = editor.getSelection();
				if (selected && selected.includes("\n")) {
					const { line: from, ch: col0 } = editor.getCursor("from");
					const { line: to, ch: col1 } = editor.getCursor("to");
					// for each line in range if header apply smartHeading
					Array.from({ length: to - from + 1 }, (x, i) => {
						const lineNumber = from + i;
						const lineContent = editor.getLine(from + i);
						if (lineContent.match(/^#{1,6}(?= )/)) {
							smartHeading(endMarkup, lineNumber, col1);
							// keep selection on each loop
							editor.setSelection(
								{ line: from, ch: col0 },
								{ line: to, ch: col1 }
							);
						}
					});
					// 1 line smartHeading
				} else
					smartHeading(endMarkup);

			}

			// wrap single line selection
			else if (!multiLineSel()) {
				log("single line");
				const { anchor: preSelExpAnchor, head: preSelExpHead } = expandSelection();
				applyMarkup(preSelExpAnchor, preSelExpHead, "single");
			}
			// Wrap multi-line selection
			else if (multiLineSel() && isMultiLineMarkup()) {
				log("Multiline Wrap");
				wrapMultiLine();
			}
			// Wrap *each* line of multi-line selection
			else if (multiLineSel() && !isMultiLineMarkup()) {
				let pointerOff = startOffset();
				const lines = editor.getSelection().split("\n");
				log("lines: " + lines.length.toString());

				// get offsets for each line and apply markup to each
				lines.forEach(line => {
					console.log("");
					editor.setSelection(offToPos(pointerOff), offToPos(pointerOff + line.length));

					const { anchor: preSelExpAnchor, head: preSelExpHead } = expandSelection();

					// Move Pointer to next line
					pointerOff += line.length + 1; // +1 to account for line break
					if (markupOutsideSel()) pointerOff -= blen + alen; // account for removed markup
					else pointerOff += blen + alen; // account for added markup

					applyMarkup(preSelExpAnchor, preSelExpHead, "multi");
				});
			}
		});

	}
}
