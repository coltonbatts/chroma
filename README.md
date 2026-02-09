# Chroma

Offline color tool for artists — a Swiss army knife for color work.

## Philosophy

- Runs fully offline
- No accounts or subscriptions
- Local data storage
- Finite scope, stable features

## Stack

- Tauri 2 (Rust) + React + Vite
- TypeScript
- TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Tauri CLI: `cargo install tauri-cli`

### Development

```bash
# Frontend only
npm run dev

# Full desktop app
npm run desktop:dev
```

### Build

```bash
npm run desktop:build
```

## Structure

- `src/` — React frontend
- `src-tauri/` — Rust backend
