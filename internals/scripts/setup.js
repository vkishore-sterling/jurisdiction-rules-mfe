#!/usr/bin/env node

import { exec } from 'child_process';
import { cursorTo } from 'readline';

import { bind } from './helpers/checkmark';
import animateProgress from './helpers/progress';

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdout.write('\n');
let interval;
const clearRepo = true;

process.stdout.write('\nInstalling dependencies... (This might take a while)');
setTimeout(() => {
  cursorTo(process.stdout, 0);
  interval = animateProgress('Installing dependencies');
}, 500);

installDeps();

function initApp(callback) {
  exec(
    '/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"',
    'npm i -g cypress',
    bind(null, callback),
  );
}

/**
 * Installs dependencies
 */
function installDeps() {
  exec('node --version', (err, stdout) => {
    const nodeVersion = stdout && parseFloat(stdout.substring(1));
    if (nodeVersion < 5 || err) {
      installDepsCallback(
        err ||
          'Unsupported node.js version, make sure you have the latest version installed.',
      );
    } else {
      exec('yarn --version', (yarnErr, yarnOut) => {
        if (
          parseFloat(yarnOut) < 0.15 ||
          yarnErr ||
          process.env.USE_YARN === 'false'
        ) {
          exec('npm install', bind(null, installDepsCallback));
        } else {
          exec('yarn install', bind(null, installDepsCallback));
        }
      });
    }
  });
}

/**
 * Callback function after installing dependencies
 */
function installDepsCallback(error) {
  clearInterval(interval);
  process.stdout.write('\n\n');
  if (error) {
    process.stderr.write(error);
    process.stdout.write('\n');
    process.exit(1);
  }

  if (clearRepo) {
    interval = animateProgress('Setting up dev environment');
    process.stdout.write('Setting up dev environment');
    initApp(() => {
      clearInterval(interval);
      endProcess();
    });
  }

  endProcess();
}
/**
 * Function which ends setup process
 */
function endProcess() {
  process.stdout.write('\nDone!');
  process.exit(0);
}