const path = require('path');
const colors = require('colors/safe');
const fs = require('fs');
const exec = require('child_process').exec;

const version = require('./package.json').version;

console.log(colors.cyan('\nRunning pre-build tasks'));

const versionFilePath = path.join(__dirname + '/src/assets/version.json');

const timestamp = new Date().toISOString();

const getCommit = async () => {
  return new Promise((fulfill, reject) => {
      exec(
        'git rev-parse --short HEAD',
        (err, stdout, stderr) => {
          if (err) { reject(err); }
          if (typeof stdout === 'string') {
            fulfill(stdout.replace('* ', '').replace('\n', ''));
          }
        }
      );
  });
};

const getCommitVersion = async () => {
  return new Promise((fulfill, reject) => {
      exec(
        'git describe --always',
        (err, stdout, stderr) => {
          if (err) { reject(err); }
          if (typeof stdout === 'string') {
            fulfill(stdout.replace('* ', '').replace('\n', ''));
          }
        }
      );
  });
};

const getBranch = async () => {
  return new Promise((fulfill, reject) => {
      exec('git branch --show-current', (err, stdout, stderr) => {
          if (err) { reject(err); }
          if (typeof stdout === 'string') {
            fulfill(stdout.trim());
          }
      });
  });
};

const execute = async () => {
  const version = await getCommitVersion();

  const src = {
    version,
    timestamp,
  };

  // ensure version module pulls value from package.json
  fs.writeFile(versionFilePath, JSON.stringify(src), { flag: 'w' }, (err) => {
      if (err) {
          return console.log(colors.red(err.message));
      }

      console.log(colors.green(`Updating application version ${colors.yellow(version)}`));
      console.log(`${colors.green('Writing version information to ')}${colors.yellow(versionFilePath)}\n`);
  });
};

execute();
