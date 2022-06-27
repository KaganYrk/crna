#!/usr/bin/env ts-node
import path from 'path';
import fsPromises from "fs/promises";
import chalk from 'chalk';
import ora from 'ora';
import { Command } from 'commander';
import { Language, Project } from './types';
import { COMMANDS, SUBFOLDERS } from './constants.js';
import { navigateFolder, runCommandAsync, validateName } from './helper';
import prompts, { PromptObject } from 'prompts';

const tsconfigExpo = require('../files/tsconfig_expo.json');
const tsconfigBare = require('../files/tsconfig_bare.json');
const eslintrcJSON = require('../files/.eslintrc.json');
const EASJSON = require('../files/eas.json');
const packageJSON = require('../package.json');

const program = new Command(packageJSON.name).version(packageJSON.version).parse()

const createProject = async (
    fileName: string,
    projectType: Project) => {

    if (projectType !== 'bare') {
        const updateExpo = `yarn global add expo-cli`
        await runCommandAsync({ cmd: updateExpo, message: "Updating Expo CLI version" })

        const cmd = `expo init ${fileName} --template ${projectType.includes("blank") ? "blank" : "bare-minimum"}`;
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
    projectType: Project
) => {
    await runCommandAsync({ cmd: COMMANDS.ESLINT, message: `Installing ${chalk.magentaBright("ESLint")} packages` })

    if (projectType === "expo-managed") {
        await runCommandAsync({ cmd: COMMANDS.REACT_NAVIGATION, message: `Installing ${chalk.magenta("React-Navigation")} packages` })
        await runCommandAsync({ cmd: COMMANDS.EXPO, message: `Installing ${chalk.whiteBright("Expo")} packages` })
    }

    if (language === "ts") {
        const reactVersion = await fsPromises.readFile('package.json', "utf-8").then(text => JSON.parse(text).dependencies.react)
        const typescript = `yarn add @types/react@${reactVersion} @types/react-native @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript --dev`

        await runCommandAsync({ cmd: typescript, message: `Installing ${chalk.cyan("Typescript")} packages` })
        const spinner = ora("Configuring tsconfig.json").start()
        await configTypescript(projectType).then(() => spinner.succeed(), () => spinner.fail())
    }
}

const configTypescript = async (
    projectType: Project
) => {
    if (projectType === "bare")
        return await fsPromises.writeFile('tsconfig.json', JSON.stringify(tsconfigBare, null, 4))
    return await fsPromises.writeFile('tsconfig.json', JSON.stringify(tsconfigExpo, null, 4))
}

const configBabel = async (
    projectType: Project
) => {
    const spinner = ora("Configuring babel.config.js").start()
    const data = await fsPromises.readFile('babel.config.js', "utf-8").then(x => x.toString().split("\n"))
    data.splice(projectType === 'bare' ? 2 : 4, 0, "\t\tplugins: ['react-native-reanimated/plugin']")
    await fsPromises.writeFile('babel.config.js', data.join("\n")).then(() => spinner.succeed(), () => spinner.fail())
}

const configESLint = async (
    projectType: Project
) => {
    const spinner = ora("Configuring ESLint").start()
    projectType === 'bare' && await fsPromises.unlink('.eslintrc.js');
    await fsPromises.writeFile('.eslintrc.json', JSON.stringify(eslintrcJSON, null, 4))
    await fsPromises.writeFile('.eslintignore', '/node_modules').then(() => spinner.succeed(), () => spinner.fail())
}

const configEAS = async (
    projectType: Project
) => {
    const spinner = ora("Configuring Expo Application Service").start()
    projectType !== 'bare' && await fsPromises.writeFile('eas.json', JSON.stringify(EASJSON, null, 4)).then(() => spinner.succeed(), () => spinner.fail())
}


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
        name: 'projectType',
        message: 'Which template that you are going to use?',
        choices: [
            { title: 'Expo Managed Workflow', value: 'expo-managed' },
            { title: 'Expo Bare Workflow', value: 'expo-bare' },
            { title: 'Bare', value: 'bare' },
        ],
    },
    {
        type: 'select',
        name: 'language',
        message: 'Which language do you prefer?',
        choices: [
            { title: 'Typescript', value: 'ts' },
            { title: 'Javascript', value: 'js' },
        ],
        initial: 0,
    },

]

async function runAsync() {
    (async () => {

        const { fileName, projectType, language } = await prompts(promptChain);

        await createProject(fileName, projectType).then(() => navigateFolder(fileName))

        await createSubfolders();

        await installDependencies(language, projectType)

        await configBabel(projectType)

        await configESLint(projectType)

        await configEAS(projectType)

    })();
}

runAsync()

