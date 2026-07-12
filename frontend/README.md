# NexusRAG Frontend (React + Vite)

A modern, fast, and stunning frontend for the NexusRAG platform. Built with **React 18** and **Vite** for optimized performance, it providing a highly interactive experience for document management and AI chat.

---

## 🎨 Aesthetic Vision: Glassmorphism
The NexusRAG frontend is built on a **Glassmorphism Design System** defined in `index.css`.
- **Materials**: Translucent backgrounds with `backdrop-filter: blur(20px)`.
- **Borders**: Lustrous gradients and subtle double-borders for depth.
- **Micro-Animations**: Keyframes for message entry, sidebar item transitions, and hover-triggered reveals.
- **Typography**: Uses modern sans-serif typefaces (**Outfit**, **Inter**) for a premium feel.

---

## 📱 User Interface Highlights

### 1. Chat Interface (`ChatPage.jsx`)
- **Multi-Chat Support**: Native support for independent chat sessions, persisted locally via `localStorage`.
- **Knowledge Selection**: Real-time dropdown to choose exactly which indexed files should provide context for the next question.
- **Chat Management**: Dynamic session titles based on context, with a delete button for each chat item.
- **Typing Indicators**: Visual feedback for active AI processing.

### 2. Admin Portal (`AdminPage.jsx`)
- **Connector Management**: Intuitive interface to add and configure Knowledge Base sources.
    - **Local File Upload**: Drag-and-drop support for PDF, DOCX, and Text files.
    - **Notion Integration**: Simple token connection, discovery, and one-click page indexing.
- **System Activity**: Live health status, active embedding model details, and an admin "Danger Zone" to purge knowledge.

---

## 🛠️ Performance & Tech Stack
- **Framework**: React 18 (Functional Components & Hooks).
- **Core Library**: React Router v6.
- **State Management**: Shared React state and `useEffect`-pushed browser persistence.
- **Styling**: Vanilla CSS with modern flex/grid layouts.
- **API Communication**: Native `fetch` with robust error handling and `FormData` for multipart uploads.

---

## 🚀 Setup & Installation

### 1. Prerequisite
Ensure the **NexusRAG Backend** is running at `http://localhost:8000`.

### 2. Core Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
# Default host: http://localhost:5173
```

### 4. Production Build
```bash
npm run build
```

---

## 📜 Key Files
- `App.jsx`: Core routing and authentication wrapper.
- `index.css`: The heart of the design system.
- `src/pages/`: Contains the main application views (Chat, Admin, Auth).

---

Created with ✨ by **DeepMind Advanced Agentic Coding Team**.
