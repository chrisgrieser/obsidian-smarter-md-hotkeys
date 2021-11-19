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

    function Cursor(pos: number): EditorPosition {
      return editor.offsetToPos(pos);
    }

    function WordUnderCursor (cur: Cursor): Range{
      // https://codemirror.net/doc/manual.html#api_selection
      if (editor.cm?.findWordAt) {
        return editor.cm.findWordAt(cur); //CM5
      } else if (editor.cm?.state.wordAt) {
        return editor.cm.state.wordAt(editor.posToOffset(cur)); //CM6
      }
    }

    // Expand Selection to Word if there is no selection
    let wordExpanded = false;
    const noSelPosition = editor.getCursor()
    if (!editor.somethingSelected()) {
      const wordRange = WordUnderCursor (noSelPosition);
      editor.setSelection(wordRange.anchor, wordRange.head);
      wordExpanded = true;
    }

    // Expand selection to word boundaries if multiple words
    let multiWordExpanded = false;
    const selStart = editor.getCursor("from");
    const selEnd = editor.getCursor("to");
    if (editor.getSelection().trim().includes(" ")){
      const firstWordRange = WordUnderCursor (selStart);
      const lastWordRange = WordUnderCursor (selEnd);
      editor.setSelection(firstWordRange.anchor, lastWordRange.head);
      multiWordExpanded = true;
    }

    // Set Selection
    const selectedText = editor.getSelection();
    const sp = editor.posToOffset(editor.getCursor("from")); // Starting position
    const len = selectedText.length;
    const blen = beforeStr.length;
    const alen = afterStr.length;

    // Undo surrounding markup
    const charsBefore = editor.getRange(Cursor(sp - blen), Cursor(sp));
    const charsAfter = editor.getRange(Cursor(sp + len), Cursor(sp + len + alen));
    const firstChars = editor.getRange(Cursor(sp), Cursor(sp + blen));
    const lastChars = editor.getRange(Cursor(sp + len - alen), Cursor(sp + len));

    // Undo surrounding markup (outside selection)
    if (charsBefore == beforeStr && charsAfter == afterStr) {
      editor.setSelection(Cursor(sp - blen), Cursor(sp + len + alen));
      editor.replaceSelection(selectedText);
      if (wordExpanded) {
        noSelPosition.ch -= blen;
        editor.setCursor(noSelPosition);
      } else if (multiWordExpanded){
        editor.setSelection(selStart, selEnd);
      } else {
        editor.setSelection(Cursor(sp - blen), Cursor(sp - blen + len));
      }

    // Undo surrounding markup (inside selection)
    } else if (firstChars == beforeStr && lastChars == afterStr) {
      editor.replaceSelection(selectedText.slice(blen,-alen));
      editor.setSelection(Cursor(sp), Cursor(sp + len - (blen + alen)));

    // Do Markup
    } else {
      editor.replaceSelection(beforeStr + selectedText + afterStr);
      if (wordExpanded) {
        noSelPosition.ch += blen;
        editor.setCursor(noSelPosition);
      } else if (multiWordExpanded){
        editor.setSelection(selStart, selEnd);
      } else {
        editor.setSelection(Cursor(sp + blen), Cursor(sp + blen + len));
      }
    }


  }
}
