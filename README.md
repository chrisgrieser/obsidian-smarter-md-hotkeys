# Smarter Markdown Hotkeys

![](https://img.shields.io/github/downloads/chrisgrieser/obsidian-smarter-md-hotkeys/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/obsidian-smarter-md-hotkeys?label=Latest%20Release&style=plastic)

[Obsidian](https://obsidian.md/) plugin that adds Markdown hotkeys that automatically select words before applying markup.

When using the hotkeys, the markup is automatically appied to the whole word(s) under the cursor. As long as you prefer to write `*laziness*` instead of `lazi**ness`, this plugin saves you the time of selecting text.

<img src="https://i.imgur.com/1Gx5OqA.gif" alt="demo video" width=35%>

## Commands added
- Smarter Bold (`**foobar**`)
- Smarter Italics (`*foobar*`)
- Smarter Underscore Bold (`__foobar__`)
- Smarter Underscore Italics (`_foobar_`)
- Smarter Comment
- Smarter Inline Code
- Smarter Highlight
- Smarter Strikethrough
- Smarter Markdown Link
- Smarter Wikilink (Internal Link)

## Setting the Hotkeys
💡 If you want to replace the default commands from Obsidian, remember to remove their hotkey binding before changing the hotkeys from this plugin. Example for `Smarter Bold`:
1. Remove the hotkey `cmd/ctrl + B`[^1] for the default command `Toggle Bold`.
2. Assign `cmd/ctrl + B` as the hotkey for the command `Smarter Bold`.

## Installation
Right now, the plugin is still in beta. It can be installed with the [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat).

This plugin will be available in Obsidian's Community Plugin Browser: `Settings` → `Community Plugins` → `Browse` → Search for *"Smarter Markdown Hotkeys"*

## Credits
Thanks yet again to @SkepticMystic for his support.

Donations via [PayPal](https://www.paypal.com/paypalme/ChrisGrieser) or [Ko-Fi](https://ko-fi.com/pseudometa)! 🙏

This plugin has been created by @pseudometa#9546 ([Discord](https://discord.gg/veuWUTm)) aka [@pseudo_meta (Twitter)](https://twitter.com/pseudo_meta) aka Chris Grieser (rl). In my day job, I am a PhD student in sociology, studying the governance of the app economy. If you are interested in this subject, check out [my academic homepage](https://chris-grieser.de/) and get in touch.

[^1]: MacOS uses `cmd`, Windows and Linux use `ctrl`.
