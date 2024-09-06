import {
	Notice,
	Plugin,
	App,
	TFile,
	PluginSettingTab,
	Setting
} from "obsidian";

import * as Utils from "./utils";
import * as Todos from "./todo";
import * as Course from "./course";
import * as Sources from "./sources";

interface PluginSettings {
	[key: string]: {
		[settingKey: string]: string;
	};
}
  
const DEFAULT_SETTINGS: PluginSettings = Sources.DefaultSettings;

export default class OnlineTodoSync extends Plugin {
	settings: PluginSettings;
	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Utils.deepCopy(DEFAULT_SETTINGS);
		
		if (loadedData) {
			this.settings = Utils.deepMerge(this.settings, loadedData);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon(
			"refresh-cw",
			"Sync Todos",
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
		if (!Sources.Sources.hasOwnProperty(course.source)) {
			throw new Error(`Unknown source: ${course.source}`);
		}

		const newTodos = (await Sources.Sources[course.source].fetchTodos(course.id, this.settings[course.source]))
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

		const combinedTodos = Todos.sortByDueDate([
			...currentTodos,
			...newTodos,
		]);

		if (newTodos.length != 0) {
			new Notice(`${course.name}: added ${newTodos.length} new to-dos.`);
		}
		return `${course.toString()}\n${new Date().toString()}\n` + combinedTodos.map(Todos.todoToString).join("\n");
	}

	async processImportTaskFiles(app: App): Promise<void> {
		const markdownFiles = app.vault.getMarkdownFiles();
		const tasksFiles = markdownFiles.filter(
			(file) => file.basename === "Tasks"
		);

		const processFile = async (taskFile: TFile): Promise<void> => {
			const content = await app.vault.read(taskFile);
			const firstLine = content.split("\n")[0];

			if (firstLine.startsWith("Import")) {
				await this.updateTodos(content.split("\n")).then((newContent)=>{
					app.vault.modify(taskFile, newContent);
				}, (error: Error) => {
					console.error("Error updating todos:", error);
					new Notice(`${error}`);
				});
			}
		};

		const processingTasks = tasksFiles.map(processFile);
		await Promise.all(processingTasks);

		// Add message about any failures
		new Notice("Sync from online sources complete.");
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: OnlineTodoSync;

	constructor(app: App, plugin: OnlineTodoSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h1', {text: 'Settings for Online Todo Sync'});

		for (const [sourceKey, settings] of Object.entries(Sources.AllSettings)) {
			containerEl.createEl('h2', {text: `Settings for ${sourceKey}`});
			for (const [key, setting] of Object.entries(settings)) {
				new Setting(containerEl)
					.setName(setting.name)
					.addText(text => text
						.setPlaceholder(setting.placeholder)
						.setValue(this.plugin.settings[sourceKey][key])
						.onChange(async (value) => {
							this.plugin.settings[sourceKey][key] = value;
							await this.plugin.saveSettings();
						}));
			}
		}
	}
}