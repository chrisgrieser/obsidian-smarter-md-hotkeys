# Lazy Markdown Hotkeys

![](https://img.shields.io/github/downloads/chrisgrieser/obsidian-lazy-markdown-hotkeys/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/obsidian-lazy-markdown-hotkeys?label=Latest%20Release&style=plastic)

[Obsidian](https://obsidian.md/) plugin that adds Markdown hotkeys that automatically select words before applying markup.

When using the hotkey, the selection is automatically expanded to the whole word(s) before applying the markup. As long as you prefer to write `*laziness*` over `lazi**ness`, this plugin save you the time of selecting the word(s) under the cursor.

`Placeholder: demo video`

## Commands added

Essentially, all basic Markdown commands for applying markup to words are added:

- Lazy Bold
- Lazy Italics
- Lazy Comment
- Lazy Inline Code
- Lazy Highlight
- Lazy Strikethrough
- Lazy Markdown Link
- Lazy Wikilink

***

💡 If you want to replace the default commands from Obsidian, remember to remove their hotkey binding before changing the hotkeys from this plugin. Example for `Lazy Bold`:
1. Remove the hotkey `cmd/ctrl + B`[^1] for the default command `Toggle Bold`.
2. Assign `cmd/ctrl + B` as the hotkey for the command `Lazy Bold`.

## Installation
Right now, the plugin is still in beta. It can be installed with the [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat).

This plugin will be available in Obsidian's Community Plugin Browser: `Settings` → `Community Plugins` → `Browse` → Search for *"Lazy Markdown Hotkeys"*

## Credits

Donations via [PayPal](https://www.paypal.com/paypalme/ChrisGrieser) or [Ko-Fi](https://ko-fi.com/pseudometa) are much appreciated! 🙏

This plugin has been created by @pseudometa#9546 ([Discord](https://discord.gg/veuWUTm)) aka [@pseudo_meta (Twitter)](https://twitter.com/pseudo_meta) aka Chris Grieser (rl). In my day job, I am a PhD student in sociology, studying the governance of the app economy. If you are interested in this subject, check out [my academic homepage](https://chris-grieser.de/) and get in touch.

[^1]: MacOS uses `cmd`, Windows and Linux use `ctrl`.
