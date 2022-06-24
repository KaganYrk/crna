#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from "module";
import path from 'path';
import ora from 'ora';
import prompts from 'prompts';
import { navigateFolder, runCommandAsync, validateName } from './helper.js';
import fsPromises from "fs/promises";
import chalk from 'chalk';
const require = createRequire(import.meta.url);
const tsconfigExpo = require('../files/tsconfig_expo.json');
const tsconfigBare = require('../files/tsconfig_bare.json');
const eslintrcJSON = require('../files/.eslintrc.json');
const packageJSON = require('../package.json');
const APP_FILES = ["components", "screens", "navigation", "config", "utilities", "constants", "contexts", "services"]
const eslint = "yarn add eslint eslint-config-airbnb eslint-plugin-import eslint-plugin-react eslint-plugin-jsx-a11y @babel/eslint-parser eslint-plugin-react-hooks babel-eslint @babel/core --dev";
const navigation = "yarn add @react-navigation/native @react-navigation/bottom-tabs  @react-navigation/stack"
const expo = "expo install expo-splash-screen expo-font expo-secure-store expo-status-bar expo-updates react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens react-native-svg"

const program = new Command(packageJSON.name).version(packageJSON.version)

program.parse();

const createProject = async ({ name, type }) => {
    if (type !== 'bare') {
        const updateExpo = `yarn global add expo-cli`
        await runCommandAsync({ cmd: updateExpo, message: "Checking Expo CLI version" })

        const cmd = `expo init ${name} --template ${type}`;
        await runCommandAsync({ cmd, message: "Creating Expo project" })
    } else {
        const cmd = `react-native init ${name} --version 0.68.2`; //currently, we are getting error on 0.69
        await runCommandAsync({ cmd, message: "Creating bare React Native project" })
    }

}

const createSubfolders = async ({ name }) => {
    const spinner = ora("Creating subfolders").start();
    const promises = APP_FILES.map(async element => (
        await fsPromises.mkdir(`app/${element}`, { recursive: true })
    ))
    Promise.all(promises).then(() => spinner.succeed())
}

const configTsConfig = async ({ type }) => {
    if (type === "bare")
        return await fsPromises.writeFile('tsconfig.json', JSON.stringify(tsconfigBare, null, 4))
    return await fsPromises.writeFile('tsconfig.json', JSON.stringify(tsconfigExpo, null, 4))
}

const installDependencies = async ({ language, type }) => {
    await runCommandAsync({ cmd: eslint, message: `Installing ${chalk.magentaBright("ESLint")} packages` })

    if (type === "blank") {
        await runCommandAsync({ cmd: navigation, message: `Installing ${chalk.magenta("React-Navigation")} packages` })
        await runCommandAsync({ cmd: expo, message: `Installing ${chalk.whiteBright("Expo")} packages` })
    }

    if (language === "typescript") {
        const reactVersion = await fsPromises.readFile('package.json', "utf-8").then(text => JSON.parse(text).dependencies.react)
        const typescript = `yarn add @types/react@${reactVersion} @types/react-native @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript --dev`

        await runCommandAsync({ cmd: typescript, message: `Installing ${chalk.cyan("Typescript")} packages` })
        const spinner = ora("Configuring tsconfig.json").start()
        await configTsConfig({ type }).then(() => spinner.succeed(), () => spinner.fail())

    }
}

const configBabel = async ({ type }) => {
    const spinner = ora("Configuring babel.config.js").start()
    const data = await fsPromises.readFile('babel.config.js', "utf-8").then(x => x.toString().split("\n"))
    data.splice(type === 'bare' ? 2 : 4, 0, "\t\tplugins: ['react-native-reanimated/plugin']")
    await fsPromises.writeFile('babel.config.js', data.join("\n")).then(() => spinner.succeed(), () => spinner.fail())
}


const configESLint = async ({ type }) => {
    type === 'bare' && await fsPromises.unlink('.eslintrc.js');
    await fsPromises.writeFile('.eslintrc.json', JSON.stringify(eslintrcJSON, null, 4))
    await fsPromises.writeFile('.eslintignore', '/node_modules')
}

const promptChain = [
    {
        type: 'text',
        name: 'name',
        message: ' What is your app named?',
        validate: name => {
            const validation = validateName(path.basename(path.resolve(name)));
            if (typeof validation === 'string') {
                return 'Invalid project name: ' + validation;
            }
            return true;
        },
    },
    {
        type: 'select',
        name: 'type',
        message: 'Which template that you are going to use?',
        choices: [
            { title: 'Expo Managed Workflow', value: 'blank' },
            { title: 'Expo Bare Workflow', value: 'bare-minimum' },
            { title: 'Bare', value: 'bare' },
        ],
    },
    {
        type: 'select',
        name: 'language',
        message: 'Which language do you prefer?',
        choices: [
            { title: 'Typescript', value: 'typescript' },
            { title: 'Javascript', value: 'javascript' },
        ],
        initial: 0,
    },

]
// )
async function runAsync() {
    (async () => {

        const response = await prompts(promptChain);

        await createProject({ name: response.name, type: response.type }).then(() => navigateFolder(response.name))

        await createSubfolders({ name: response.name });

        await installDependencies({ language: response.language, type: response.type })

        await configBabel({ type: response.type })

        await configESLint({ type: response.type })

    })();
}

runAsync()
