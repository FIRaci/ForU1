# Foru — Meme Gallery 🫶

A playful meme sharing platform with categorized folders, physics-based heart animations, and a warm pink aesthetic.

## Features

- 📁 **3 Categorized Folders** — Images, GIFs, Videos with file counts
- 🔐 **Admin Upload** — Press `Alt+T` to open upload panel (admin key required)
- 🤖 **Auto File Detection** — Automatically categorizes uploads as image/gif/video
- ❤️ **Like/Dislike** — Device-based anonymous reactions (persists per device)
- 💬 **Admin Comments** — Curator notes on each meme
- 🫶 **Heart Physics** — Click the heart button for a rain of draggable physics hearts
- 📱 **Responsive** — Works on desktop and mobile
- 📅 **Date Sorted** — Today's uploads pinned first

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL (Neon) |
| Storage | Cloudinary |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech) free tier)
- [Cloudinary](https://cloudinary.com) account (free tier)

### Backend Setup
```bash
cd server
cp .env.example .env
# Fill in your database URL, Cloudinary credentials, and admin secret
npm install
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

### Database Setup
Run the schema file against your PostgreSQL database:
```bash
psql $DATABASE_URL -f server/src/db/schema.sql
```

## Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ADMIN_SECRET` | Secret key for admin uploads |
| `CORS_ORIGIN` | Frontend URL (e.g., https://foru.vercel.app) |
| `PORT` | Server port (default: 3001) |

### Frontend (`client/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., https://foru-api.onrender.com) |

## Deployment

### Vercel (Frontend)
1. Connect your GitHub repo
2. Set root directory to `client`
3. Add `VITE_API_URL` environment variable
4. Deploy

### Render (Backend)
1. Create a new Web Service
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Add all backend environment variables

## Admin Usage

1. Open the website
2. Press `Alt+T` to open the upload panel
3. Enter your admin secret key (first time per session)
4. Select a file (image, GIF, or video)
5. Add a title and description
6. Click Upload

## License

MIT
