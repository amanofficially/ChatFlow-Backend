# ChatFlow — Backend

Express + Socket.IO + MongoDB API for the ChatFlow real-time chat app.

## Project structure

```
src/
  config/         Environment loading, DB connection, CORS policy
  constants/      Shared enums (message types/status, socket event names, limits)
  models/         Mongoose schemas (User, Message, Conversation)
  services/       Third-party integrations (Cloudinary)
  controllers/    Request handlers — one file per resource
  routes/         Thin Express routers that wire paths to controllers
  middleware/     Auth guard, rate limiters, central error handler
  socket/         Socket.IO setup, presence tracking, realtime broadcast helpers
  scripts/        One-off maintenance scripts
  app.js          Express app configuration (no listen())
  server.js       Process entry point — connects DB, starts HTTP + Socket.IO
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in your own values
npm run dev             # starts on http://localhost:5000
```

## Scripts

- `npm run dev` — start with nodemon (auto-restart)
- `npm start` — start for production
- `npm run cleanup:avatars` — one-off script to clear legacy base64 avatars from the DB

## API overview

All routes are mounted under `/api`:

| Route                              | Description                          |
|-------------------------------------|---------------------------------------|
| `POST /api/auth/signup`             | Create an account                     |
| `POST /api/auth/login`              | Log in                                |
| `GET  /api/auth/me`                 | Current authenticated user            |
| `PUT  /api/auth/profile`            | Update profile                        |
| `GET  /api/users/search?q=`         | Search users by username/email/mobile |
| `GET  /api/conversations`           | List the user's conversations         |
| `POST /api/conversations`           | Start (or reuse) a conversation       |
| `DELETE /api/conversations/:id`     | Remove a conversation for this user   |
| `PUT  /api/conversations/:id/read`  | Clear unread badge                    |
| `GET  /api/messages/:conversationId`| List messages in a conversation       |
| `POST /api/messages`                | Send a message                        |
| `PUT  /api/messages/:id/read`       | Mark messages as read                 |
| `DELETE /api/messages/:id`          | Delete a message                      |
| `POST /api/messages/:id/react`      | React to a message                    |
| `POST /api/upload/avatar`           | Upload a profile avatar               |
| `POST /api/upload/chat-media`       | Upload an image/file shared in chat   |

Real-time events (typing, delivery/read receipts, presence) are handled over
Socket.IO — see `src/socket/`.
