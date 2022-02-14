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
	- [Smarter Wikilink](#smarter-wikilink)
	- [Smarter Mathjax](#smarter-mathjax)
- [Smarter Punctuation Commands Added](#smarter-punctuation-commands-added)
- [Smarter Upper/Lower Case](#smarter-upperlower-case)
- [Smarter Deletion Commands Added](#smarter-deletion-commands-added)
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
- Smarter Markdown/Image Link
- Smarter Wikilink (Internal Link)
- Smarter Mathjax\*

All commands also support __multiple cursors__, smart __inclusion/exclusion of special characters__, and __undoing markup__ by triggering the same hotkey.

\* These commands _wrap whole blocks_ instead of wrapping each line when the hotkey is triggered on a multi-line selection. They also switch to the appropriate syntax, for example from inline code syntax to fenced code syntax. (See below for details.)

## Command-Specific Details
The following commands have some special features:

### Smarter Markdown/Image Link
- __Auto-Insert URLs__: When you use `Smarter Markdown Link` and have an URL in your clipboard, the URL will automatically get inserted as well.
- __Automatic Switch to Image Syntax__ When the URL in the clipboard ends with an image extension like `.png`,[^2] the command will also prepend the `!` for image links.

### Smarter Inline/Fenced Code
- __Terms instead of Words:__ `Smarter Code` will *not* consider punctuation or brackets as delimiters. This means that a cursor anywhere in "object.method" will select the whole term and result in "`object.method`" instead of "`object`.method".
- __Automatic Switch to Fenced Code Syntax__: When more than one line is selected, `Smarter Code` will wrap the selected lines in [fenced code syntax](https://help.obsidian.md/How+to/Format+your+notes#Code+blocks) instead. Furthermore, the cursor is moved to the beginning of the fenced code block so you can conveniently enter the code language.
- 💡 `Smarter Fenced Code` synergizes well with the [Codeblock Completer Plugin](https://github.com/SkepticMystic/codeblock-completer).

### Smarter Comment
- __Automatic Switch to Block Comments__: When more than one line is selected, the `Smarter Comment` commands will expand the selection to whole blocks and than [wrap all of them together](https://help.obsidian.md/How+to/Format+your+notes#Comments) into the comment syntax.

### Smarter Wikilink
- __Auto-Suggest__: When turning text into a wikilink, `Smarter Wikilinks` will trigger the suggester afterwards.

### Smarter Mathjax
- __Automatic Switch to Blocks__: When more than one line is selected, the `Smarter MathJax` command will also [expand the selection to whole blocks](https://help.obsidian.md/How+to/Format+your+notes#Math) and switch from `$` to `$$`. (I do not use Mathjax myself, so feel free to open an issue when the Mathjax command can be improved somehow.)

## Smarter Punctuation Commands Added
While strictly speaking quotation marks and brackets are not a form of markup, I found it quite useful to be able to set them in the same way. Therefore, the following commands have been added as well:

- Smarter Quotation Marks
- Smarter Round Brackets
- Smarter Square Brackets

## Smarter Upper/Lower Case
The same logic can also be applied to case switching commands. However, instead of having a smart upper case and a smart lower case command, both are merged into one command: The text will normally be upper cased, except when the text is already fully upper cased, in which case it will be lower cased. (For most cases making lower casing an undo of upper casing.)

- Smarter Upper/Lower Case

## Smarter Deletion Commands Added
Smarter Deletion of Text also works, doesn't it? Also, I found the built-in Deletion command a bit annoying, since it left an empty pane. `Smarter Delete Current Note` deletes the current note, confirms it with a Notification, and navigates back to the last file.

- Smarter Delete Text
- Smarter Delete Current Note

## How it works in detail
`|` is a cursor without selection. `Selection` signifies the part of the text being selected. This table serves as a reference for the precise mechanics of this plugin.

|                                    |  Normal Hotkeys                                        | Smarter Hotkeys                                                    |
| ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| foo`\|`bar                         | foo\*\*\*\*bar                                         | \*\***foobar**\*\*                                                 |
| f`oo`bar                           | f\*\***oo**\*\*bar                                     | \*\***foobar**\*\*                                                 |
| Lor`em Ips`um                      | Lor\*\***em Ips**\*\*um                                | \*\***Lorem Ipsum**\*\*                                            |
| `- [ ] foobar ^123`                | \*\***- [ ] foobar ^123**\*\*                          | - [ ] \*\***foobar**\*\* <sup>^123</sup>                           |
| `## foobar-heading`                | ==**## Lorem Ipsum**==                                 | ## ==**Lorem Ipsum**==                                             |
| - Lor`em`<br>`- Ips`um         | - Lor\*\***em<br>&nbsp;&nbsp;&nbsp;&nbsp;- Ips**\*\*um | - \*\***Lorem**\*\*<br>&nbsp;&nbsp;&nbsp;&nbsp;- \*\***Ipsum**\*\* |
| \*\***foo**`\|`**bar**\*\* *(Undo)*| \*\***foo\*\*\*\*bar**\*\*                             | foobar                                                             |
| \*\***Lor`em Ips`um**\*\* *(Undo)* | \*\***Lor**\*\*em Ips\*\***um**\*\*                    | Lorem Ipsum                                                        |

You can take a look which characters exactly are included or excluded by taking a look at the [`const.ts`](const.ts#L144).

## Setting the Hotkeys
If you want to replace the default commands from Obsidian, remember to remove their hotkey binding before changing the hotkeys from this plugin. Example for `Smarter Bold`:
1. Remove the hotkey `cmd/ctrl + B`[^1] for the default command `Toggle Bold`.
2. Assign `cmd/ctrl + B` as the hotkey for the command `Smarter Bold`.

💡 For the smarter punctuation commands, you can also use a hotkey with `shift`, for example `shift + 2` for Smarter Quotation Marks. Curiously, Obsidian accepts such hotkeys, so you can basically "overwrite" normal punctuation typing if you want to. (However, note that this comes at the cost of losing the ability to type punctuation normally.)

## Installation
The plugin is available in Obsidian's Community Plugin Browser via: `Settings` → `Community Plugins` → `Browse` → Search for *"Smarter Markdown Hotkeys"*

## Contribute
The easiest way to make contributions is to make changes to `const.st`, since the constants there determine commands and what to include/exclude.

Please use the `.eslintrc` configuration located in the repository and run eslint before doing a pull request, and do *not* use `prettier`. 🙂

```shell
# Run eslint fixing most common mistakes
eslint --fix *.ts
```

## Credits
Thanks to @SkepticMystic for his support!

Donations are welcome via [PayPal](https://www.paypal.com/paypalme/ChrisGrieser) or [Ko-Fi](https://ko-fi.com/pseudometa). 🙏

**About me**
In my day job, I am a sociologist studying the social mechanisms underlying the digital economy. For my PhD project, I investigate the governance of the app economy and how software ecosystems manage the tension between innovation and compatibility. If you are interested in this subject, feel free to visit [my academic homepage](https://chris-grieser.de/) and get in touch.
- [Discord](https://discord.gg/veuWUTm): `@pseudometa#9546`
- Twitter: [@pseudo_meta](https://twitter.com/pseudo_meta)

[⬆️ Go Back to Top](#Table-of-Contents)

[^1]: macOS uses `cmd`, Windows and Linux use `ctrl`.
[^2]: The supported image extensions are [listed here](const.ts#L152).
