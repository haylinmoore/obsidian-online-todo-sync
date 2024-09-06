import * as Gradescope from "./source/gradescope";
import * as Canvas from "./source/canvas";
import * as Todos from "./todo";

export interface SettingItem {
    name: string;
    placeholder: string;
}
export interface Source {
	fetchTodos: (course: string, settings: {[key: string]: string}) => Promise<Todos.Todo[]>;
    settings: () => { [key: string]: SettingItem };
}

export enum SourceType {
	Gradescope = "gradescope",
    Canvas = "canvas",
}

// Key should be the same the SourceType enum and have a value of the Source interface
export const Sources: { [key: string]: Source } = {
    [SourceType.Gradescope]: Gradescope,
    [SourceType.Canvas]: Canvas,
};

export const AllSettings = Object.entries(Sources).reduce((acc, [key, source]) => {
    acc[key] = source.settings();
    return acc;
}, {} as { [key: string]: { [key: string]: SettingItem } });

export const DefaultSettings = Object.entries(Sources).reduce((acc, [key, source]) => {
    acc[key] = Object.entries(source.settings()).reduce((acc, [key, setting]) => {
        acc[key] = "";
        return acc;
    }, {} as { [key: string]: string });
    return acc;
}, {} as { [key: string]: { [key: string]: string } });