

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

