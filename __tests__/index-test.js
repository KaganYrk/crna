/* eslint-env jest */
import execa from 'execa';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

const cli = require.resolve('../build/index.js');

const projectRoot = getTemporaryPath();
jest.setTimeout(3 * 1000 * 60);
function getTemporaryPath() {
  return path.join(
    os.tmpdir(),
    Math.random()
      .toString(36)
      .substring(2)
  );
}

function execute(...args) {
  return execa('node', [cli, ...args], { cwd: projectRoot });
}

async function executePassingAsync(...args) {
  const results = await execute(...args);
  expect(results.exitCode).toBe(0);
  return results;
}

function executeDefaultAsync(...args) {
  const res = execute(...args);
  return res;
}

function checkBabel(projectName) {
  const file = fs.readFileSync(path.join(projectRoot, projectName, 'babel.config.js'), "utf-8").split('\n');
  const index = file.findIndex(x => x.includes("presets"))
  return file[index + 1].includes("plugins: ['react-native-reanimated/plugin']");
}

function fileExists(projectName, filePath) {
  return existsSync(path.join(projectRoot, projectName, filePath));
}

function getRoot(...args) {
  return path.join(projectRoot, ...args);
}

beforeAll(async () => {

  await fs.mkdirp(projectRoot);
});

describe("Creating expo managed project", () =>
  it("Executing create-react-native-app command", async () => {

    const projectName = 'expo-managed-test';
    const result = await executeDefaultAsync('-n', projectName, '-t', 'expo-managed', '-l', 'typescript');
    
    expect(result.exitCode).toBe(0);
    expect(fileExists(projectName, 'app')).toBeTruthy();
    expect(fileExists(projectName, 'eas.json')).toBeTruthy();
    expect(fileExists(projectName, '.eslintrc.json')).toBeTruthy();
    expect(fileExists(projectName, 'tsconfig.json')).toBeTruthy();
    expect(fileExists(projectName, 'babel.config.js')).toBeTruthy();
    expect(fileExists(projectName, 'app/components')).toBeTruthy();
    expect(fileExists(projectName, 'app/screens')).toBeTruthy();
    expect(fileExists(projectName, 'app/navigation')).toBeTruthy();
    expect(fileExists(projectName, 'app/config')).toBeTruthy();
    expect(fileExists(projectName, 'app/utilities')).toBeTruthy();
    expect(fileExists(projectName, 'app/config')).toBeTruthy();
    expect(fileExists(projectName, 'app/constants')).toBeTruthy();
    expect(fileExists(projectName, 'app/contexts')).toBeTruthy();
    expect(fileExists(projectName, 'app/services')).toBeTruthy();
    expect(checkBabel(projectName)).toBeTruthy()
  }
  )
)

afterAll(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});