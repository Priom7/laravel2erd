#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const { program } = require('commander');
const generator = require('../lib/generator');
const chalk = require('chalk');

// Set up command line options
program
  .version(require('../package.json').version)
  .description('Generate ERD diagrams for Laravel applications')
  .option('-o, --output <directory>', 'Output directory for ERD', 'public/laravel2erd')
  .option('-m, --models <directory>', 'Models directory', 'app/Models')
  .option('-r, --relations', 'Include relationships', true)
  .option('-t, --title <title>', 'Diagram title', 'Laravel ERD Diagram')
  .parse(process.argv);

const options = program.opts();

console.log(chalk.blue('Laravel2ERD - Generating ERD diagram...'));

// Assume we're in a Laravel project root
const laravelRoot = process.cwd();
const modelsDir = path.join(laravelRoot, options.models);
const outputDir = path.join(laravelRoot, options.output);

// Check if models directory exists
if (!fs.existsSync(modelsDir)) {
  console.error(chalk.red(`Error: Models directory not found at ${modelsDir}`));
  process.exit(1);
}

// Ensure output directory exists
fs.ensureDirSync(outputDir);

// Generate the ERD
generator.generate({
  modelsDir,
  outputDir,
  includeRelations: options.relations,
  title: options.title
})
  .then(() => {
    console.log(chalk.green(`ERD diagram generated successfully at ${outputDir}`));
    console.log(chalk.yellow(`You can view it at: /laravel2erd`));
  })
  .catch(error => {
    console.error(chalk.red(`Error generating ERD: ${error.message}`));
    process.exit(1);
  });