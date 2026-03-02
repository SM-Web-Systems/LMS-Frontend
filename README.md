# Student-MS

A learning management system for SM Web Systems, featuring student submission management and admin review functionality.

## Features

### Student Portal
- 📊 Dashboard with submission statistics
- 📤 Upload assignments and written work
- 📋 Track submission status (Pending, Approved, Rejected)
- 💬 View feedback from administrators

### Admin Portal
- 👥 Student management (CRUD operations)
- 📝 Review and approve/reject submissions
- 📈 Analytics dashboard with statistics
- 💾 Department-wise student distribution

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see Backend Integration section)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Student-MS
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file in root directory
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Backend Integration

This frontend is designed to work with a RESTful API backend. See `BACKEND_SPECIFICATION.md` for the complete API specification.

### API Configuration

Set the API base URL in your `.env` file:

```env
# Development
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Production
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smwebsystems.com` | `admin123` |
| Student | `student@smwebsystems.com` | `student123` |

**Login requires the backend** to be running at `VITE_API_BASE_URL` (default `http://localhost:3001/api/v1`). Ensure the API is up and that these users exist in the backend; otherwise the app will show "Invalid email or password".

## Project Structure

```
Student-MS/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Layout.tsx
│   │   └── Modal.tsx
│   ├── context/          # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── DataContext.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── StudentSubmissions.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminStudents.tsx
│   │   └── AdminSubmissions.tsx
│   ├── services/         # API service layer
│   │   ├── api.ts            # Axios instance with interceptors
│   │   ├── authService.ts    # Authentication API calls
│   │   ├── studentsService.ts # Student CRUD operations
│   │   ├── submissionsService.ts # Submission operations
│   │   └── analyticsService.ts # Dashboard analytics
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts
│   │   └── api.ts
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── BACKEND_SPECIFICATION.md  # API specification for backend
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Services

The frontend uses a service layer for all API communications:

### Auth Service
```typescript
import { authService } from './services/authService';

// Login
const { token, user } = await authService.login(email, password);

// Logout
await authService.logout();

// Get current user
const user = await authService.getMe();
```

### Students Service
```typescript
import { studentsService } from './services/studentsService';

// Get all students
const { students, pagination } = await studentsService.getAll({ page: 1, limit: 20 });

// Create student
const student = await studentsService.create(studentData);

// Update student
const updated = await studentsService.update(id, updateData);

// Delete student
await studentsService.delete(id);
```

### Submissions Service
```typescript
import { submissionsService } from './services/submissionsService';

// Get all submissions
const { submissions, pagination } = await submissionsService.getAll({ status: 'pending' });

// Create submission (with file upload)
const submission = await submissionsService.create({ title, description, file });

// Review submission (admin)
const reviewed = await submissionsService.review(id, { status: 'approved', feedback });

// Download file
await submissionsService.download(id);
```

## Features in Detail

### Authentication
- JWT Bearer token authentication
- Automatic token refresh handling
- Role-based access control (Student/Admin)
- Protected routes with automatic redirection
- Persistent login state

### Student Management (Admin)
- Create new student records
- Update student information
- Delete students (cascades to submissions)
- Search and filter students
- View department distribution

### Submission Management
- Students can upload files with title and description
- Supported file types: PDF, DOC, DOCX, ZIP, TXT
- Max file size: 10MB
- Status tracking (Pending/Approved/Rejected)
- Admin review with feedback system
- File download functionality
- Filter submissions by status

### UI/UX Features
- Modern, clean interface with Tailwind CSS
- Responsive design for all screen sizes
- Loading states with spinners
- Error handling with user-friendly messages
- Interactive modals for forms
- Status badges with icons
- Real-time statistics and analytics
- Intuitive navigation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api/v1` |

## Error Handling

The frontend handles API errors gracefully:

- **401 Unauthorized**: Automatic logout and redirect to login
- **403 Forbidden**: Display permission error message
- **404 Not Found**: Display resource not found message
- **400 Bad Request**: Display validation errors
- **500 Server Error**: Display generic error message

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the LICENSE file for details.

## Support

For support and queries, contact SM Web Systems.
