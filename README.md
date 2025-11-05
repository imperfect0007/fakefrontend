# Frontend - DeBERTa Fake Review Detection

Next.js frontend for the DeBERTa fake review detection application.

## Structure

```
frontend/
├── pages/
│   ├── index.js        # Main prediction page
│   ├── dataset.js      # Dataset viewer page
│   └── api/
│       ├── predict.js   # API proxy to backend
│       └── dataset.js   # Dataset API proxy
├── styles/
│   ├── Home.module.css
│   └── Dataset.module.css
├── package.json
├── next.config.js
└── vercel.json         # Vercel deployment config
```

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

## Environment Variables

Create `.env.local`:
```
API_URL=http://localhost:8000
```

For production (Vercel), set `API_URL` in Vercel dashboard.

## Deployment to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Set environment variable: `API_URL` = your backend URL
4. Deploy!

## Build

```bash
npm run build
npm start
```


