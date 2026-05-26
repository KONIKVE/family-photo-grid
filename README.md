# family-photo-grid

An interactive, responsive web application designed to curate, organize, and beautifully display family memories. This project replaces traditional, static albums with a dynamic, digital masonry layout that brings family history to life.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables (optional)

By default the app uses `admin` / `family2024` as credentials. To override them, create a `.env.local` file in the project root:

```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
```

### 3. Add your media

Place your photos in the `images/` folder and videos in the `videos/` folder at the project root. The app serves them automatically.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:9003](http://localhost:9003) in your browser.

Log in with your credentials (default: `admin` / `family2024`).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack on port 9003 |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Deployment

### Vercel (recommended)

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables in the Vercel dashboard.
4. Deploy — Vercel detects Next.js automatically and configures the build.
