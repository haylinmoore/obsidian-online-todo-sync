# Online Todo Sync for Obsidian

This plugin syncs your todo tasks from various online sources with an Obsidian using Obsidian Tasks format. 
It searches for files named "Tasks" containing tasks in a specific format and updates them with tasks fetched from online.

Supports the following sources:
- Gradescope
- Canvas (inspired by https://github.com/jordaeday/canvas-task-importer)

## Features

- Find all "Tasks" files in your vault with the first line starting with "Import"
- Extract todo items from the current document

## Import Format

The "Tasks" files in your Obsidian vault should follow the Import format. 
The first line of the file should start with "Import" and be formatted as follows:

```
Import;SOURCE;CLASSPREFIX;CLASSID;["ignore assignments containing me"];
```

For example:

```
Import;gradesope;CS220;507946;["No Credit"];
```

## Development

1. Clone this repository into `.obsidian/plugins/gradescope-obsidian`
2. Install dependencies using `npm install`.
3. Build the plugin using `npm run dev`.

Feel free to extend and modify the plugin to suit your needs. Contributions are welcome!
