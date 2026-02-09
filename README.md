# Chroma

**An offline-first color tool for artists.**

Chroma is a desktop application built with Tauri and React that provides powerful color utilities for artists, designers, and crafters. It works completely offline and stores all your palettes locally.

---

## What is Chroma?

Chroma is designed from the ground up for artists who work with color in various mediums. Whether you're doing digital art, needlework, painting, or color theory study, Chroma provides the tools you need to:

- **Pick and organize colors** into persistent palettes
- **Match colors to DMC embroidery floss** (cross-stitch threads)
- **Extract colors from images** using a built-in dropper tool
- **View colors in multiple formats** (RGB, HSL, Lab, luminance)

Everything runs locally on your machine—no internet required after initial setup.

---

## Key Features

### 🎨 Color Palette Management
- Add, remove, and organize colors in a persistent palette
- Save palettes to JSON files for backup or sharing
- Automatic localStorage persistence between sessions

### 🧵 DMC Floss Matching
- Find the closest DMC embroidery floss colors to any selected color
- Uses Delta-E Lab color difference algorithm for accurate matching
- Shows confidence levels and top 5 matches
- One-click to add DMC matches to your palette

### 🖼️ Image Color Extraction
- Open images directly in the app
- Use dropper tool to sample colors from any image
- Instantly add extracted colors to your palette

### 📊 Multiple Color Formats
- **RGB** - Red, Green, Blue values
- **HSL** - Hue, Saturation, Lightness
- **Lab** - CIELAB color space for perceptual accuracy
- **Luminance** - Relative brightness percentage

### 🖥️ Desktop Integration
- Native window controls (minimize, maximize, close)
- Keyboard-friendly navigation
- Resizable workspace

---

## Screenshots

*Coming soon—submit a screenshot to contribute!*

---

## Installation

### Prerequisites

- **Node.js** 18+ 
- **pnpm** (recommended) or npm/yarn
- **Rust** toolchain (for Tauri)
- **macOS**, **Windows**, or **Linux**

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/chroma.git
cd chroma

# Install dependencies
pnpm install

# Run development server
pnpm desktop:dev
```

### Building for Production

```bash
# Build the desktop application
pnpm desktop:build
```

The built application will be in `src-tauri/target/release/bundle/`.

---

## Usage

### Terminal Commands

```bash
# Development mode
pnpm desktop:dev

# Production build
pnpm desktop:build

# Preview production build
pnpm preview
```

### Desktop Launcher

After building, launch Chroma from your applications menu or via CLI:

```bash
# On macOS (after build)
open src-tauri/target/release/bundle/dmg/Chroma_*.dmg

# On Linux
./src-tauri/target/release/bundle/deb/chroma_*_amd64.deb

# On Windows
src-tauri\target\release\bundle\msi\Chroma_*.msi
```

### Quick Start

1. **Add colors**: Click "Add Current" or use the dropper on images
2. **Select colors**: Click any color in the palette to view details
3. **Match DMC**: Click the ◈ button to find DMC floss matches
4. **Save palette**: File → Save Palette to export as JSON

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Tauri 2.0](https://tauri.app/) (desktop runtime) |
| **Frontend** | [React 18](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Color Math** | [culori](https://culori.vercel.app/) |
| **State** | [Zustand 5](https://zustand-demo.pmnd.rs/) + localStorage |
| **Bundler** | [Vite 5](https://vitejs.dev/) |

---

## Architecture

```
Chroma/
├── src/
│   ├── components/          # React UI components
│   │   ├── ColorSwatch.tsx  # Individual color in palette
│   │   ├── MatchPanel.tsx   # DMC matching interface
│   │   └── TitleBar.tsx     # Custom title bar
│   ├── lib/
│   │   ├── colorConversion.ts   # RGB/HSL/Lab conversions
│   │   ├── colorTheory.ts       # Color harmony & theory
│   │   ├── colorUtils.ts        # Utility functions
│   │   ├── conversions.ts       # Format conversions
│   │   ├── dmcFloss.ts          # DMC color database & matching
│   │   ├── paletteGenerator.ts  # Palette generation algorithms
│   │   ├── store.ts             # State types
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── valueMode.ts         # Value mode calculations
│   │   └── valueScale.ts        # Value scale utilities
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── src-tauri/               # Tauri backend
│   ├── src/                 # Rust source
│   ├── tauri.conf.json      # Tauri configuration
│   └── Cargo.toml           # Rust dependencies
└── package.json
```

### Data Flow

1. **User Action** → React component (ColorSwatch, dropper, etc.)
2. **State Update** → Zustand store / localStorage persistence
3. **Color Processing** → culori for conversions, dmcFloss for matching
4. **Display** → Tailwind-styled React components

### Color Matching Algorithm

Chroma uses **Delta-E (CIE76)** for DMC color matching:

```
ΔE = √((L₁-L₂)² + (a₁-a₂)² + (b₁-b₂)²)
```

Lower Delta-E values indicate closer color matches. The DMC database contains 500+ thread colors with their RGB values.

---

## Future Features

### Planned Enhancements

- **Dithering Algorithms** - Apply Floyd-Steinberg, Atkinson, and other dithering methods to images
- **ASCII Art Export** - Convert images to ASCII art using your palette colors
- **Spectral Analysis** - Analyze color distribution and spectrum of images
- **Color Harmony Rules** - Suggest complementary, analogous, and triadic colors
- **Import/Export Formats** - Support for ACO, ASE, GPL, and other palette formats
- **Batch Matching** - Match entire palettes against DMC or other databases
- **Plugin System** - Extend with custom color databases and algorithms

### Under Consideration

- Cloud sync (optional, privacy-first)
- Mobile companion app
- Adobe/Procreate plugin integrations
- AI-powered color suggestions

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Tips

```bash
# Run with hot reload
pnpm desktop:dev

# Type check
pnpm tsc --noEmit

# Lint (if configured)
pnpm eslint
```

### Code Style

- Follow TypeScript best practices
- Use Tailwind utility classes for styling
- Write meaningful commit messages
- Add tests for new functionality (coming soon)

---

## License

MIT License—see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [DMC](https://www.dmc.com/) for their color reference library
- [culori](https://culori.vercel.app/) for excellent color math utilities
- [Tauri](https://tauri.app/) for the desktop framework
- All contributors and users!
