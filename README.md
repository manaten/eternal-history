# Eternal History

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![React](https://img.shields.io/badge/React-19.0.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.2.0-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A Chrome extension that makes your browser history unlimited and searchable by storing it in bookmarks with a hierarchical folder structure.

## ✨ Features

- **📚 Unlimited History Storage**: Store your browsing history permanently using Chrome bookmarks
- **🔍 Fast Search**: Search through your entire history with real-time filtering

## 🎯 Why Eternal History?

Chrome's default history has limitations:

- Limited retention period
- No comprehensive search capabilities
- Data can be lost when clearing browser data

Eternal History solves these problems by:

- **Permanent Storage**: Using bookmarks ensures your history persists
- **Structured Organization**: Hierarchical folder system for easy navigation

## 📦 Installation

### From Source

1. **Clone the repository**

   ```bash
   git clone https://github.com/manaten/eternal-history.git
   cd eternal-history
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## 🔧 Development

1. **Start development mode**

   ```bash
   npm run dev
   ```

2. **Run Storybook** (for component development)

   ```bash
   npm run storybook
   ```

3. **Run tests**
   ```bash
   npm test
   ```

### Scripts

```bash
# Development
npm run dev          # Watch mode build
npm run storybook    # Component development

# Building
npm run build        # Production build
npm run typecheck    # Type checking

# Code Quality
npm run lint         # Run all linters
npm run fix          # Auto-fix issues
npm test             # Run test suite
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
