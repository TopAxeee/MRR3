# Marvel Rivals Reviews

A web application for reviewing Marvel Rivals game players.

## Features

- Player reviews and ratings
- Leaderboard rankings
- Telegram authentication
- Admin panel for managing reviews

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Telegram account for bot setup

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_TELEGRAM_BOT_NAME=YourTelegramBotName
   VITE_APP_DOMAIN=yourdomain.com
   ```

## Setting up Telegram Authentication

1. Create a Telegram bot using [@BotFather](https://t.me/BotFather)
2. Note down the bot token
3. Set the domain for your bot in BotFather settings
4. For local development, you can use ngrok to expose your localhost:
   - Install ngrok: https://ngrok.com/
   - Run: `ngrok http 5173`
   - Use the HTTPS URL as your domain

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to http://localhost:5173

## Building for Production

```bash
npm run build
```

## Backend Setup

The backend API should implement the `/api/auth/telegram` endpoint to handle Telegram authentication data validation and user management.

See [TELEGRAM_AUTH.md](src/TELEGRAM_AUTH.md) for detailed implementation instructions.

## Development Guide

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions and troubleshooting.

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for help with common issues like "Username invalid" errors.