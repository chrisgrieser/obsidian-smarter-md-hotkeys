import { MarkdownView, Plugin, EditorPosition, Editor } from "obsidian";

export default class LazyMDhotkeys extends Plugin {
  async onload() {
    this.addCommand({
      id: "lazy-bold",
      name: "Lazy Bold",
      editorCallback: (editor: Editor, view: MarkdownView) => this
        .expandAndWrap("**", "**", editor),
    });

    console.log ("Lazy MD Hotkeys Plugin loaded.");
  }

  async onunload() {
    console.log ("Lazy MD Hotkeys Plugin unloaded.");
  }

  expandAndWrap(beforeStr: string, afterStr: string, editor: Editor): void {

    let selectedText = "";
    if (editor.somethingSelected()) selectedText = editor.getSelection();

    function Cursor(pos: number): EditorPosition {
      return editor.offsetToPos(pos);
    }

    // Detect whether the selected text is surrounded with Syntax
    // If true, unpack it, else pack with Syntax
    // ------------------------------------------------
    const sp = editor.posToOffset(editor.getCursor("from")); // Starting position
    const len = selectedText.length;
    const blen = beforeStr.length;
    const alen = afterStr.length;

    const charsBefore = editor.getRange(Cursor(sp - blen), Cursor(sp));
    const charsAfter = editor.getRange(Cursor(sp + len), Cursor(sp + len + alen));

    const firstChars = editor.getRange(Cursor(sp), Cursor(sp + blen));
    const lastChars = editor.getRange(Cursor(sp + len - alen), Cursor(sp + len));

   // Undo surrounding Syntax (outside selection)
    if (charsBefore == beforeStr && charsAfter == afterStr) {
      editor.setSelection(Cursor(sp - blen), Cursor(sp + len + alen));
      editor.replaceSelection(selectedText);
      editor.setSelection(Cursor(sp - blen), Cursor(sp - blen + len));

   // Undo surrounding Syntax (inside selection)
    } else if (firstChars == beforeStr && lastChars == afterStr) {
      editor.replaceSelection(selectedText.slice(blen,-alen));
      editor.setSelection(Cursor(sp), Cursor(sp + len - (blen + alen)));

   // Wrap Syntax around Selection
    } else {
      if (selectedText) {
        editor.replaceSelection(beforeStr + selectedText + afterStr);
        editor.setSelection(Cursor(sp + blen), Cursor(sp + blen + len));
   // No Selection
      } else {
        editor.replaceSelection(beforeStr + afterStr);
        const cursor = editor.getCursor();
        cursor.ch -= alen;
        editor.setCursor(cursor);
      }
    }


  }
}
