# MarkView Pro

> A modern, free, and feature-rich online Markdown editor with real-time preview, PDF export, and AI-powered writing assistance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite)](https://vitejs.dev)

## 🎯 Features

- ✨ **Live Preview** - See your Markdown rendered in real-time as you type
- 📄 **PDF Export** - Download your documents as professional PDF files
- 🤖 **AI Polish** - Enhance your writing with Google Gemini AI assistance
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 🔒 **Secure & Private** - 100% client-side processing, no data sent to servers
- ⚡ **Fast & Lightweight** - Built with Vite for instant load times
- 🌐 **No Installation** - Works in any modern web browser
- 💾 **Easy Download** - Export as Markdown or PDF

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MarkView-Pro.git
   cd MarkView-Pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 📋 Usage

1. **Write Markdown** - Type or paste Markdown content in the editor
2. **See Live Preview** - Watch the preview update in real-time
3. **Switch Views** - Use the toolbar to switch between Editor, Split, and Preview modes
4. **Export** - Download as Markdown (.md) or PDF
5. **AI Enhancement** - Click "AI Polish" to improve your writing (requires API key)

### View Modes

- **Editor Only** - Focus on writing without distractions
- **Split View** - Edit and preview side-by-side (default)
- **Preview Only** - Read the final rendered output

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

To get a Gemini API key:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

## 📁 Project Structure

```
MarkView-Pro/
├── index.html          # HTML entry point with SEO tags
├── index.tsx           # React app entry point
├── App.tsx             # Main application component
├── constants.ts        # Default content and constants
├── types.ts            # TypeScript type definitions
├── components/
│   ├── Editor.tsx      # Markdown editor textarea
│   ├── Preview.tsx     # Live preview renderer
│   └── Toolbar.tsx     # Top toolbar with controls
├── services/
│   └── geminiService.ts # Google Gemini AI integration
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## 🎨 Tech Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS + Typography Plugin
- **Markdown Parser**: Marked 17
- **Security**: DOMPurify 3
- **PDF Generation**: html2pdf.js
- **Icons**: Lucide React
- **AI Integration**: Google Generative AI

## 🌟 Features in Detail

### Real-Time Markdown Preview
- GitHub Flavored Markdown (GFM) support
- Syntax highlighting for code blocks
- Tables, lists, and nested formatting
- XSS protection with DOMPurify sanitization

### PDF Export
- Beautiful PDF layouts with proper formatting
- Maintains styling and structure from markdown
- Responsive design for different page sizes
- One-click download

### AI-Powered Writing Enhancement
- Uses Google Gemini to improve your content
- Grammar and style suggestions
- Works entirely client-side for privacy
- Optional feature (requires API key)

### Responsive Design
- Works seamlessly on desktop, tablet, and mobile
- Touch-friendly interface
- Adaptable view modes for different screen sizes
- Custom scrollbar styling

## 📦 Dependencies

### Production
- `react` - UI library
- `react-dom` - DOM rendering
- `marked` - Markdown parser
- `dompurify` - XSS sanitization
- `lucide-react` - Icon library
- `@google/genai` - AI integration

### Development
- `typescript` - Type safety
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin for Vite
- `tailwindcss` - Utility CSS framework

## 🔐 Security & Privacy

- **Client-Side Processing**: All markdown processing happens in your browser
- **No Backend**: No data is stored on any server
- **XSS Protection**: All HTML is sanitized with DOMPurify
- **Secure Exports**: PDFs are generated locally without uploading content
- **API Keys**: Stored locally in environment variables, never exposed

## 🐛 Troubleshooting

### Blank Screen
- Clear browser cache and reload
- Check browser console for errors (F12)
- Ensure all dependencies are installed with `npm install`

### PDF Export Not Working
- Switch to Preview or Split view (not available in Editor-only mode)
- Try a smaller document first
- Check browser console for any errors

### AI Features Not Working
- Ensure `VITE_GEMINI_API_KEY` is set in `.env`
- Verify API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check network connection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org) - UI framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Marked](https://marked.js.org) - Markdown parsing
- [Google Generative AI](https://ai.google.dev) - AI features
- [Vite](https://vitejs.dev) - Build tool
- [Lucide](https://lucide.dev) - Icons

## 📞 Support

If you encounter any issues or have questions:
- Open an [issue](https://github.com/yourusername/MarkView-Pro/issues)
- Check existing discussions
- Review the [troubleshooting](#-troubleshooting) section

## 🗺️ Roadmap

- [ ] Collaborative editing
- [ ] Dark mode theme
- [ ] Custom CSS support
- [ ] Plugin system
- [ ] Desktop app (Electron)
- [ ] Mobile app (React Native)
- [ ] Cloud sync
- [ ] Document templates

---

Made with ❤️ by [Sarhan Khan](https://github.com/sarhan44)
