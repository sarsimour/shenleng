# Repository Guidelines

## Collaboration Defaults
- When user goals are vague, translate request into:
  - Problem statement
  - Assumptions (explicit)
  - 2-3 implementation options with tradeoffs
  - Recommended option
  - Concrete acceptance criteria
- After user confirms direction, implement directly, run checks, and report evidence.

## Product Context
- This repo is the public website frontend for Shenleng.
- It integrates with VerseCore backend via `src/app/api/proxy/[...path]/route.ts`.
- Chatbot behavior is backend-driven, frontend binds to configured chatbot id.

## Project Structure
- `src/app/(app)/`: website pages and business features.
- `src/components/features/chatbot/`: chatbot UI.
- `src/lib/chatbot-api.ts`: auth/session/chat streaming API client.
- `src/lib/knowledge-api.ts`: knowledge CRUD client.
- `src/app/(app)/knowledge-admin/page.tsx`: knowledge admin UI.
- `src/app/api/proxy/[...path]/route.ts`: backend proxy adapter.

## Required Env for Chatbot
- `VERSECORE_API_BASE_URL`
- `NEXT_PUBLIC_VERSECORE_APP_ID`
- `NEXT_PUBLIC_LOGISTICS_CHATBOT_ID`
- `NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME` (optional display)

## Build/Test Commands
- Install deps: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm exec eslint <paths>`
- Typecheck: `pnpm exec tsc --noEmit`

## Coding Rules
- Keep changes scoped and reversible.
- Do not add fallback bot selection logic that bypasses `NEXT_PUBLIC_LOGISTICS_CHATBOT_ID`.
- Keep mobile-first layout safe: no horizontal overflow on viewport widths <= 390px.
- Prefer API wrappers in `src/lib/*` instead of duplicating fetch logic in components.

## Validation Rules
- For chatbot changes, validate:
  - anonymous auth path works
  - chatbot session can start with configured id
  - chat window renders without horizontal scroll on mobile width
- For knowledge changes, validate:
  - list/add/update/delete API calls through proxy
  - org-scoped behavior remains intact

## Commit Rules
- Use Conventional Commits with scope when useful:
  - `feat(chat): ...`
  - `fix(ui): ...`
  - `docs(integration): ...`
- Include only related files in each commit.
