#!/usr/bin/env npx ts-node
import path from 'path';
import fsPromises from "fs/promises";
import chalk from 'chalk';
import ora from 'ora';
import { Command, Option } from 'commander';
import { Language, Project } from './types';
import { COMMANDS, SUBFOLDERS } from './constants.js';
import { navigateFolder, runCommandAsync, validateName } from './helper';
import prompts, { PromptObject } from 'prompts';



const program = new Command(packageJSON.name)
    .version(packageJSON.version)
    .option('-n, --name <string>', "Project name")
    .addOption(new Option('-t, --template <string>', "Specify template").choices(["expo-managed", "expo-bare", "bare"]))
    .addOption(new Option('-l,--language <string>', "Specify language").choices(["javascript", "typescript"]))
    .parse(process.argv)






const options = program.opts()

prompts.override({
    fileName: options?.name,
    template: options?.template,
    language: options?.language
});

const promptChain: PromptObject[] = [
    {
        type: 'text',
        name: 'fileName',
        message: ' What is your app named?',
        validate: (fileName: string) => {
            const validation = validateName(path.basename(path.resolve(fileName)));
            if (typeof validation === 'string') {
                return 'Invalid project name: ' + validation;
            }
            return true;
        },
    },
    {
        type: 'select',
        name: 'template',
        message: 'Which template that you are going to use?',
        choices: [
            { title: 'expo-managed', value: 'expo-managed' },
            { title: 'expo-bare', value: 'expo-bare' },
            { title: 'bare', value: 'bare' },
        ],
    },
    {
        type: 'select',
        name: 'language',
        message: 'Which language do you prefer?',
        choices: [
            { title: 'typescript', value: 'typescript' },
            { title: 'javascript', value: 'javascript' },
        ],
    },
]

async function runAsync() {
    (async () => {

        const { fileName, template, language } = await prompts(promptChain);

        await createProject(fileName, template).then(() => navigateFolder(fileName))

        await createSubfolders();

        await installDependencies(language, template)

        await configBabel(template)

        await configESLint(language, template)

        await configEAS(template)

    });
}

runAsync()

