#!/usr/bin/env node

import { execSync } from 'child_process';
import { Command } from 'commander';
import { createRequire } from "module";
import path from 'path';
import prompts from 'prompts';
import { tsconfigBare, tsconfigExpo } from './constants.js';
import { navigateFolder, validateName } from './helper.js';

const require = createRequire(import.meta.url);
const fs = require('fs');

const packageJSON = require('../package.json');



const APP_FILES = ["components", "screens", "navigation", "config", "utilities", "constants", "contexts", "services"]




const program = new Command(packageJSON.name)
    .version(packageJSON.version)

program.parse();

const configBabel = () => {
    var data = fs.readFileSync('babel.config.js').toString().split("\n");

    data.splice(4, 0, "\tplugins: ['react-native-reanimated/plugin']");
    var text = data.join("\n");

    fs.writeFileSync('babel.config.js', text)
}


const createProject = ({ name }) => {
    const cmd = `expo init ${name} --template blank`;
    execSync(cmd, { encoding: 'utf8', stdio: 'inherit' })
}


const installDependencies = ({ name, language, type }) => {
    const eslint = "yarn add eslint eslint-config-airbnb eslint-plugin-import eslint-plugin-react eslint-plugin-jsx-a11y @babel/eslint-parser eslint-plugin-react-hooks babel-eslint @babel/core --dev";
    const typescript = "yarn add @types/react @types/react-native @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript --dev"
    const navigation = "yarn add @react-navigation/native @react-navigation/bottom-tabs  @react-navigation/stack"
    const expo = "expo install expo-splash-screen expo-font expo-secure-store expo-status-bar expo-updates react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens react-native-svg"

    navigateFolder(name);

    configBabel()

    execSync(eslint, { encoding: 'utf8', stdio: 'inherit' })

    if (type === "blank") {
        execSync(navigation, { encoding: 'utf8', stdio: 'inherit' })
        execSync(expo, { encoding: 'utf8', stdio: 'inherit' })
    }

    if (language === "typescript") {
        type === "bare" ? fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigBare)) : fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigExpo))
        execSync(typescript, { encoding: 'utf8', stdio: 'inherit' })
    }
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
            { title: 'Bare', value: 'bare' },
            { title: 'Expo Managed Workflow', value: 'blank' },
            { title: 'Expo Bare Workflow', value: 'bare-minimum' },
        ],
    },
    {
        type: 'select',
        name: 'language',
        message: 'Which language do you prefer?',
        choices: [
            { title: 'Typescript', value: 'Typescript' },
            { title: 'Javascript', value: 'Javascript' },
        ],
        initial: 0,
    },


]


async function runAsync() {
    (async () => {
        const response = await prompts(promptChain);

        createProject({ name: response.name })

        APP_FILES.forEach(element => {
            fs.mkdirSync(`${response.name}/app/${element}`, { recursive: true })
        });

        installDependencies({ name: response.name, language: response.language, type: response.type })
    })();
}

runAsync()
