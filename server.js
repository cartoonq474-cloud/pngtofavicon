const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // 301 Redirect for shopify-favicon to tutorials/shopify-favicon
  const parsedUrl = new URL(req.url, 'http://localhost');
  let pathname = parsedUrl.pathname;
  const redirectRegex = /^\/((?:[a-z]{2}\/)?)shopify-favicon\/?$/i;
  const match = pathname.match(redirectRegex);
  if (match) {
    const langPrefix = match[1] || '';
    const targetUrl = `/${langPrefix}tutorials/shopify-favicon/${parsedUrl.search}`;
    res.writeHead(301, {
      'Location': targetUrl,
      'Cache-Control': 'public, max-age=31536000'
    });
    res.end();
    return;
  }

  // 301 Redirect for wordpress-favicon to tutorials/wordpress-favicon
  const wpMatch = pathname.match(/^\/((?:[a-z]{2}\/)?)wordpress-favicon\/?$/i);
  if (wpMatch) {
    const langPrefix = wpMatch[1] || '';
    const targetUrl = `/${langPrefix}tutorials/wordpress-favicon/${parsedUrl.search}`;
    res.writeHead(301, {
      'Location': targetUrl,
      'Cache-Control': 'public, max-age=31536000'
    });
    res.end();
    return;
  }

  // 301 Redirect for wix-favicon to tutorials/wix-favicon
  const wixMatch = pathname.match(/^\/((?:[a-z]{2}\/)?)wix-favicon\/?$/i);
  if (wixMatch) {
    const langPrefix = wixMatch[1] || '';
    const targetUrl = `/${langPrefix}tutorials/wix-favicon/${parsedUrl.search}`;
    res.writeHead(301, {
      'Location': targetUrl,
      'Cache-Control': 'public, max-age=31536000'
    });
    res.end();
    return;
  }

  // 301 Redirect for blogger-favicon to tutorials/blogger-favicon
  const bloggerMatch = pathname.match(/^\/((?:[a-z]{2}\/)?)blogger-favicon\/?$/i);
  if (bloggerMatch) {
    const langPrefix = bloggerMatch[1] || '';
    const targetUrl = `/${langPrefix}tutorials/blogger-favicon/${parsedUrl.search}`;
    res.writeHead(301, {
      'Location': targetUrl,
      'Cache-Control': 'public, max-age=31536000'
    });
    res.end();
    return;
  }

  // 301 Redirect for react-favicon to tutorials/react-favicon
  const reactMatch = pathname.match(/^\/((?:[a-z]{2}\/)?)react-favicon\/?$/i);
  if (reactMatch) {
    const langPrefix = reactMatch[1] || '';
    const targetUrl = `/${langPrefix}tutorials/react-favicon/${parsedUrl.search}`;
    res.writeHead(301, {
      'Location': targetUrl,
      'Cache-Control': 'public, max-age=31536000'
    });
    res.end();
    return;
  }

  // Normalize path to avoid directory traversal
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // If path is a directory, default to index.html inside it
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (err) {
    // File doesn't exist, will be handled by reading file below
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
