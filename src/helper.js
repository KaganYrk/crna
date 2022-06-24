import { createRequire } from 'module';
import ora from 'ora';

const require = createRequire(import.meta.url);
const util = require('util');
const exec = util.promisify(require('child_process').exec);

export function validateName(name) {
  if (typeof name !== 'string' || name === '') {
    return 'The project name can not be empty.';
  }
  if (!/^[a-z0-9@.\-_]+$/i.test(name)) {
    return 'The project name can only contain URL-friendly characters.';
  }
  return true;
}

export function navigateFolder(name) {
  try {
    process.chdir(`${process.cwd()}/${name}`);
  }
  catch (err) {
    console.log('chdir: ' + err);
  }

}

export async function runCommandAsync(props) {
  const spinner = ora(props.message).start()
  try {
    await exec(props.cmd, { encoding: 'utf8', stdio: 'inherit' });
    spinner.succeed()
  } catch (e) {
    console.error(e.stdout);
    spinner.fail()
    process.exit()
  }
}

