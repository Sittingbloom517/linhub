# LinHub

**Your Linux command center.** Practical distribution guides, terminal references, learning resources, and structured troubleshooting in one place.

LinHub is one shared product with two targets:
- A responsive website.
- A Linux desktop application powered by Tauri 2.

## Current status

Version 0.1.0 — foundation preview.

The starter includes a responsive dashboard, navigation, client-side search, distro cards, a categorized command library with copy buttons, recovery checklists, learning cards, and a Tauri desktop shell.

The guide cards are placeholders. Full installation and recovery articles are not written yet.

## Tech stack
- React 19
- TypeScript
- Vite 8
- Tauri 2 + Rust

## Development

Requirements: Node.js supported by Vite 8, npm, and (for desktop builds) Rust plus the Linux system libraries required by Tauri/WebKitGTK.

Install JavaScript dependencies with npm install.

Run the website locally with npm run dev.

Build the website with npm run build, then preview it with npm run preview.

Run the desktop app with npm run desktop:dev.

Build Linux packages with npm run desktop:build.

Tauri's Linux prerequisites depend on your distribution and packaging target. See https://v2.tauri.app/start/prerequisites/ before building desktop bundles.

## Content safety

LinHub is educational documentation, not an automatic repair tool. Users should understand commands before running them. Guides must distinguish read-only diagnostics from commands that modify the system, state supported distributions and versions, and recommend backups before recovery work.

## Contributing

Contributions should include a clear explanation, supported distribution/version, verification steps, and trustworthy references. Do not submit untested commands as universal fixes.

## License

A license has not been selected yet. Add one before accepting external contributions or distributing releases.
