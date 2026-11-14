# LinHub architecture

## Product goal
LinHub is one Linux knowledge product with two delivery targets: a responsive website and a Linux desktop application hosted by Tauri 2. Both share the same React frontend, content models, search, and guides.

## Stack
- React 19 + TypeScript for the interface.
- Vite 8 for development and production builds.
- Tauri 2 + Rust for the desktop shell and Linux packages.
- Typed TypeScript modules for the first version of the knowledge base.

## Repository layout
- src/data: typed distro, command, and guide content.
- src/App.tsx: navigation and page composition.
- src/main.tsx: browser entry point.
- src/styles.css: shared responsive design.
- src-tauri: Tauri configuration and Rust application entry point.
- docs: architecture and contributor documentation.

## Content architecture
The initial content is stored in typed source files. This keeps the first version simple and requires no database or backend. As the library grows, articles should move to Markdown or MDX with fields for title, slug, summary, category, supported distributions/releases, difficulty, reading time, last-reviewed date, warnings, and references.

Technical guides must be reviewed and scoped to supported distro versions. Commands that change disks, boot settings, packages, or system configuration need clear impact warnings and recovery notes.

## Search
The initial search runs client-side across commands, distributions, and guide metadata. A generated index can be added later. Search should also work offline in the desktop build.

## Platform boundary
The website must never depend on Tauri APIs. Future desktop-only features should live behind a small platform adapter, with a browser fallback.

## Roadmap
1. 0.1 Foundation: shared UI, sample content, search, Tauri shell.
2. 0.2 Knowledge base: Markdown/MDX article renderer, tags, references, related guides.
3. 0.3 Search: full-text index, filters, keyboard shortcut, recent searches.
4. 0.4 Desktop polish: native menus, bookmarks, offline content cache, Linux packages.
5. 0.5 Contributions: content validation, link checker, contribution templates, review workflow.

## Safety and quality
Prefer read-only diagnostics before repair commands. Explain each command, flag privileged/destructive operations, state distro/version coverage, and include references plus a last-reviewed date.
