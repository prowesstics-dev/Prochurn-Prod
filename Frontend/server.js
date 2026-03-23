import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Use 'dist' directory for Vite builds
const BUILD_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

console.log('Starting server...');

const server = http.createServer(async (req, res) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  
  // Handle root and default routing
  let filePath = path.join(BUILD_DIR, 
    req.url === '/' ? 'index.html' : req.url
  );

  // Normalize path to prevent directory traversal
  filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  try {
    // Try to read the requested file
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    // If file not found, serve index.html (for SPA routing)
    if (error.code === 'ENOENT') {
      try {
        const indexContent = await fs.readFile(path.join(BUILD_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexContent);
      } catch (indexError) {
        console.error('Could not read index.html', indexError);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
    } else {
      console.error(`Error reading file: ${filePath}`, error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
    }
  }
});

// Improved error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});