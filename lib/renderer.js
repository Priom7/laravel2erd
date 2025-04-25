/**
 * Render ERD diagram in Mermaid format
 * @param {Array} entities List of entities
 * @param {Array} relationships List of relationships
 * @param {string} title Diagram title
 * @returns {string} Mermaid diagram code
 */
function renderERD(entities, relationships, title) {
    let mermaid = 'erDiagram\n';
    
    // Add title as a comment
    mermaid += `    %% ${title}\n\n`;
    
    // Add entities
    entities.forEach(entity => {
      mermaid += `    ${entity.name} {\n`;
      
      // Add attributes with proper types
      entity.attributes.forEach(attr => {
        let typeDisplay = attr.type || 'string';
        
        // Format special types like decimal with precision
        if (attr.type === 'decimal' && attr.precision) {
          typeDisplay = `decimal:${attr.precision}`;
        }
        
        let flagsDisplay = '';
        
        // Add flags like PK, FK, NULL
        if (attr.primary) flagsDisplay += ' PK';
        if (attr.foreign) flagsDisplay += ' FK';
        if (attr.nullable) flagsDisplay += ' NULL';
        
        mermaid += `        ${typeDisplay} ${attr.name}${flagsDisplay}\n`;
      });
      
      mermaid += '    }\n\n';
    });
    
    // Track processed relationships to avoid duplicates
    const processedRelationships = new Set();
    
    // Add relationships with improved cardinality notation
    relationships.forEach(rel => {
      // Create a unique key for this relationship
      const relationKey = `${rel.from}-${rel.to}-${rel.name}`;
      if (processedRelationships.has(relationKey)) {
        return; // Skip duplicates
      }
      processedRelationships.add(relationKey);
      
      // Determine the relationship symbol based on type
      let relationSymbol = '--';
      
      switch (rel.type) {
        case '1-1':
          relationSymbol = '||--||';
          break;
        case '1-N':
          relationSymbol = '||--o{';
          break;
        case 'N-1':
          relationSymbol = '}o--||';
          break;
        case 'N-N':
          relationSymbol = '}o--o{';
          break;
      }
      
      // Use the provided cardinality if available
      if (rel.cardinality) {
        relationSymbol = rel.cardinality;
      }
      
      // Description in quotes
      const description = rel.description || rel.name;
      mermaid += `    ${rel.from} ${relationSymbol} ${rel.to} : "${description}"\n`;
    });
    
    return mermaid;
  }
  
  /**
   * Create HTML viewer for the ERD diagram with enhanced features
   * @param {string} diagram Mermaid diagram code
   * @param {string} title Diagram title
   * @returns {string} HTML content
   */
  function createViewer(diagram, title) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@9.4.3/dist/mermaid.min.js"></script>
      <style>
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f7fa;
              color: #2d3748;
          }
          .container {
              max-width: 1400px;
              margin: 0 auto;
              padding: 20px;
          }
          .header {
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
          }
          .header-content {
              flex: 1;
          }
          .diagram-container {
              background-color: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: auto;
              min-height: 600px;
          }
          .mermaid svg {
              min-width: 100%;
          }
          h1 {
              color: #2d3748;
              margin-top: 0;
              font-size: 1.8rem;
          }
          .subtitle {
              color: #718096;
              font-size: 1rem;
              margin-top: 5px;
          }
          .footer {
              margin-top: 20px;
              text-align: center;
              color: #718096;
              font-size: 0.9rem;
              padding: 10px;
          }
          .controls {
              display: flex;
              margin-bottom: 20px;
              flex-wrap: wrap;
              gap: 10px;
          }
          .control-group {
              display: flex;
              gap: 8px;
              margin-right: 15px;
          }
          button {
              background-color: #4a5568;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              transition: background-color 0.2s;
              display: flex;
              align-items: center;
              gap: 4px;
          }
          button:hover {
              background-color: #2d3748;
          }
          .search-box {
              display: flex;
              margin-right: 15px;
          }
          .search-box input {
              padding: 8px 12px;
              border: 1px solid #cbd5e0;
              border-radius: 4px 0 0 4px;
              font-size: 14px;
              min-width: 200px;
          }
          .search-box button {
              border-radius: 0 4px 4px 0;
          }
          .entity-count {
              background-color: #e2e8f0;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 14px;
              color: #4a5568;
              display: flex;
              align-items: center;
          }
          #entity-list {
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              padding: 15px;
              margin-bottom: 20px;
              display: none;
          }
          #entity-list.active {
              display: block;
          }
          #entity-list h3 {
              margin-top: 0;
              margin-bottom: 10px;
              font-size: 1.2rem;
          }
          .entity-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
          }
          .entity-tag {
              background-color: #e2e8f0;
              padding: 5px 10px;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.2s;
          }
          .entity-tag:hover {
              background-color: #cbd5e0;
          }
          .entity-tag.highlight {
              background-color: #4299e1;
              color: white;
          }
          .search-highlight {
              background-color: #faf089;
          }
          .dark-mode {
              background-color: #1a202c;
              color: #e2e8f0;
          }
          .dark-mode .header, 
          .dark-mode .diagram-container,
          .dark-mode #entity-list {
              background-color: #2d3748;
              color: #e2e8f0;
          }
          .dark-mode h1 {
              color: #e2e8f0;
          }
          .dark-mode .subtitle {
              color: #a0aec0;
          }
          .dark-mode .entity-count {
              background-color: #4a5568;
              color: #e2e8f0;
          }
          .dark-mode .entity-tag {
              background-color: #4a5568;
              color: #e2e8f0;
          }
          .dark-mode .entity-tag:hover {
              background-color: #718096;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="header-content">
                  <h1>${title}</h1>
                  <p class="subtitle">Generated with @priom7/laravel2erd</p>
              </div>
              <div class="entity-count">
                  <span id="entity-counter">...</span> entities
              </div>
          </div>
          
          <div class="controls">
              <div class="control-group">
                  <button id="zoom-in">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      Zoom In
                  </button>
                  <button id="zoom-out">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      Zoom Out
                  </button>
                  <button id="reset-zoom">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 3H3v18h18V3z"></path>
                          <path d="M21 3l-9 9-9-9"></path>
                      </svg>
                      Reset
                  </button>
              </div>
              
              <div class="search-box">
                  <input type="text" id="search-input" placeholder="Search entities...">
                  <button id="search-button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                  </button>
              </div>
              
              <button id="toggle-entities">Show All Entities</button>
              <button id="download-svg">Download SVG</button>
              <button id="toggle-dark-mode">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  Dark Mode
              </button>
          </div>
          
          <div id="entity-list">
              <h3>Entities</h3>
              <div class="entity-tags" id="entity-tags-container">
                  <!-- Entity tags will be populated here -->
              </div>
          </div>
          
          <div class="diagram-container">
              <div class="mermaid" id="erd-diagram">
  ${diagram}
              </div>
          </div>
          
          <div class="footer">
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
      </div>
  
      <script>
          // Initialize Mermaid
          mermaid.initialize({
              theme: 'default',
              securityLevel: 'loose',
              er: {
                  diagramPadding: 20,
                  layoutDirection: 'TB',
                  minEntityWidth: 100,
                  minEntityHeight: 75,
                  entityPadding: 15
              }
          });
          
          // Wait for the diagram to render
          document.addEventListener('DOMContentLoaded', function() {
              // Extract entity names from the diagram
              const diagramText = document.getElementById('erd-diagram').textContent;
              const entityMatches = diagramText.match(/\\s+([A-Za-z0-9_]+)\\s+{/g) || [];
              const entities = entityMatches.map(match => match.trim().replace(/\\s+{$/, '').trim());
              
              // Update entity counter
              document.getElementById('entity-counter').textContent = entities.length;
              
              // Populate entity tags
              const entityTagsContainer = document.getElementById('entity-tags-container');
              entities.forEach(entity => {
                  const tag = document.createElement('div');
                  tag.className = 'entity-tag';
                  tag.textContent = entity;
                  tag.addEventListener('click', () => highlightEntity(entity));
                  entityTagsContainer.appendChild(tag);
              });
          });
          
          // Initialize zoom
          let zoom = 1;
          const zoomStep = 0.1;
          const diagram = document.getElementById('erd-diagram');
          
          document.getElementById('zoom-in').addEventListener('click', () => {
              zoom += zoomStep;
              diagram.style.transform = \`scale(\${zoom})\`;
              diagram.style.transformOrigin = 'top left';
          });
          
          document.getElementById('zoom-out').addEventListener('click', () => {
              if (zoom > zoomStep) {
                  zoom -= zoomStep;
                  diagram.style.transform = \`scale(\${zoom})\`;
                  diagram.style.transformOrigin = 'top left';
              }
          });
          
          document.getElementById('reset-zoom').addEventListener('click', () => {
              zoom = 1;
              diagram.style.transform = 'scale(1)';
          });
          
          document.getElementById('toggle-entities').addEventListener('click', () => {
              const entityList = document.getElementById('entity-list');
              entityList.classList.toggle('active');
              const button = document.getElementById('toggle-entities');
              button.textContent = entityList.classList.contains('active') ? 'Hide Entities' : 'Show All Entities';
          });
          
          document.getElementById('toggle-dark-mode').addEventListener('click', () => {
              document.body.classList.toggle('dark-mode');
          });
          
          document.getElementById('download-svg').addEventListener('click', () => {
              const svg = document.querySelector('.mermaid svg');
              if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const blob = new Blob([svgData], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'laravel-erd.svg';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              }
          });
          
          // Search functionality
          document.getElementById('search-button').addEventListener('click', performSearch);
          document.getElementById('search-input').addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                  performSearch();
              }
          });
          
          function performSearch() {
              const searchTerm = document.getElementById('search-input').value.toLowerCase();
              if (!searchTerm) return;
              
              const entityTags = document.querySelectorAll('.entity-tag');
              entityTags.forEach(tag => {
                  tag.classList.remove('highlight');
                  if (tag.textContent.toLowerCase().includes(searchTerm)) {
                      tag.classList.add('highlight');
                  }
              });
              
              // Make sure entity list is visible
              document.getElementById('entity-list').classList.add('active');
              document.getElementById('toggle-entities').textContent = 'Hide Entities';
          }
          
          function highlightEntity(entityName) {
              // This would ideally scroll to or highlight the entity in the diagram
              // But would require additional integration with Mermaid
              console.log('Entity selected:', entityName);
              
              // For now, we'll highlight the tag
              const entityTags = document.querySelectorAll('.entity-tag');
              entityTags.forEach(tag => {
                  tag.classList.remove('highlight');
                  if (tag.textContent === entityName) {
                      tag.classList.add('highlight');
                  }
              });
          }
      </script>
  </body>
  </html>`;
  }
  
  module.exports = {
    renderERD,
    createViewer
  };