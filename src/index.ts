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

const tsconfigExpo = require('../files/tsconfig_expo.json');
const tsconfigBare = require('../files/tsconfig_bare.json');
const eslintrcjsJSON = require('../files/.eslintrc_js.json');
const eslintrctsJSON = require('../files/.eslintrc_ts.json');
const EASJSON = require('../files/eas.json');
const packageJSON = require('../package.json');


const program = new Command(packageJSON.name)
    .version(packageJSON.version)
    .option('-n, --name <string>', "Project name")
    .addOption(new Option('-t, --template <string>', "Specify template").choices(["expo-managed", "expo-bare", "bare"]))
    .addOption(new Option('-l,--language <string>', "Specify language").choices(["javascript", "typescript"]))
    .parse(process.argv)

const createProject = async (
    fileName: string,
    template: Project) => {

    if (template !== 'bare') {
        const updateExpo = `yarn global add expo-cli`
        await runCommandAsync({ cmd: updateExpo, message: "Updating Expo CLI version" })

        const cmd = `npx create-expo-app ${fileName} --template ${template.includes("bare") ? "bare-minimum" : "blank"}`;
        await runCommandAsync({ cmd, message: "Creating Expo project" })
    } else {
        const cmd = `react-native init ${fileName} --version 0.68.2`; //currently, we are getting error on 0.69
        await runCommandAsync({ cmd, message: "Creating bare React Native project" })
    }
}

const createSubfolders = async () => {
    const spinner = ora("Creating subfolders").start();
    const promises = SUBFOLDERS.map(async element => (
        await fsPromises.mkdir(`app/${element}`, { recursive: true })
    ))
    Promise.all(promises).then(() => spinner.succeed())
}

const installDependencies = async (
    language: Language,
    template: Project
) => {
    await runCommandAsync({ cmd: COMMANDS.ESLINT, message: `Installing ${chalk.magentaBright("ESLint")} packages` })

    if (template === "expo-managed") {
        await runCommandAsync({ cmd: COMMANDS.REACT_NAVIGATION, message: `Installing ${chalk.magenta("React-Navigation")} packages` })
        await runCommandAsync({ cmd: COMMANDS.EXPO, message: `Installing ${chalk.whiteBright("Expo")} packages` })
    }

    if (language === "typescript") {
        const reactVersion = await fsPromises.readFile('package.json', "utf-8").then(text => JSON.parse(text).dependencies.react)
        const typescript = `yarn add @types/react@${reactVersion} @types/react-native @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript --dev`

        await runCommandAsync({ cmd: typescript, message: `Installing ${chalk.cyan("Typescript")} packages` })
        const spinner = ora("Configuring tsconfig.json").start()
        await configTypescript(template).then(() => spinner.succeed(), () => spinner.fail())
    }
}

const configTypescript = async (
    template: Project
) => {
    if (template === "bare")
        return await fsPromises.writeFile('tsconfig.json', JSON.stringify(tsconfigBare, null, 4))
    return await fsPromises.writeFile('tsconfig.json', JSON.stringify(tsconfigExpo, null, 4))
}

const configBabel = async (
    template: Project
) => {
    const spinner = ora("Configuring babel.config.js").start()
    const data = await fsPromises.readFile('babel.config.js', "utf-8").then(x => x.toString().split("\n"))
    data.splice(template === 'bare' ? 2 : 4, 0, "\t\tplugins: ['react-native-reanimated/plugin']")
    await fsPromises.writeFile('babel.config.js', data.join("\n")).then(() => spinner.succeed(), () => spinner.fail())
}

const configESLint = async (
    language: Language,
    template: Project
) => {
    const spinner = ora("Configuring ESLint").start()
    template === 'bare' && await fsPromises.unlink('.eslintrc.js');

    language === 'javascript' ? await fsPromises.writeFile('.eslintrc.json', JSON.stringify(eslintrcjsJSON, null, 4)) : await fsPromises.writeFile('.eslintrc.json', JSON.stringify(eslintrctsJSON, null, 4))
    await fsPromises.writeFile('.eslintignore', '/node_modules').then(() => spinner.succeed(), () => spinner.fail())
}

const configEAS = async (
    template: Project
) => {
    const spinner = ora("Configuring Expo Application Service").start()
    template !== 'bare' && await fsPromises.writeFile('eas.json', JSON.stringify(EASJSON, null, 4)).then(() => spinner.succeed(), () => spinner.fail())
}

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

