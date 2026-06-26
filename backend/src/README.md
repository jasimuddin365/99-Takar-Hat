# `backend/src/`

Source layout:

| Path | Purpose |
|------|---------|
| `server.js` | Express app — middleware, route mounting, error handler |
| `lib/` | Shared helpers (prisma client, jwt, auth guards, validation) |
| `routes/` | One Express router per resource — auth, products, orders, … |

Routes are mounted in `server.js` module-by-module as they are built.
