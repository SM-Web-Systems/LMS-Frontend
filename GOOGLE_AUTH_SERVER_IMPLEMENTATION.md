# Implement POST /auth/google on the Server

Use this in your **SM-Web-Systems-LMS-Server** repo so the frontend’s “Sign in with Google” works. The frontend sends the Google ID token; the server verifies it, finds or creates a user, and returns the same JWT + user shape as email login.

---

## 1. Install dependency

In the server repo:

```bash
npm install google-auth-library
```

---

## 2. Add the route

Wire `POST /auth/google` the same way as `POST /auth/login` (e.g. in `src/routes/authRoutes.ts` or wherever auth routes live):

```ts
// Example: in authRoutes.ts add
router.post('/google', authController.googleLogin);
```

So the full path is `POST /api/v1/auth/google` (with your API prefix).

---

## 3. Controller: verify token and return JWT + user

In `src/controllers/authController.ts` (or equivalent), add a handler that:

1. Reads `id_token` from the request body.
2. Verifies it with the Google Auth Library.
3. Gets email and name from the payload.
4. Finds or creates a user (e.g. in your `users` table) by email.
5. Signs your LMS JWT (same as login) and returns `{ success: true, data: { token, user } }`.

**Example implementation** (Node/Express + SQLite-style DB; adjust to your DB API):

```ts
import { OAuth2Client } from 'google-auth-library';
import db from '../config/database';   // your DB
import jwt from 'jsonwebtoken';        // or whatever you use for JWT

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req: Request, res: Response) {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'id_token is required' },
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid Google token' },
      });
    }

    const email = payload.email;
    const name = payload.name || payload.email.split('@')[0];

    // Find existing user by email, or create one (default role 'student')
    // Use your existing DB API (e.g. better-sqlite3: db.prepare('SELECT...').get(email))
    let user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);
    if (!user) {
      const id = generateId(); // use the same ID generator as in your login/register
      db.prepare(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
      ).run(id, name, email, '', 'student'); // password_hash empty = Google-only user
      user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: 'Could not find or create user' },
      });
    }

    // Sign your LMS JWT (same as in your existing login)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(401).json({
      success: false,
      error: { code: 'GOOGLE_LOGIN_FAILED', message: 'Google sign-in failed' },
    });
  }
}
```

---

## 4. Environment variable

In the server’s `.env`, set the **same** Google Client ID you use in the frontend (so token audience matches):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 5. Database

- Your `users` table (from `database/schema.sql`) has `id`, `name`, `email`, `password_hash`, `role`. For Google-only users, set `password_hash` to `''` so they can’t use email/password login.
- Use the same ID format and JWT signing as your existing `login` in `authController.ts`.

---

## 6. Response shape (reminder)

The frontend expects exactly:

**Success (200):**
```json
{
  "success": true,
  "data": {
    "token": "<your LMS JWT>",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "student" | "admin"
    }
  }
}
```

Any 4xx/5xx should use your standard error format, e.g. `{ "success": false, "error": { "code", "message" } }`.

---

After implementing:

1. Add `POST /auth/google` to your auth routes.
2. Set `GOOGLE_CLIENT_ID` in the server `.env`.
3. Restart the server and try “Sign in with Google” again from the frontend.
