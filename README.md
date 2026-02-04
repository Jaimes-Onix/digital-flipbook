# 📚 Lifewood Digital Flipbook

A beautiful, modern digital flipbook application built with React, TypeScript, and Vite. Transform your PDFs into stunning interactive flipbooks with an Apple-inspired design.

## ✨ Features

- 📖 **PDF to Flipbook** - Convert PDFs to interactive page-flipping books
- 🎨 **Apple-Inspired Design** - Clean, minimalist black & white interface
- 🗂️ **Library Management** - Organize books by categories (Philippines, Internal, International, PH Interns)
- ⭐ **Favorites** - Mark and access your favorite books quickly
- 🔍 **Zoom Controls** - Smooth draggable zoom slider
- 🎯 **Reader Modes** - Manual reading or auto-preview mode
- 📊 **Progress Tracking** - Visual progress bar while reading
- 🎨 **Book Covers** - Automatic cover extraction from PDFs
- 🌓 **Dark/Light Mode** - Toggle between themes
- 🔗 **Routing** - Navigate with URLs (/home, /library, /favorites, etc.)
- 💾 **AI Summaries** - Generate book summaries with Gemini AI

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **PDF Handling**: PDF.js
- **Page Flipping**: react-pageflip
- **Routing**: React Router DOM
- **AI**: Google Gemini AI
- **Build Tool**: Vite

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/lifewood-digital-flipbook.git
   cd lifewood-digital-flipbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage

1. **Upload PDF** - Click "Upload PDF" to add books to your library
2. **Organize** - Categorize books and mark favorites
3. **Read** - Click any book to open in the reader
4. **Navigate** - Use arrow keys or click to flip pages
5. **Zoom** - Drag the zoom slider to zoom in/out

## 🏗️ Project Structure

```
├── components/
│   ├── BookViewer.tsx      # PDF flipbook viewer
│   ├── Controls.tsx        # Reader controls
│   ├── Header.tsx          # Top navigation bar
│   ├── Sidebar.tsx         # Left sidebar navigation
│   ├── Library.tsx         # Book library grid
│   ├── Home.tsx            # Homepage
│   ├── Upload.tsx          # PDF upload interface
│   └── ...
├── utils/
│   └── pdfUtils.ts         # PDF processing utilities
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main app component with routing
├── index.html              # HTML entry point
└── index.tsx               # React entry point

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎨 Features in Detail

### Book Reader
- Realistic page-flipping animation
- Keyboard navigation (← → arrows, ESC)
- Smooth zoom with drag controls
- Progress tracking
- Fullscreen mode

### Library Management
- Grid view of all books
- Category filters
- Favorites collection
- Search and organize
- Beautiful book covers

### Design
- Apple-inspired minimalist interface
- Black & white color scheme
- Floating, glassmorphic controls
- Smooth animations
- Responsive design

## 🔒 Security

- `.env.local` is git-ignored to protect API keys
- Supabase access tokens are never committed
- All sensitive data is kept locally

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ by Lifewood Team
