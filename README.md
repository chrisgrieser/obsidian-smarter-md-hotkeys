# 🧠 Smarter Markdown Hotkeys

![](https://img.shields.io/github/downloads/chrisgrieser/obsidian-smarter-md-hotkeys/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/obsidian-smarter-md-hotkeys?label=Latest%20Release&style=plastic) [![](https://img.shields.io/badge/changelog-click%20here-FFE800?style=plastic)](Changelog.md)

A plugin for [Obsidian](https://obsidian.md/) providing hotkeys that select words and lines in a smart way before applying markup. Multiple cursors are supported as well.

![Demo Video](demo/demo.gif)

## Table of Contents
<!-- MarkdownTOC -->

- [Markup Commands added](#markup-commands-added)
- [Command-Specific Details](#command-specific-details)
	- [Smarter Markdown/Image Link](#smarter-markdownimage-link)
	- [Smarter Inline/Fenced Code](#smarter-inlinefenced-code)
	- [Smarter Comment](#smarter-comment)
- [Smarter Punctuation Commands](#smarter-punctuation-commands)
- [How it works in detail](#how-it-works-in-detail)
- [Setting the Hotkeys](#setting-the-hotkeys)
- [Installation](#installation)
- [Contribute](#contribute)
- [Credits](#credits)

<!-- /MarkdownTOC -->

## Markup Commands added
- Smarter Bold
- Smarter Italics
- Smarter Underscore Bold (`__foobar__`)
- Smarter Underscore Italics (`_foobar_`)
- Smarter Comment\*
- Smarter HTML Comment\*
- Smarter Inline/Fenced Code\*
- Smarter Highlight
- Smarter Strikethrough
- Smarter Markdown/Image Link\*
- Smarter Wikilink (Internal Link)

All commands also support multiple cursors and undoing markup by triggering the same hotkey again. 

## Command-Specific Details
The following commands have some special features:

### Smarter Markdown/Image Link
- __Auto-Insert URLs__: When you use `Smarter Markdown Link` and have an URL in your clipboard, the URL will automatically get inserted as well. 
- __Automatic Switch to Image Syntax__ When the URL ends with an image extension like `.png`[^2], the command will also prepend the `!` for image links.

### Smarter Inline/Fenced Code
- __Terms instead of Words:__ `Smarter Code` will *not* consider punctuation or brackets as delimiters. This means that a cursor anywhere in "object.method" will select the whole term and result in "`object.method`" instead of "`object`.method".
- __Automatic Switch to Fenced Code Syntax__: When more than one line is selected, the `Smarter Code` will wrap the selected lines in fenced code syntax instead. Furthermore, the cursor to moved to the beginning of the fenced code block to you can conveniently enter the code language.

### Smarter Comment
When more than one line is selected, the `Smarter Comment` commands will expand the selection to the whole blocks and than wrap all of them together into the comment syntax. 

## Smarter Punctuation Commands
While strictly speaking quotation marks and brackets are not a form of markup, I found it quite useful to be able to set them in the very same smart way.Therefore, the following commands have been added as well:

- Smarter Quotation Marks
- Smarter Round Brackets
- Smarter Square Brackets

## How it works in detail
`|` is a cursor without selection. `Selection` signifies the part of the text being selected. This table serves as a reference for the precise mechanics of this plugin.

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

## Setting the Hotkeys
If you want to replace the default commands from Obsidian, remember to remove their hotkey binding before changing the hotkeys from this plugin. Example for `Smarter Bold`:
1. Remove the hotkey `cmd/ctrl + B`[^1] for the default command `Toggle Bold`.
2. Assign `cmd/ctrl + B` as the hotkey for the command `Smarter Bold`.

💡 For the smarter punctuation commands, you can also use a hotkey with `shift` like for example `shift + 2` for Smarter Quotation Marks. Curiously, Obsidian accepts such hotkeys, so you can work purely with smarter punctuation, if you want to. (At the cost of losing the ability to type punctuation normally.)

## Installation
The plugin is available in Obsidian's Community Plugin Browser via: `Settings` → `Community Plugins` → `Browse` → Search for *"Smarter Markdown Hotkeys"*

## Contribute
Please use the `.eslintrc` configuration located in the repository and run eslint before doing a pull request, and please do *not* use `prettier`. 🙂

```shell
# Run eslint fixing most common mistakes
eslint --fix *.ts
```

## Credits
Thanks to @SkepticMystic for his support!

Donations are welcome via [PayPal](https://www.paypal.com/paypalme/ChrisGrieser) or [Ko-Fi](https://ko-fi.com/pseudometa). 🙏

**About me**
In my day job, I am a researcher in sociology. In my PhD project, I investigate the governance of the app economy and how software ecosystems manage the tension between innovation and compatibility. If you are interested in this subject, feel free to visit [my academic homepage](https://chris-grieser.de/) and get in touch!
- [Discord](https://discord.gg/veuWUTm): `@pseudometa#9546`
- Twitter: [@pseudo_meta](https://twitter.com/pseudo_meta)

---

[⬆️ Go Back to Top](#Table-of-Contents)

[^1]: macOS uses `cmd`, Windows and Linux use `ctrl`.
[^2]: Currently supported extensions are `.png`, `.jpg`, `.jpeg`, `.gif`, `.tiff`, and `.tif`.
