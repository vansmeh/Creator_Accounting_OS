# Creator Accounting OS

Minimal accounting workspace for creators to track deals, unpaid money, invoices, income, and reminder follow-ups.

## Stack

- `client/`: React + Vite + Tailwind
- `server/`: Node.js + Express + MongoDB + Mongoose

## Setup test

1. Copy `server/.env.example` to `server/.env`
2. Copy `client/.env.example` to `client/.env` if you want to override the API URL
3. Make sure MongoDB is running and `MONGODB_URI` points to it
4. From the project root, run `npm install`
5. Run `npm run install:all`
6. Run `npm run dev`

Frontend: `http://localhost:5173`

Backend: `http://localhost:5001`

## Core Features

- Dashboard with unpaid amount, this-month earnings, urgent collections, charts, and rule-based insights
- Deal list with clickable rows and detail page
- Add Deal modal and Add Income modal
- Invoice creation flow with `/invoice/:id` route
- Reminder modal with polite, firm, and final follow-up templates
- Income tracking for YouTube, Instagram, Affiliate, and Other
