# Backend Update Requirements for SM Web Systems LMS

This document is for the **backend team**. It describes what the frontend expects from the API so the backend can be updated accordingly. Use it together with `BACKEND_SPECIFICATION.md` for the full API spec.

---

## Table of Contents

1. [Existing APIs (reference)](#existing-apis-reference)
2. [Standard response format](#standard-response-format)
3. [Document download (PDF viewer)](#document-download-pdf-viewer)
4. [Forum API (new)](#forum-api-new)
5. [Course API (new)](#course-api-new)
6. [Messages API (new)](#messages-api-new)
7. [Profile API (new)](#profile-api-new)
8. [Course members & user directory (new)](#course-members--user-directory-new)
9. [Frontend review summary](#frontend-review-summary)
10. [Planned / future features](#planned--future-features)

---

## Existing APIs (reference)

The frontend already uses these; full details are in **`BACKEND_SPECIFICATION.md`**:

| Area | Base path | Notes |
|------|-----------|--------|
| **Auth** | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/google` | JWT Bearer; login returns `{ token, user }`. Google: see [Google OAuth](#google-oauth-login-api). |
| **Students** | `GET/POST /students`, `GET/PUT/DELETE /students/:id` | Admin only. |
| **Submissions** | `GET/POST /submissions`, `GET/DELETE /submissions/:id`, `PUT /submissions/:id/review` | Students see own; admin sees all and reviews. |
| **Documents** | `GET/POST /documents`, `GET/PUT/DELETE /documents/:id`, `GET /documents/categories` | Plus **document download** below. |
| **Analytics** | `GET /analytics/dashboard` | Admin only. |

**Base URL:** The frontend uses `VITE_API_BASE_URL` (default `http://localhost:3001/api/v1`). All requests (except login) send:

```
Authorization: Bearer <jwt_token>
```

On **401**, the frontend clears token/user and redirects to `/login`.

---

## Standard response format

Every API response must follow this shape so the frontend can handle it consistently.

**Success (200/201):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      { "field": "fieldName", "message": "Validation message" }
    ]
  }
}
```

- The frontend uses `response.data.success` to decide success vs error.
- On error it uses `response.data.error?.message` (and throws `new Error(...)`).
- Optional: `error.details` for validation errors.

---

## Google OAuth login (API)

The frontend supports **Sign in with Google** via `@react-oauth/google`. It sends the Google ID token to the backend; the backend verifies it and returns the same JWT + user shape as email login.

- **Endpoint:** `POST /auth/google`
- **Auth:** None (public).
- **Request body:**
```json
{
  "id_token": "<Google JWT ID token from the OAuth credential>"
}
```
- **Success (200):** Same as `POST /auth/login`:
```json
{
  "success": true,
  "data": {
    "token": "<JWT for this LMS>",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "student" | "admin"
    }
  }
}
```
- **Error (4xx/5xx):** Standard `{ "success": false, "error": { "code", "message" } }`.

Backend should: verify `id_token` with Google (e.g. using Google Auth Library), decode email/name, then find or create user by email and return LMS JWT + user. Optionally link to existing user by email or create new user on first Google login.

---

## Document download (PDF viewer)

The frontend needs to **view PDFs in the browser** (scroll to view) and to **download** documents.

- **Endpoint:** `GET /documents/:id/download`
- **Auth:** `Authorization: Bearer <token>` must be supported.
- **Response:** 
  - Status: **200**
  - Body: **raw file bytes** (e.g. PDF).
  - Headers: 
    - `Content-Type`: actual file MIME type (e.g. `application/pdf`).
    - Optional: `Content-Disposition: attachment; filename="..."` for downloads (frontend also infers filename from this for the download flow).

The frontend calls this URL with `fetch()` and the Bearer token. It does **not** use query params for the token. So the backend must accept the token only in the `Authorization` header.

---

## Forum API (new)

The LMS includes a **forum** for questions and class discussions. The frontend currently uses **localStorage** for forum data. Once the backend implements the Forum API below, the frontend can be switched to use it so that all users see the same discussions.

### Data models

**ForumAuthor** (embedded in topic and post):
```ts
{
  id: string;       // user id
  name: string;
  email: string;
  role: "student" | "admin";
}
```

**ForumTopic** (list + single):
```ts
{
  id: string;
  title: string;
  body: string;
  author: ForumAuthor;
  createdAt: string;   // ISO 8601
  updatedAt?: string; // ISO 8601
  postCount: number;  // number of replies (for list view)
  lastPostAt?: string; // ISO 8601, latest reply time (for sorting)
}
```

**ForumPost** (reply):
```ts
{
  id: string;
  topicId: string;
  body: string;
  author: ForumAuthor;
  createdAt: string;
  updatedAt?: string;
}
```

### Endpoints

Base path suggestion: **`/forum`** (under the same API base, e.g. `http://localhost:3001/api/v1/forum`).

All forum endpoints require **authentication** (student or admin). No role restriction: both can create topics and reply.

---

#### GET /forum/topics

Returns all topics, sorted by **last activity** (most recent first). Each topic must include `postCount` and `lastPostAt` so the frontend can show reply count and “last active” in the list.

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "topic-uuid",
        "title": "How does SCP work?",
        "body": "I’m confused about quorums...",
        "author": {
          "id": "user-1",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "role": "student"
        },
        "createdAt": "2025-02-11T12:00:00.000Z",
        "updatedAt": "2025-02-11T12:00:00.000Z",
        "postCount": 3,
        "lastPostAt": "2025-02-11T14:30:00.000Z"
      }
    ]
  }
}
```

---

#### GET /forum/topics/:id

Returns a single topic by id. Same shape as one element in the list above (include `postCount` and `lastPostAt`).

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "topic-uuid",
    "title": "How does SCP work?",
    "body": "I’m confused about quorums...",
    "author": { "id": "...", "name": "...", "email": "...", "role": "student" },
    "createdAt": "2025-02-11T12:00:00.000Z",
    "updatedAt": "2025-02-11T12:00:00.000Z",
    "postCount": 3,
    "lastPostAt": "2025-02-11T14:30:00.000Z"
  }
}
```

**Error (404):** `success: false`, `error: { code: "NOT_FOUND", message: "Topic not found" }`

---

#### GET /forum/topics/:topicId/posts

Returns all replies for a topic, in **chronological order** (oldest first).

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post-uuid",
        "topicId": "topic-uuid",
        "body": "Quorums are...",
        "author": { "id": "...", "name": "...", "email": "...", "role": "admin" },
        "createdAt": "2025-02-11T13:00:00.000Z",
        "updatedAt": "2025-02-11T13:00:00.000Z"
      }
    ]
  }
}
```

**Error (404):** If topic does not exist: `success: false`, `error: { message: "Topic not found" }`

---

#### POST /forum/topics

Create a new topic. Author is the authenticated user.

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{
  "title": "Topic title",
  "body": "Topic body / first post content."
}
```

**Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "topic-uuid",
    "title": "Topic title",
    "body": "Topic body / first post content.",
    "author": { "id": "...", "name": "...", "email": "...", "role": "student" },
    "createdAt": "2025-02-11T12:00:00.000Z",
    "updatedAt": "2025-02-11T12:00:00.000Z",
    "postCount": 0,
    "lastPostAt": null
  }
}
```

**Validation (400):** e.g. `title` or `body` missing/invalid → `success: false`, `error: { code: "VALIDATION_ERROR", message: "...", details: [...] }`

---

#### POST /forum/topics/:topicId/posts

Add a reply to a topic. Author is the authenticated user.

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request body:**
```json
{
  "body": "Reply text."
}
```

**Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "topicId": "topic-uuid",
    "body": "Reply text.",
    "author": { "id": "...", "name": "...", "email": "...", "role": "admin" },
    "createdAt": "2025-02-11T14:30:00.000Z",
    "updatedAt": "2025-02-11T14:30:00.000Z"
  }
}
```

**Error (404):** Topic not found → `success: false`, `error: { message: "Topic not found" }`

---

### Forum summary

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/forum/topics` | List topics (with postCount, lastPostAt), sorted by last activity |
| GET | `/forum/topics/:id` | Get one topic |
| GET | `/forum/topics/:topicId/posts` | List posts for a topic (chronological) |
| POST | `/forum/topics` | Create topic (body: title, body) |
| POST | `/forum/topics/:topicId/posts` | Create reply (body: body) |

All require **Authorization: Bearer &lt;token&gt;** and use the **standard response format** above.

---

## Course API (new)

The LMS has an **admin Course** tab where admins create and edit courses in the same format students see: course title/description, sections (with objective/outcome), and items (video, link, or PDF). The frontend currently uses **localStorage** for courses. Once the backend implements the Course API below, the frontend can be switched to use it.

### Data models

**CourseItem** (one of three shapes):

- **Video:** `{ id, type: "video", title, order?, url }` — `url` is typically a YouTube embed URL.
- **Link:** `{ id, type: "link", title, order?, url }`
- **PDF:** `{ id, type: "pdf", title, order?, documentId?, fileUrl? }` — `documentId` = LMS document ID (use existing document download); `fileUrl` = direct PDF URL.

**CourseSection:**
```ts
{
  id: string;
  title: string;
  objective?: string;
  outcome?: string;
  items: CourseItem[];
}
```

**Course:**
```ts
{
  id: string;
  title: string;
  description?: string;
  sections: CourseSection[];
}
```

### Endpoints

Base path suggestion: **`/courses`** (e.g. `http://localhost:3001/api/v1/courses`).

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| GET | `/courses` | Bearer | List all courses (students + admin). |
| GET | `/courses/:id` | Bearer | Get one course by id. |
| POST | `/courses` | Bearer (admin) | Create course. Body: full `Course` (id optional; server can generate). |
| PUT | `/courses/:id` | Bearer (admin) | Update course. Body: full `Course` or partial. |
| DELETE | `/courses/:id` | Bearer (admin) | Delete course. |

**GET /courses**

**Success (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-1",
        "title": "Blockchain Basics (Week 1)",
        "description": "Prerequisite module...",
        "sections": [
          {
            "id": "sec-1",
            "title": "Day 1 - Introduction",
            "objective": "Build a strong mental model...",
            "outcome": "You should understand blocks...",
            "items": [
              { "id": "item-1", "type": "video", "title": "Part 1", "order": 1, "url": "https://www.youtube.com/embed/..." },
              { "id": "item-2", "type": "link", "title": "Slides", "order": 2, "url": "https://..." }
            ]
          }
        ]
      }
    ]
  }
}
```

**GET /courses/:id** — Same shape as one element in the `courses` array above.

**POST /courses** — Body: `Course` (id optional). **Success (201):** `{ "success": true, "data": <created Course> }`.

**PUT /courses/:id** — Body: `Course` or partial. **Success (200):** `{ "success": true, "data": <updated Course> }`.

**DELETE /courses/:id** — **Success (200):** `{ "success": true }`. **404** if not found.

The frontend expects the exact **Course** / **CourseSection** / **CourseItem** shapes above so the student Course view can render sections, videos (click to play), links (open in new tab), and PDFs (scroll to view; PDFs use existing `GET /documents/:id/download` when `documentId` is set).

---

## Messages API (new)

The LMS includes **1:1 messaging** between users (e.g. student ↔ admin). The frontend currently uses **localStorage** for conversations and messages. Once the backend implements the Messages API below, the frontend can be switched to use it so that messages persist and sync across devices.

### Data models

**Conversation** (one thread between two participants):

```ts
{
  id: string;
  participantIds: [string, string];   // two user IDs (sorted for consistency)
  participantNames: [string, string]; // display names in same order as participantIds
  updatedAt: string;                  // ISO 8601, last message time
}
```

**Message**:

```ts
{
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;   // ISO 8601
}
```

### Behaviour

- **Participants:** Students can message “Admin” (backend may use a placeholder like `__admin__` for the admin side, or a real admin user id). Admins can message any student (by user id or student id; frontend uses `studentsService` to list students and uses `student.userId || student.id` as the other participant).
- **Auth:** Caller must be authenticated. A user may only list conversations they are part of, and only send messages in those conversations.
- **Ordering:** Conversations list sorted by `updatedAt` descending. Messages in a thread sorted by `createdAt` ascending.

### Endpoints

Base path suggestion: **`/messages`** (e.g. `http://localhost:3001/api/v1/messages`). All require **Bearer** auth.

| Method | Path | Description |
|--------|------|--------------|
| GET | `/messages/conversations` | List conversations for the current user. |
| POST | `/messages/conversations` | Get or create a conversation between current user and another user. |
| GET | `/messages/conversations/:id` | Get one conversation (if participant). |
| GET | `/messages/conversations/:id/messages` | List messages in a conversation (if participant). |
| POST | `/messages/conversations/:id/messages` | Send a message in a conversation (if participant). |

---

#### GET /messages/conversations

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv-1",
        "participantIds": ["user-1", "user-2"],
        "participantNames": ["Alice", "Admin"],
        "updatedAt": "2025-02-11T14:30:00.000Z"
      }
    ]
  }
}
```

Return only conversations where the current user is one of `participantIds`. For “student ↔ Admin” threads, the backend may store one participant as a placeholder (e.g. `__admin__`) and resolve it for admin users so they see the same conversation.

---

#### POST /messages/conversations

Get existing or create a new conversation between the current user and another user.

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "otherUserId": "user-2",
  "otherUserName": "Admin"
}
```

**Success (200 or 201):**
```json
{
  "success": true,
  "data": {
    "id": "conv-1",
    "participantIds": ["user-1", "user-2"],
    "participantNames": ["Alice", "Admin"],
    "updatedAt": "2025-02-11T14:30:00.000Z"
  }
}
```

If a conversation already exists for this pair of users, return it; otherwise create it and return. `participantIds` should be in a stable order (e.g. sorted) so the same conversation is always returned for the same pair.

---

#### GET /messages/conversations/:id

**Headers:** `Authorization: Bearer <token>`

**Success (200):** Same shape as one element in the `conversations` array above. **404** if not found or caller is not a participant.

---

#### GET /messages/conversations/:id/messages

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-1",
        "conversationId": "conv-1",
        "senderId": "user-1",
        "body": "Hello, I have a question.",
        "createdAt": "2025-02-11T14:00:00.000Z"
      }
    ]
  }
}
```

Return messages in ascending order by `createdAt`. **404** if conversation not found or caller is not a participant.

---

#### POST /messages/conversations/:id/messages

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "body": "Hello, I have a question."
}
```

**Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "msg-1",
    "conversationId": "conv-1",
    "senderId": "user-1",
    "body": "Hello, I have a question.",
    "createdAt": "2025-02-11T14:00:00.000Z"
  }
}
```

Backend should set `senderId` from the JWT (ignore if sent in body). Update the conversation’s `updatedAt` to the new message’s `createdAt`. **404** if conversation not found or caller is not a participant.

---

### Frontend integration

The frontend message service (`src/services/messageService.ts`) and types (`src/types/message.ts`) currently use localStorage. To use the backend:

1. Add async methods that call the endpoints above (e.g. `getConversations()`, `getOrCreateConversation(otherUserId, otherUserName)`, `getMessages(conversationId)`, `sendMessage(conversationId, body)`).
2. Use the same request/response shapes as in this section.
3. Keep or remove the localStorage fallback as needed.

---

## Profile API (new)

The LMS has a **Profile** page where users can edit their display name and a short description/bio, and see completed quizzes (and later course completions). The frontend currently uses **localStorage** for profile fields. Once the backend implements the Profile API below, the frontend can persist name and description on the server.

### Data model

**User profile** (extended fields for the authenticated user):

```ts
{
  name: string;        // display name (same as User.name; may be editable)
  description?: string; // optional bio / about text
}
```

The frontend also shows **completed quizzes** (and in future, course completions). Quiz completions can come from the existing or planned quiz/completion API; the profile API below is only for **name** and **description**.

### Endpoints

Base path suggestion: **`/profile`** or **`/users/me`** (e.g. `http://localhost:3001/api/v1/profile`). All require **Bearer** auth. The authenticated user is the profile owner.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Get current user’s profile (name, description). |
| PATCH | `/profile` | Update current user’s profile (name and/or description). |

---

#### GET /profile

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "name": "Jane Doe",
    "description": "Learning blockchain and smart contracts."
  }
}
```

Return the display name and description for the user identified by the JWT. If the backend already has a **User** with `name`, that can be the default; `description` can be a new column or table keyed by user id.

---

#### PATCH /profile

**Headers:** `Authorization: Bearer <token>`

**Request body:** (all fields optional)
```json
{
  "name": "Jane Doe",
  "description": "Learning blockchain and smart contracts."
}
```

**Success (200):**
```json
{
  "success": true,
  "data": {
    "name": "Jane Doe",
    "description": "Learning blockchain and smart contracts."
  }
}
```

- Update only the fields sent; leave others unchanged.
- **name** should update the user’s display name (e.g. `users.name`) so it is consistent everywhere (e.g. `GET /auth/me`, forum, messages).
- **404** if the user does not exist; **401** if not authenticated.

---

### Frontend integration

The frontend profile service (`src/services/profileService.ts`) and Profile page currently use localStorage for `displayName` and `description`, and the auth user for the displayed name. To use the backend:

1. On load: optionally call `GET /profile` and merge with auth user (e.g. override name/description from profile).
2. On save: call `PATCH /profile` with `{ name, description }` and then update local auth user and profile state.
3. Use the same request/response shapes as above.

---

## Course members & user directory (new)

The frontend supports **course-based messaging** and **discoverable profiles**: users can message anyone in their course(s) and view each other’s profiles. To do that, the frontend needs to know **who is in which course** and **minimal user info** (id, name, role) for display. Currently this is stored in **localStorage** (enrollment + user directory). Once the backend implements the APIs below, the frontend can use them so course members and messaging work across devices and browsers.

### Purpose

- **Course members:** “Course members” page and “People in your course(s)” in Messages both need: (1) the list of courses the current user is in, and (2) per course, the list of members with id and name.
- **User directory:** For messaging and profile views, the frontend needs to resolve user id → name (and optionally email, role). This can be satisfied by returning user objects in course-members responses and/or a small “users” or “course members” list endpoint.

### Data model

**Course enrollment:** A relation between courses and users (many-to-many). Stored e.g. as `course_enrollments (course_id, user_id)` or a `courses` table with a JSON array of member ids, etc.

**User (minimal, for directory):**
```ts
{
  id: string;
  name: string;
  email?: string;
  role: "student" | "admin";
}
```

### Endpoints

All require **Bearer** auth. Use the same API base (e.g. `http://localhost:3001/api/v1`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/courses/:id/members` | List members of a course (ids + names, or full minimal user objects). |
| GET | `/users/me/courses` or `/my-courses` | List course ids (or course summaries) the current user is enrolled in. |
| POST | `/courses/:id/members` | Add a user to a course (body: `{ userId: string }`). Admin only (or course owner). |
| DELETE | `/courses/:id/members/:userId` | Remove a user from a course. Admin only (or course owner). |
| GET | `/users` (optional) | List users (minimal: id, name, email?, role) for directory. Optional if course members always include full user info. |

---

#### GET /courses/:id/members

**Headers:** `Authorization: Bearer <token>`

Caller must be allowed to see that course (e.g. enrolled or admin).

**Success (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      { "id": "user-1", "name": "Jane Doe", "email": "jane@example.com", "role": "student" },
      { "id": "user-2", "name": "Admin", "email": "admin@example.com", "role": "admin" }
    ]
  }
}
```

Return all users enrolled in that course. Frontend uses this for the “Course members” page and to populate the user directory (id → name) for messaging and profile links.

---

#### GET /users/me/courses (or GET /my-courses)

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "courseIds": ["course-1", "course-2"]
  }
}
```

Or return full course summaries if you prefer; the frontend only needs to know which courses the current user is in so it can call `GET /courses/:id/members` for each and build “people in my course(s)”.

---

#### POST /courses/:id/members

**Headers:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "userId": "user-2"
}
```

**Success (200 or 201):** e.g. `{ "success": true }` or return the updated members list. **403** if caller is not allowed to manage the course. **404** if course or user not found.

---

#### DELETE /courses/:id/members/:userId

**Headers:** `Authorization: Bearer <token>`

**Success (200):** e.g. `{ "success": true }`. **403** if not allowed. **404** if course or user or enrollment not found.

---

#### GET /users (optional)

If the frontend needs a single “directory” of users (e.g. for admins to see everyone, or to resolve names for profile views), provide a minimal list:

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      { "id": "user-1", "name": "Jane Doe", "email": "jane@example.com", "role": "student" }
    ]
  }
}
```

Restrict by role or scope as needed (e.g. only users in the same org/courses as the caller).

---

### Frontend integration

- **Enrollment:** The frontend currently uses `enrollmentService` (localStorage): `getMembers(courseId)`, `getMyCourses(userId)`, `addMember`, `removeMember`, `getPeersInMyCourses(userId, isAdmin)`.
- **User directory:** The frontend uses `userDirectoryService` (localStorage): `get(userId)`, `getAll()`, `add(user)`.
- To switch to the backend: (1) Replace enrollment reads with `GET /users/me/courses` and `GET /courses/:id/members`; (2) Replace directory lookups with members lists and/or `GET /users`; (3) On “Manage members” add/remove, call `POST` and `DELETE` above. Keep the same response shapes so the existing UI keeps working.

---

## Frontend review summary

This section summarizes how the frontend is wired so the backend can align with it.

### Configuration

- **Base URL:** `VITE_API_BASE_URL` (default `http://localhost:3001/api/v1`). No trailing slash.
- **Auth:** Every request (except login) sends `Authorization: Bearer <token>`. Token is stored in `localStorage` after login.
- **401:** Frontend clears token and user and redirects to `/login`.

### Response handling

- All services expect the **standard response format** (`success`, `data`, `error`).
- They use `response.data.success` and `response.data.data`; on failure they use `response.data.error?.message` and throw `Error(...)`.
- Documents **download** and **in-browser PDF view** both use `GET /documents/:id/download` with the same Bearer header (no token in query).

### Feature status

| Feature | Frontend status | Backend dependency |
|--------|------------------|---------------------|
| Auth (login, logout, me) | Implemented | Must implement per BACKEND_SPECIFICATION.md |
| Students CRUD | Implemented | Admin API |
| Submissions + review | Implemented | Students + admin API |
| Course documents CRUD + categories | Implemented | Documents API |
| Document download / PDF view | Implemented | GET /documents/:id/download with Bearer |
| Course content (videos, links, PDFs) | Implemented | Admin creates courses (localStorage); students view. Optional: implement Course API to persist on server. |
| Forum | Implemented (localStorage) | Optional: implement Forum API above to switch to shared data |
| Messages (1:1) | Implemented (localStorage) | Optional: implement Messages API above to persist and sync messages |
| Profile (name, description) | Implemented (localStorage + auth name) | Optional: implement Profile API above to persist on server |
| Course members & messaging peers | Implemented (localStorage) | Optional: implement Course members & user directory API above so enrollments and directory work across devices |

### After backend implements Forum API

The frontend forum service (`src/services/forumService.ts`) currently uses localStorage. To use the backend instead:

1. Add async methods that call the endpoints above (e.g. `getTopics()`, `getTopic(id)`, `getPosts(topicId)`, `createTopic(data)`, `createPost(topicId, data)`).
2. Use the same request/response shapes as in this document.
3. Keep or remove the localStorage fallback depending on product needs.

If the backend follows this document and `BACKEND_SPECIFICATION.md`, the frontend will work with it without further changes to the response contract.

### Frontend checklist (verified)

- All services use the shared `api` axios instance; base URL and Bearer token are applied consistently.
- 401 from any endpoint triggers redirect to `/login` and clears stored auth.
- Auth, students, submissions, documents, and analytics use the standard `{ success, data, error }` shape.
- Document download uses `GET /documents/:id/download` with `Authorization: Bearer <token>` only (no query param).
- Forum currently uses localStorage; switching to the Forum API above will not require response-format changes.
- Course content (videos, links, PDFs) uses `courseService` (localStorage); admin can create/edit courses in the same format as the student view. Optional: implement Course API so courses persist on the server.
- Messages use `messageService` (localStorage); students can message “Admin”, admins can message students. Optional: implement Messages API above to persist and sync.
- Profile page uses `profileService` (localStorage) for description and optional display name; auth user holds name. Optional: implement Profile API above (GET/PATCH /profile) to persist name and description on the server.
- Course members and “people in my course(s)” for messaging use `enrollmentService` and `userDirectoryService` (localStorage). Optional: implement Course members & user directory API above so enrollments work across devices and browsers.

---

## Planned / future features

Google login and Quizzes (with payment placeholder) are **implemented in the frontend**; backend can add the APIs below when ready. Documenting them here so the backend can plan and the frontend can integrate when ready.

### 1. Google (OAuth) login

- **Goal:** Allow users to sign in with Google in addition to (or instead of) email/password.
- **Backend:** 
  - Support OAuth 2.0 flow (e.g. Google OAuth). Frontend will redirect to Google, then callback with auth code or token; backend exchanges for user info and creates/returns a **JWT** in the same shape as current `POST /auth/login` (`{ success, data: { token, user } }`).
  - Optionally: link Google account to existing user by email, or create new user on first Google login.
- **Frontend:** 
  - Add “Sign in with Google” on the login page. When backend is ready: redirect to backend OAuth URL or Google, then handle callback and store `token` + `user` the same way as email login so the rest of the app stays unchanged.
- **Notes:** Keep existing email/password login; Google is an additional option unless product decides to replace it.

### 2. Quizzes (forms) and payment (crypto or other)

- **Goal:** 
  - **Quizzes:** Forms for quizzes (e.g. per course or per section). On completion, record result and optionally gate access or issue credentials.
  - **Payment:** Quiz completion (or course access) can update the database and trigger or record payment—crypto or any other payment provider.
- **Backend (to plan):**
  - **Quizzes:** Endpoints such as: list quizzes (e.g. by course/section), get quiz (questions, type, options), submit quiz (answers), get result/completion. Store completion in DB (e.g. `quiz_completions`: user, quiz, score, completedAt). Optionally: webhook or internal API for “payment required” or “payment completed” to unlock content or update completion.
  - **Payment:** 
    - If **crypto:** Integrate with a chosen provider (e.g. Stellar, wallet connect, or a payment API). On “pay” action: create payment intent or address, confirm payment on-chain or via provider, then callback/update DB (e.g. mark course/quiz as paid, or update a `payments` table). Quiz completion flow can then check payment status before writing completion or before allowing next step.
    - If **other:** Same idea with Stripe, PayPal, etc.: create session/intent, confirm payment, update DB.
  - **Linking:** Quiz completion and payment can share a common “enrollment” or “purchase” record so the frontend can show “Completed” or “Paid” and the backend can enforce access.
- **Frontend (when ready):**
  - Quiz UI: form per quiz (questions, submit). On submit, call backend to save answers and get result; show success/failure and optionally “Certificate” or “Next step.”
  - Payment UI: after quiz completion (or before access), show “Pay to unlock” or “Pay with crypto”; redirect or embed provider flow; on success, backend updates DB and frontend refreshes state (e.g. show unlocked content or completion).
- **Notes:** Exact flows (quiz → payment vs payment → quiz, which crypto provider, etc.) can be decided when implementing; this section is a placeholder so backend and frontend stay aligned.
