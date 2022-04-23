export const DEBUGGING = false;

export const MD_COMMANDS: {
	id: string;
	name: string;
	before: string;
	after: string;
}[] = [
	{
		id: "smarter-asterisk-bold",
		name: "Smarter Bold",
		before: "**",
		after: "**",
	},
	{
		id: "smarter-underscore-bold",
		name: "Smarter Underscore Bold",
		before: "__",
		after: "__",
	},
	{
		id: "smarter-asterisk-italics",
		name: "Smarter Italics",
		before: "*",
		after: "*",
	},
	{
		id: "smarter-underscore-italics",
		name: "Smarter Underscore Italics",
		before: "_",
		after: "_",
	},
	{
		id: "smarter-comments",
		name: "Smarter Comments",
		before: "%%",
		after: "%%",
	},
	{
		id: "smarter-html-comments",
		name: "Smarter HTML Comments",
		before: "<!--",
		after: "-->",
	},
	{
		id: "smarter-inline-code",
		name: "Smarter Code (Inline/Fenced)",
		before: "`",
		after: "`",
	},
	{
		id: "smarter-highlight",
		name: "Smarter Highlight",
		before: "==",
		after: "==",
	},
	{
		id: "smarter-strikethrough",
		name: "Smarter Strikethrough",
		before: "~~",
		after: "~~",
	},
	{
		id: "smarter-wikilink",
		name: "Smarter Wikilink (Internal Link)",
		before: "[[",
		after: "]]",
	},
	{
		id: "smarter-wikilink-heading",
		name: "Smarter Wikilink to Heading",
		before: "[[##",
		after: "]]",
	},
	{
		id: "smarter-md-link",
		name: "Smarter Markdown Link/Image",
		before: "[",
		after: "]()",
	},
	{
		id: "smarter-math",
		name: "Smarter Mathjax",
		before: "$",
		after: "$",
	},
	{
		id: "smarter-callout-label",
		name: "Smarter Callout Label",
		before: "> [!",
		after: "]\n> ",
	},
	{
		id: "smarter-quotation-marks",
		name: "Smarter Quotation Mark",
		before: "\"",
		after: "\"",
	},
	{
		id: "smarter-round-brackets",
		name: "Smarter Round Brackets",
		before: "(",
		after: ")",
	},
	{
		id: "smarter-square-brackets",
		name: "Smarter Square Brackets",
		before: "[",
		after: "]",
	},
	{
		id: "smarter-curly-brackets",
		name: "Smarter Curly Brackets",
		before: "{",
		after: "}",
	},

	// leave "after" key empty for special commands that do not actually insert text
	// so trimSelection does not apply trimming to them
	{
		id: "smarter-delete",
		name: "Smarter Delete Text",
		before: "delete",
		after: "",
	},
	{
		id: "smarter-upper-lower",
		name: "Smarter Upper/Lower Case",
		before: "upper-lower",
		after: "",
	},
	{
		id: "smarter-insert-new-line",
		name: "Smarter Insert New Line",
		before: "new-line",
		after: "",
	}
];

export const OTHER_COMMANDS: {
	id: string;
	name: string;
}[] = [
	{
		id: "smarter-delete-current-file",
		name: "Smarter Delete Current Note",
	},
	{
		id: "smarter-copy-path",
		name: "Smarter Copy Relative/Absolute Path",
	},
	{
		id: "smarter-copy-file-name",
		name: "Smarter Copy File Name",
	}
];

export const URL_REGEX = /^((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))$/;

export const TRIMBEFORE = [
	"\"",
	"(",
	"[",
	"###### ",
	"##### ",
	"#### ",
	"### ",
	"## ",
	"# ",
	"- [ ] ",
	"- [x] ",
	"- ",
	">",
	" ",
	"\n",
	"\t"
];

export const TRIMAFTER = [
	"\"",
	")",
	"](", // to not break markdown links
	"]",
	"\n",
	"\t",
	" "
];

export const EXPANDWHENOUTSIDE = [
	["#", ""],
	["[[", "]]"],
	["", "]]"],
	["[[", ""],
	["\"", "\""],
	["'", "'"],
	["(", ")"],
	["[", "] "], // extra space to not break markdown links
	["$", ""],
	["", "€"]
];

export const IMAGEEXTENSIONS = [
	"png",
	"jpg",
	"jpeg",
	"gif",
	"tiff"
];

