# Tech Context

## Technologies Used
- Convex (backend, data)
- Node.js (automation scripts)
- JavaScript/TypeScript
- dotenv (env management)
- ESLint, Prettier (code quality)

## Development Setup
- Node.js >= 18.x
- Convex CLI
- Environment variables via .env
- Scripts run via `npx convex run` or `node`

## Technical Constraints
- Scripts must be idempotent and safe for repeated runs
- Data exports/imports use JSON
- Deployment must support multiple environments

## Dependencies
- See package.json for full list 