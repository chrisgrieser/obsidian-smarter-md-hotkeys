# Smarter Markdown Hotkeys

![](https://img.shields.io/github/downloads/chrisgrieser/obsidian-smarter-md-hotkeys/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/obsidian-smarter-md-hotkeys?label=Latest%20Release&style=plastic) [![](https://img.shields.io/badge/changelog-click%20here-FFE800?style=plastic)](Changelog.md)

[Obsidian](https://obsidian.md/) plugin that adds Markdown hotkeys that automatically select words before applying markup.

When using the hotkeys, the markup is automatically applied to the whole word(s) under the cursor. As long as you prefer to write `*laziness*` instead of `lazi**ness`, this plugin saves you the time of selecting text.

<img src="https://i.imgur.com/1Gx5OqA.gif" alt="demo video" width=35%> <img src="https://user-images.githubusercontent.com/73286100/144943354-433d0fec-4f02-4a1c-b5a9-84ca1a57226e.gif" alt="Screen Recording 2021-12-07 at 01 14 40" width=40%>


## Table of Content
<!-- MarkdownTOC -->

- [Commands added](#commands-added)
- [Setting the Hotkeys](#setting-the-hotkeys)
- [Specifics for certain commands](#specifics-for-certain-commands)
- [Limitations](#limitations)
- [Installation](#installation)
- [Contribute](#contribute)
- [Credits](#credits)
	- [Thanks](#thanks)
	- [Donations](#donations)
	- [About the Developer](#about-the-developer)

<!-- /MarkdownTOC -->

## Commands added
- Smarter Bold
- Smarter Italics
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

## Specifics for certain commands
- `Smarter Inline Code` will __not__ consider punctuation and brackets as delimiters. This means that a cursor in "object.method" will be selected the whole term instead of "object" alone.

## Limitations
Currently, does only work with one cursor/one selection.

## Installation
Right now, the plugin is still in beta. It can be installed with the [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat).

This plugin will be available in Obsidian's Community Plugin Browser: `Settings` → `Community Plugins` → `Browse` → Search for *"Smarter Markdown Hotkeys"*

## Contribute
Please use the `.eslintrc` configuration located in the repository and run eslint before doing a pull request, though. 🙂

```shell
# install eslint
npm install eslint

# Run eslint fixing most common mistakes
eslint --fix *.ts

# Then, fix the errors that cannot be auto-fixed.
```

## Credits

### Thanks
Thanks yet again to @SkepticMystic for his support.

### Donations
Donations via [PayPal](https://www.paypal.com/paypalme/ChrisGrieser) or [Ko-Fi](https://ko-fi.com/pseudometa)! 🙏

### About the Developer
In my day job, I am a researcher and sociology. In my phD project, I investigate the governance of the app economy and how software ecosystems manage the tension between innovation and compatibility. If you are interested in this subject, feel free to visit [my academic homepage](https://chris-grieser.de/) and get in touch!

- [Discord](https://discord.gg/veuWUTm): `@pseudometa#9546`
- Twitter: [@pseudo_meta](https://twitter.com/pseudo_meta)

[^1]: MacOS uses `cmd`, Windows and Linux use `ctrl`.
