#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Only run this in a Laravel project
function isLaravelProject() {
  try {
    return fs.existsSync(path.join(process.cwd(), 'artisan'));
  } catch (error) {
    return false;
  }
}

async function setup() {
  // Skip if not in a Laravel project
  if (!isLaravelProject()) {
    console.log(chalk.yellow('Not a Laravel project, skipping setup.'));
    return;
  }

  try {
    // Create the output directory
    const outputDir = path.join(process.cwd(), 'public', 'laravel2erd');
    fs.ensureDirSync(outputDir);
    
    // Copy the template files
    const templateDir = path.join(__dirname, '..', 'public');
    await fs.copy(templateDir, outputDir);
    
    console.log(chalk.green('Laravel2ERD has been successfully installed!'));
    console.log(chalk.blue('Run the following command to generate your ERD:'));
    console.log(chalk.yellow('npx laravel2erd'));
    console.log(chalk.blue('Then view your ERD at:'));
    console.log(chalk.yellow('http://your-app-url/laravel2erd'));
  } catch (error) {
    console.error(chalk.red(`Setup failed: ${error.message}`));
  }
}

setup();