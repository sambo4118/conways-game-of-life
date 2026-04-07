const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const htmlPath = path.join(__dirname, "index.html");
const jsPath = path.join(__dirname, "index.js");

const server = http.createServer((req, res) => {
	if (req.url === "/" || req.url === "/index.html") {
		fs.readFile(htmlPath, (err, data) => {
			if (err) {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end("Failed to load index.html");
				return;
			}

			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(data);
		});
		return;
	}

	if (req.url === "/index.js") {
		fs.readFile(jsPath, (err, data) => {
			if (err) {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end("Failed to load index.js");
				return;
			}

			res.writeHead(200, { "Content-Type": "application/javascript" });
			res.end(data);
		});
		return;
	}

	res.writeHead(404, { "Content-Type": "text/plain" });
	res.end("Not Found");
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
