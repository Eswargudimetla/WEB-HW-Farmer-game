Local Development Server for farmer-game

This folder contains a simple static website (index.html, main.js, style.css).

Run using PowerShell (Windows)

1) Quick: Python 3 built-in HTTP server (port 8000)

Open PowerShell in this folder (d:\web\HW2\farmer-game) and run:

python -m http.server 8000

Then open http://localhost:8000 in your browser.

If "python" points to Python 2, you can try:

python3 -m http.server 8000

2) Alternative: Node.js http-server (if you have Node installed)

Install once (in any folder):

npm install -g http-server

Start server in this folder:

http-server -p 8000

Open http://localhost:8000 in your browser.

3) VS Code: Live Server extension

- Install the Live Server extension in VS Code.
- Open this folder in VS Code and press "Go Live" (bottom-right) or right-click `index.html` -> "Open with Live Server".

Notes

- If port 8000 is in use, change to another port (e.g., 3000) by replacing 8000 with your chosen port.
- You can stop the server with Ctrl+C in PowerShell.
- If you need HTTPS or custom routing, tell me and I can add steps or a tiny Node/Express server.