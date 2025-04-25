const fs = require('fs-extra');
const path = require('path');
const parser = require('./parser');
const renderer = require('./renderer');
const { glob } = require('glob');

/**
 * Generate ERD diagram from Laravel models
 * @param {Object} options Configuration options
 * @returns {Promise<void>}
 */
async function generate(options) {
  // Find all model files
  const modelFiles = await glob(`${options.modelsDir}/**/*.php`);
  
  if (modelFiles.length === 0) {
    throw new Error('No model files found');
  }
  
  // Parse models to extract entities and relationships
  const entities = [];
  const relationships = [];
  
  for (const file of modelFiles) {
    const content = await fs.readFile(file, 'utf8');
    const modelName = path.basename(file, '.php');
    
    const entity = parser.parseModel(modelName, content);
    if (entity) {
      entities.push(entity);
      
      if (options.includeRelations) {
        const modelRelationships = parser.parseRelationships(modelName, content, entities);
        relationships.push(...modelRelationships);
      }
    }
  }
  
  // Generate the ERD diagram
  const diagram = renderer.renderERD(entities, relationships, options.title);
  
  // Create the HTML viewer
  const htmlContent = renderer.createViewer(diagram, options.title);
  
  // Write output files
  await fs.writeFile(path.join(options.outputDir, 'index.html'), htmlContent);
  await fs.writeFile(path.join(options.outputDir, 'diagram.mmd'), diagram);
  
  return { 
    entities: entities.length, 
    relationships: relationships.length 
  };
}

module.exports = { generate };