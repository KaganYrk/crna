
export type Project = "expo-managed" | "expo-bare" | "bare";
export type Language = "typescript" | "javascript";

export type Response = {
    fileName: string,
    projectType: Project
    language: Language
}
