/**
 * Parse a Laravel model file to extract entity information
 * @param {string} modelName Name of the model
 * @param {string} content PHP content of the model file
 * @returns {Object|null} Entity information
 */
function parseModel(modelName, content) {
    // Skip non-model files or abstract classes
    if (content.includes('abstract class') || !content.includes('class')) {
      return null;
    }
    
    const entity = {
      name: modelName,
      attributes: [],
      tableName: extractTableName(content, modelName)
    };
    
    // Extract fillable attributes
    const fillableMatch = content.match(/protected\s+\$fillable\s*=\s*\[([\s\S]*?)\]/);
    if (fillableMatch) {
      const fillableStr = fillableMatch[1];
      const attributes = fillableStr.match(/'([^']+)'/g) || [];
      
      entity.attributes = attributes.map(attr => {
        return {
          name: attr.replace(/'/g, ''),
          type: 'string' // Default type, can be improved
        };
      });
    }
    
    // Try to extract casts to determine types
    const castsMatch = content.match(/protected\s+\$casts\s*=\s*\[([\s\S]*?)\]/);
    if (castsMatch) {
      const castsStr = castsMatch[1];
      const castPairs = castsStr.match(/'([^']+)'\s*=>\s*'([^']+)'/g) || [];
      
      castPairs.forEach(pair => {
        const [attr, type] = pair.replace(/'/g, '').split('=>').map(item => item.trim());
        
        // Find existing attribute or add new one
        const existingAttr = entity.attributes.find(a => a.name === attr);
        if (existingAttr) {
          existingAttr.type = type;
        } else {
          entity.attributes.push({ name: attr, type });
        }
      });
    }
    
    // Add timestamps if not disabled
    if (!content.includes('public $timestamps = false')) {
      entity.attributes.push(
        { name: 'created_at', type: 'timestamp' },
        { name: 'updated_at', type: 'timestamp' }
      );
    }
    
    // Add ID if not specified
    if (!entity.attributes.some(attr => attr.name === 'id') && 
        !content.includes('protected $primaryKey')) {
      entity.attributes.unshift({ name: 'id', type: 'bigint', primary: true });
    }
    
    return entity;
  }
  
  /**
   * Extract table name from model content
   */
  function extractTableName(content, modelName) {
    const tableMatch = content.match(/protected\s+\$table\s*=\s*['"]([^'"]+)['"]/);
    if (tableMatch) {
      return tableMatch[1];
    }
    
    // Default Laravel table naming convention
    return pluralize(modelName.toLowerCase());
  }
  
  /**
   * Basic pluralization (can be improved)
   */
  function pluralize(word) {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s')) {
      return word;
    }
    return word + 's';
  }
  
  /**
   * Parse relationships from model content
   */
  function parseRelationships(modelName, content, entities) {
    const relationships = [];
    
    // Look for standard Laravel relationships
    const relationTypes = [
      { method: 'hasOne', type: '1-1' },
      { method: 'hasMany', type: '1-N' },
      { method: 'belongsTo', type: 'N-1' },
      { method: 'belongsToMany', type: 'N-N' }
    ];
    
    relationTypes.forEach(relation => {
      const regex = new RegExp(`function\\s+([a-zA-Z0-9_]+)\\s*\\(\\s*\\)\\s*{[\\s\\S]*?\\$this->${relation.method}\\s*\\(\\s*([^),]+)`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const relationName = match[1];
        const relatedModel = match[2].trim().replace(/::class|['"`]/g, '').split('\\').pop();
        
        // Skip if we can't determine the related model
        if (!relatedModel) continue;
        
        relationships.push({
          from: modelName,
          to: relatedModel,
          name: relationName,
          type: relation.type
        });
      }
    });
    
    return relationships;
  }
  
  module.exports = {
    parseModel,
    parseRelationships
  };