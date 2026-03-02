# LMS Roadmap – SM Web Systems

## Done

- **Google login** – Sign in with Google on the login page (when `VITE_GOOGLE_CLIENT_ID` is set). Backend: `POST /auth/google` (see `GOOGLE_AUTH_SERVER_IMPLEMENTATION.md`).
- **Quizzes** – Admin creates quizzes; students take them and see results. Completions in localStorage; "Pay to certify" is a placeholder until the backend adds payment.

## Possible next steps

- **Backend quiz API** – Persist quizzes and completions on the server; replace localStorage in `quizService`.
- **Payment** – Backend payment endpoint (crypto or other); frontend "Pay to certify" calls it and refreshes state.
- **Forum API** – Backend forum endpoints so discussions are shared (see `BACKEND_UPDATE_REQUIREMENTS.md`).
- **Course API** – Persist courses on the server (optional if localStorage is fine for now).

Details and API contracts: **`BACKEND_UPDATE_REQUIREMENTS.md`**.
