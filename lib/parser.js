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
  
  // Always add ID if not explicitly disabled
  if (!content.includes('public $incrementing = false') && 
      !content.includes('protected $primaryKey')) {
    entity.attributes.unshift({ name: 'id', type: 'bigint', primary: true });
  }
  
  // Extract fillable attributes
  const fillableMatch = content.match(/protected\s+\$fillable\s*=\s*\[([\s\S]*?)\]/);
  if (fillableMatch) {
    const fillableStr = fillableMatch[1];
    const attributes = fillableStr.match(/'([^']+)'/g) || [];
    
    attributes.forEach(attr => {
      const attrName = attr.replace(/'/g, '');
      // Avoid duplicates
      if (!entity.attributes.some(a => a.name === attrName)) {
        entity.attributes.push({
          name: attrName,
          type: 'string' // Default type, will be improved if cast is found
        });
      }
    });
  }
  
  // Try to extract casts to determine types
  const castsMatch = content.match(/protected\s+\$casts\s*=\s*\[([\s\S]*?)\]/);
  if (castsMatch) {
    const castsStr = castsMatch[1];
    // Support both single and double quotes
    const castPairs = castsStr.match(/['"]([^'"]+)['"]\s*=>\s*['"]([^'"]+)['"]/g) || [];
    
    castPairs.forEach(pair => {
      const parts = pair.split('=>').map(part => 
        part.trim().replace(/['"]/g, '')
      );
      
      if (parts.length !== 2) return;
      
      const attr = parts[0];
      const type = mapPHPTypeToERDType(parts[1]);
      
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
    // Check if these attributes are already defined
    if (!entity.attributes.some(attr => attr.name === 'created_at')) {
      entity.attributes.push({ name: 'created_at', type: 'timestamp' });
    }
    if (!entity.attributes.some(attr => attr.name === 'updated_at')) {
      entity.attributes.push({ name: 'updated_at', type: 'timestamp' });
    }
  }
  
  return entity;
}

/**
 * Map PHP/Laravel types to ERD diagram types
 */
function mapPHPTypeToERDType(phpType) {
  const typeMap = {
    'string': 'string',
    'integer': 'integer',
    'int': 'integer',
    'bigint': 'bigint',
    'boolean': 'boolean',
    'bool': 'boolean',
    'float': 'decimal',
    'double': 'decimal',
    'decimal': 'decimal',
    'date': 'date',
    'datetime': 'timestamp',
    'timestamp': 'timestamp',
    'json': 'json',
    'array': 'json',
    'object': 'json',
    'collection': 'json',
    'text': 'text'
  };
  
  return typeMap[phpType.toLowerCase()] || 'string';
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
 * Better pluralization for common Laravel model names
 */
function pluralize(word) {
  // Handle irregular plurals
  const irregularPlurals = {
    'category': 'categories',
    'inventory': 'inventories',
    'country': 'countries',
    'person': 'people',
    'child': 'children',
    'status': 'statuses',
    'analysis': 'analyses',
  };
  
  if (irregularPlurals[word]) {
    return irregularPlurals[word];
  }
  
  // Handle common plural rules
  if (word.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(ending => word.endsWith(ending))) {
    return word.slice(0, -1) + 'ies';
  }
  
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
      word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  
  // Default case
  return word + 's';
}

/**
 * Parse relationships from model content
 */
function parseRelationships(modelName, content, entities) {
  const relationships = [];
  
  // Define relationship patterns with their types
  const relationPatterns = [
    {
      type: '1-1',
      methods: ['hasOne', 'belongsTo'],
      cardinality: '||--||'
    },
    {
      type: '1-N',
      methods: ['hasMany'],
      cardinality: '||--o{'
    },
    {
      type: 'N-1',
      methods: ['belongsTo'],
      cardinality: '}o--||'
    },
    {
      type: 'N-N',
      methods: ['belongsToMany', 'hasManyThrough'],
      cardinality: '}o--o{'
    }
  ];
  
  for (const pattern of relationPatterns) {
    for (const method of pattern.methods) {
      const regex = new RegExp(`function\\s+([a-zA-Z0-9_]+)\\s*\\(\\s*\\)\\s*{[\\s\\S]*?\\$this->${method}\\s*\\(\\s*([^),]+)`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const relationName = match[1];
        let relatedModel = match[2].trim().replace(/::class|['"`]/g, '');
        
        // If the related model includes namespaces, get the last part
        if (relatedModel.includes('\\')) {
          relatedModel = relatedModel.split('\\').pop();
        }
        
        // Skip if we can't determine the related model
        if (!relatedModel) continue;
        
        // Determine the correct relationship type based on method and context
        let relationType = pattern.type;
        let relationCardinality = pattern.cardinality;
        
        // For belongsTo, we need to swap the direction
        if (method === 'belongsTo') {
          relationships.push({
            from: modelName,
            to: relatedModel,
            name: relationName,
            type: relationType,
            cardinality: relationCardinality,
            description: `belongs to`
          });
        } else {
          relationships.push({
            from: modelName,
            to: relatedModel,
            name: relationName,
            type: relationType,
            cardinality: relationCardinality,
            description: method === 'hasOne' ? 'has one' : 'has many'
          });
        }
      }
    }
  }
  
  return relationships;
}

module.exports = {
  parseModel,
  parseRelationships
};