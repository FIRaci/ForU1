# Foru — Meme Gallery 🫶

A playful meme sharing platform with categorized folders, physics-based heart animations, and a warm pink aesthetic.

## Features

- 📁 **3 Categorized Folders** — Images, GIFs, Videos with file counts
- 🔐 **Admin Upload** — Press `Alt+T` to open upload panel (admin key required)
- 🤖 **Auto File Detection** — Automatically categorizes uploads as image/gif/video
- ❤️ **Like/Dislike** — Device-based reactions (auto-saved per device, no login)
- 💬 **Curator Notes** — Admin descriptions on each meme
- 🫶 **Heart Physics** — Click the heart button for a rain of draggable physics hearts
- 📱 **Responsive** — Works on desktop and mobile
- 📅 **Date Sorted** — Today's uploads pinned first

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL (Render) |
| File Storage | Local disk (Render) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Render free tier)

### Backend Setup
```bash
cd server
cp .env.example .env
# Fill in DATABASE_URL and ADMIN_SECRET
npm install
npx prisma db push    # Create tables
npm run dev
```

### Frontend Setup
```bash
cd client
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm install
npm run dev
```

## Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string from Render |
| `ADMIN_SECRET` | Secret key for admin uploads |
| `CORS_ORIGIN` | Frontend URL (e.g., https://foru.vercel.app) |
| `PORT` | Server port (default: 3001) |

### Frontend (`client/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., https://foru-api.onrender.com) |

## Deployment

### Render (Backend + Database)
1. Create a PostgreSQL database on Render
2. Create a Web Service, root directory: `server`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Add environment variables (DATABASE_URL, ADMIN_SECRET, CORS_ORIGIN)
6. Add a persistent disk mounted at `/opt/render/project/src/uploads`

### Vercel (Frontend)
1. Connect your GitHub repo
2. Root directory: `client`
3. Add `VITE_API_URL` environment variable
4. Deploy

## Admin Usage

1. Open the website
2. Press `Alt+T` to open the upload panel
3. Enter your admin secret key (first time per session)
4. Select a file (image, GIF, or video)
5. Add a title and description
6. Click Upload

## No Login Required

Every visitor is automatically identified by a device UUID stored in localStorage. No accounts, no login screens — just open and use. Reactions (like/dislike) are saved per device.

## License

MIT
