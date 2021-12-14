# Smarter Markdown Hotkeys

![](https://img.shields.io/github/downloads/chrisgrieser/obsidian-smarter-md-hotkeys/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/obsidian-smarter-md-hotkeys?label=Latest%20Release&style=plastic) [![](https://img.shields.io/badge/changelog-click%20here-FFE800?style=plastic)](Changelog.md)

[Obsidian](https://obsidian.md/) plugin that adds Markdown hotkeys that automatically select words before applying markup.

When using the hotkeys, the markup is automatically applied to the whole word(s) under the cursor. As long as you prefer to write `*laziness*` instead of `lazi**ness`, this plugin saves you the time of selecting text.

<img src="https://i.imgur.com/1Gx5OqA.gif" alt="demo video" width=35%> <img src="https://user-images.githubusercontent.com/73286100/144943354-433d0fec-4f02-4a1c-b5a9-84ca1a57226e.gif" alt="Screen Recording 2021-12-07 at 01 14 40" width=40%>

## Table of Contents
<!-- MarkdownTOC -->

- [How it works](#how-it-works)
	- [Different Scenarios](#different-scenarios)
	- [Commands added](#commands-added)
	- [Smarter Inline Code: Terms instead of Words](#smarter-inline-code-terms-instead-of-words)
	- [Smarter Markdown Link: Auto-Insert URLs](#smarter-markdown-link-auto-insert-urls)
	- [Smarter Undo](#smarter-undo)
- [Setting the Hotkeys](#setting-the-hotkeys)
- [Installation](#installation)
- [Roadmap](#roadmap)
- [Contribute](#contribute)
- [Credits](#credits)

<!-- /MarkdownTOC -->

## How it works

### Different Scenarios
`|` is a cursor without selection. `Selection` signifies the part of the text being selected. This table serves as a reference for the precise mechanics of this plugin, for a more intuitive showcase, see [the short gif above](#smarter-markdown-hotkeys).

|                                    |  Normal Hotkeys                                        | Smarter Hotkeys                                                    |
| ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| foo`\|`bar                         | foo\*\*\*\*bar                                         | \*\***foobar**\*\*                                                 |
| f`oo`bar                           | f\*\***oo**\*\*bar                                     | \*\***foobar**\*\*                                                 |
| Lor`em Ips`um                      | Lor\*\***em Ips**\*\*um                                | \*\***Lorem Ipsum**\*\*                                            |
| `- [ ] foobar ^123`                | \*\***- [ ] foobar ^123**\*\*                          | - [ ] \*\***foobar**\*\* <sup>^123</sup>                           |
| `## foobar-heading`                | ==**## Lorem Ipsum**==                                 | ## ==**Lorem Ipsum**==                                             |
| - Lor`em`<br>`    - Ips`um         | - Lor\*\***em<br>&nbsp;&nbsp;&nbsp;&nbsp;- Ips**\*\*um | - \*\***Lorem**\*\*<br>&nbsp;&nbsp;&nbsp;&nbsp;- \*\***Ipsum**\*\* |
| \*\***foo**`\|`**bar**\*\* *(Undo)*| \*\***foo\*\*\*\*bar**\*\*                             | foobar                                                             |
| \*\***Lor`em Ips`um**\*\* *(Undo)* | \*\***Lor**\*\*em Ips\*\***um**\*\*                    | Lorem Ipsum                                                        |

### Commands added
- Smarter Bold
- Smarter Italics
- Smarter Underscore Bold (`__foobar__`)
- Smarter Underscore Italics (`_foobar_`)
- Smarter Comment
- Smarter Inline Code\*
- Smarter Highlight
- Smarter Strikethrough
- Smarter Markdown Link\*
- Smarter Wikilink (Internal Link)

<sup>*\* Please see the information below regarding specific information for these commands*</sup>

### Smarter Inline Code: Terms instead of Words
`Smarter Inline Code` will __not__ consider punctuation and brackets as delimiters. This means that a cursor anywhere in "object.method" will select the whole term and result in "`object.method`" instead of "`object`.method".

### Smarter Markdown Link: Auto-Insert URLs
When you use `Smarter Markdown Link` and have an URL in your clipboard, the URL will automatically get inserted as well. 

When the URL ends with an image extension[^2] like `.png`, the command will also prepend the `!` for image links.

### Smarter Undo
Every Command also supports *undoing* markup, by triggering the same hotkey again. As opposed to normal Markdown Hotkeys, the undoing is applied yet again to the whole word. See the [overview above](#Different%20Scenarios) for specifics.

## Setting the Hotkeys
💡 If you want to replace the default commands from Obsidian, remember to remove their hotkey binding before changing the hotkeys from this plugin. Example for `Smarter Bold`:
1. Remove the hotkey `cmd/ctrl + B`[^1] for the default command `Toggle Bold`.
2. Assign `cmd/ctrl + B` as the hotkey for the command `Smarter Bold`.

## Installation
Right now, the plugin is still in beta. It can be installed with the [BRAT Plugin](https://github.com/TfTHacker/obsidian42-brat).

This plugin will be available in Obsidian's Community Plugin Browser: `Settings` → `Community Plugins` → `Browse` → Search for *"Smarter Markdown Hotkeys"*

## Roadmap
- [x] Smarter Undo
- [x] Support for Multi-line selection
- [x] Auto-insert URL from clipboard
- [ ] Expand to block instead instead of word when at least 3 lines are selected.
- [ ] Smart Code Block (dependent on expand to line)
- [ ] Submission to the Community Plugin Browser

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

Thanks yet again to @SkepticMystic for his support!

Donations are welcome via [PayPal](https://www.paypal.com/paypalme/ChrisGrieser) or [Ko-Fi](https://ko-fi.com/pseudometa). 🙏

**About the Developer**
In my day job, I am a researcher and sociology. In my phD project, I investigate the governance of the app economy and how software ecosystems manage the tension between innovation and compatibility. If you are interested in this subject, feel free to visit [my academic homepage](https://chris-grieser.de/) and get in touch!
- [Discord](https://discord.gg/veuWUTm): `@pseudometa#9546`
- Twitter: [@pseudo_meta](https://twitter.com/pseudo_meta)

[⬆️ Go Back to Top](#Table-of-Contents)

[^1]: MacOS uses `cmd`, Windows and Linux use `ctrl`.
[^2]: Currently supported extensions are `.png`, `.jpg`, `.jpeg`, `.gif`, `.tiff`, and `.tif`.
