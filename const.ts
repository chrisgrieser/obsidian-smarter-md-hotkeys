export const COMMANDS: {
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
		id: "smarter-inline-code",
		name: "Smarter Inline Code",
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
		name: "Smarter wikilink (internal link)",
		before: "[[",
		after: "]]",
	},

	{
		id: "smarter-md-link",
		name: "Smarter Markdown Link/Image",
		before: "[",
		after: "]()",
	}
];
