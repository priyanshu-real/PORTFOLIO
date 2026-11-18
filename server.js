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
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Basic sanitization
    const safeUrlPath = decodeURIComponent(req.url.split('?')[0]);
    const cleanPath = safeUrlPath.replace(/\/+$/, '') || '/';
    let targetPath = path.join(__dirname, cleanPath === '/' ? 'index.html' : cleanPath);

    // Prevent directory traversal
    if (!targetPath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    const serveFile = (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => {
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
            }
        });
    };

    fs.stat(targetPath, (err, stats) => {
        if (!err) {
            if (stats.isDirectory()) {
                const indexFile = path.join(targetPath, 'index.html');
                return fs.stat(indexFile, (indexErr) => {
                    if (indexErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404 Not Found');
                        return;
                    }
                    serveFile(indexFile);
                });
            }
            return serveFile(targetPath);
        }

        // Support clean multi-page URLs (e.g., /about -> about.html)
        if (!path.extname(targetPath)) {
            const htmlCandidate = `${targetPath}.html`;
            return fs.stat(htmlCandidate, (htmlErr, htmlStats) => {
                if (!htmlErr && htmlStats.isFile()) {
                    return serveFile(htmlCandidate);
                }
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found');
            });
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
    });
});

server.listen(PORT, () => {
    console.log(`\n===================================================`);
    console.log(`  Priyanshu's Portfolio Server is Live!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`===================================================\n`);
});
