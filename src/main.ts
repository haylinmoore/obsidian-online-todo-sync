import {
	Notice,
	Plugin,
	App,
	TFile,
	PluginSettingTab,
	Setting
} from "obsidian";

import * as Todos from "./todo";
import * as Gradescope from "./gradescope";
import * as Course from "./course";

interface GradescopeSettings {
	token: string;
}

const DEFAULT_SETTINGS: GradescopeSettings = {
	token: 'non-token'
}

export default class GradescopePlugin extends Plugin {
	settings: GradescopeSettings;
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon(
			"refresh-cw",
			"Sync Gradescope",
			(evt: MouseEvent) => {
				this.processImportTaskFiles(this.app);
			}
		);

		this.addSettingTab(new SampleSettingTab(this.app, this));
		this.registerInterval(window.setInterval(() => this.processImportTaskFiles(this.app), 5 * 60 * 1000));
	}

	async updateTodos(lines: string[]): Promise<string> {
		const course = Course.extract(lines[0]);
		const currentTodos = lines.filter((line) => line.match(/^\s*-\s*\[.?\]\s*.+/)).map(Todos.stringToTodo)

		const currentTitles = currentTodos.map((todo) => todo.name);
		const newTodos = (await Gradescope.fetchTodos(course.id, this.settings.token))
			.filter(
				(todo) =>
					!currentTitles.some((title) => title.contains(todo.name))
			)
			.filter((todo) => {
				for (const filter of course.filters) {
					if (todo.name.contains(filter)) {
						return false;
					}
				}
				return true;
			})
			.map((todo) => {
				todo.name = `${course.name}: ${todo.name}`;
				return todo;
			});

		if (newTodos.length === 0) {
			throw new Error("No new to-dos found.");
		}

		const combinedTodos = Todos.sortByDueDate([
			...currentTodos,
			...newTodos,
		]);

		new Notice(`${course.name}: added ${newTodos.length} new to-dos.`);
		return lines[0] + "\n" + combinedTodos.map(Todos.todoToString).join("\n");
	}

	async processImportTaskFiles(app: App): Promise<void> {
		const markdownFiles = app.vault.getMarkdownFiles();
		const tasksFiles = markdownFiles.filter(
			(file) => file.basename === "Tasks"
		);

		const processFile = async (taskFile: TFile): Promise<void> => {
			const content = await app.vault.read(taskFile);
			const firstLine = content.split("\n")[0];

			if (firstLine.startsWith("GSImport")) {
				await this.updateTodos(content.split("\n")).then((newContent)=>{
					app.vault.modify(taskFile, newContent);
				}, (error: Error) => {
					if (error.message === "No new to-dos found.") {
						return;
					}
					console.error("Error updating todos:", error);
					new Notice(`${error}`);
				});
			}
		};

		const processingTasks = tasksFiles.map(processFile);
		await Promise.all(processingTasks);
		new Notice("Sync from gradescope complete.");
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: GradescopePlugin;

	constructor(app: App, plugin: GradescopePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Gradescope Token')
			.addText(text => text
				.setPlaceholder('Enter your token')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
				}));
	}
}