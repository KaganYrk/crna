
export type Project = "expo-managed" | "expo-bare" | "bare";
export type Language = "ts" | "js";

export type Response = {
    fileName: string,
    projectType: Project
    language: Language
}
