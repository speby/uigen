# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Use comments sparingly. Only comment complex code.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Dev server with Turbopack at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all Vitest tests
npm test -- --run src/path/to/test.ts  # Run a single test file
npm run db:reset     # Reset SQLite database (destructive)
```

All Next.js commands require `NODE_OPTIONS='--require ./node-compat.cjs'` — this is already handled in the npm scripts.

## Environment

- Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, a `MockLanguageModel` is used that returns static components.
- The Prisma client is generated to `src/generated/prisma` (not the default location).
- SQLite database is at `prisma/dev.db`.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat; Claude generates code into a virtual (in-memory) file system; a live preview renders the result in an iframe.

### Data Flow

1. User sends a message via `ChatContext` → `POST /api/chat`
2. The API route reconstructs `VirtualFileSystem` from serialized state, calls `streamText` with two AI tools:
   - `str_replace_editor` — create/edit files (view, create, str_replace, insert commands)
   - `file_manager` — rename/delete files
3. Tool calls stream back to the client; `FileSystemContext.handleToolCall` applies them to the in-memory VFS
4. `PreviewFrame` watches `refreshTrigger`, compiles all VFS files with Babel (`@babel/standalone`), creates blob URLs, assembles an import map and HTML, and injects it into an iframe via `srcdoc`
5. On finish, if authenticated, the full message history and serialized VFS are saved to Prisma as JSON strings on the `Project` model

### Key Files

| Path | Purpose |
|------|---------|
| `src/lib/file-system.ts` | `VirtualFileSystem` class — in-memory tree, never writes to disk |
| `src/lib/transform/jsx-transformer.ts` | Babel JSX/TSX → blob URLs; builds import map; handles `@/` alias, CSS, third-party packages via `esm.sh` |
| `src/lib/contexts/file-system-context.tsx` | React context wrapping VFS; `handleToolCall` bridges AI tool calls to VFS mutations |
| `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat`; serializes VFS into each request body |
| `src/lib/provider.ts` | Returns `anthropic('claude-haiku-4-5')` or `MockLanguageModel` depending on API key |
| `src/lib/prompts/generation.tsx` | System prompt for component generation |
| `src/lib/auth.ts` | JWT session via `jose` + HTTP-only cookies (server-only) |
| `src/app/api/chat/route.ts` | Streaming AI endpoint |
| `src/components/preview/PreviewFrame.tsx` | iframe live preview |
| `src/components/editor/` | Monaco editor + file tree |
| `src/actions/` | Next.js server actions for project CRUD |
| `prisma/schema.prisma` | Database schema — reference this to understand stored data structures. `User` + `Project`; messages and VFS data stored as JSON strings |

### Virtual File System Conventions

- All paths are absolute starting with `/` (e.g., `/App.jsx`, `/components/Button.jsx`)
- The AI always creates `/App.jsx` as the entry point
- Local imports within generated code use the `@/` alias (maps to `/` in the VFS)
- Third-party imports are resolved via `https://esm.sh/`
- Preview looks for entry point in order: `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx`

### Auth

Custom JWT auth (no NextAuth). `src/lib/auth.ts` is `server-only`. Sessions are 7-day JWT tokens in HTTP-only cookies. Anonymous users can generate components but projects are only persisted for authenticated users.

### Testing

Vitest with jsdom and `@testing-library/react`. Tests are co-located in `__tests__/` directories next to source files.
