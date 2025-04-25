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
      
      // Add attributes
      entity.attributes.forEach(attr => {
        let typeDisplay = attr.type || 'string';
        let flagsDisplay = '';
        
        if (attr.primary) flagsDisplay += ' PK';
        if (attr.nullable) flagsDisplay += ' NULL';
        
        mermaid += `        ${typeDisplay} ${attr.name}${flagsDisplay}\n`;
      });
      
      mermaid += '    }\n\n';
    });
    
    // Add relationships
    relationships.forEach(rel => {
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
      
      mermaid += `    ${rel.from} ${relationSymbol} ${rel.to} : "${rel.name}"\n`;
    });
    
    return mermaid;
  }
  
  /**
   * Create HTML viewer for the ERD diagram
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
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <style>
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f5f7fa;
          }
          .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
          }
          .header {
              background-color: #fff;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              margin-bottom: 20px;
          }
          .diagram-container {
              background-color: #fff;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: auto;
          }
          h1 {
              color: #2d3748;
              margin-top: 0;
          }
          .footer {
              margin-top: 20px;
              text-align: center;
              color: #718096;
              font-size: 0.9rem;
          }
          .controls {
              margin-bottom: 20px;
          }
          button {
              background-color: #4a5568;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              margin-right: 10px;
          }
          button:hover {
              background-color: #2d3748;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>${title}</h1>
              <p>Generated with @priom7/laravel2erd</p>
          </div>
          
          <div class="controls">
              <button id="zoom-in">Zoom In</button>
              <button id="zoom-out">Zoom Out</button>
              <button id="reset-zoom">Reset Zoom</button>
              <button id="download-svg">Download SVG</button>
          </div>
          
          <div class="diagram-container">
              <div class="mermaid" id="erd-diagram">
  ${diagram}
              </div>
          </div>
          
          <div class="footer">
              <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
      </div>
  
      <script>
          mermaid.initialize({
              theme: 'default',
              securityLevel: 'loose',
              er: {
                  diagramPadding: 20
              }
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
      </script>
  </body>
  </html>`;
  }
  
  module.exports = {
    renderERD,
    createViewer
  };