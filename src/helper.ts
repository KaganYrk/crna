import ora from "ora";

const util = require('util');
const exec = util.promisify(require('child_process').exec);

export function validateName(fileName:string) {
  if (typeof fileName !== 'string' || fileName === '') {
    return 'The project name can not be empty.';
  }
  if (!/^[a-z0-9@.\-_]+$/i.test(fileName)) {
    return 'The project name can only contain URL-friendly characters.';
  }
  return true;
}

export function navigateFolder(fileName:string) {
  try {
    process.chdir(`${process.cwd()}/${fileName}`);
  }
  catch (err) {
    console.log('chdir: ' + err);
  }

}

export async function runCommandAsync(
  props:{
    message:string,
    cmd:string
  }) {
  const spinner = ora(props.message).start()
  try {
    await exec(props.cmd, { encoding: 'utf8' });
    spinner.succeed()
  } catch (e) {
    console.error(e.stdout);
    spinner.fail()
    process.exit()
  }
}

