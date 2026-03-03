import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogOut, Users, FileText, LayoutDashboard, BookOpen, MessageCircle, ClipboardList, Mail, User, UserCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navigation = user?.role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Students', path: '/admin/students', icon: Users },
        { name: 'Submissions', path: '/admin/submissions', icon: FileText },
        { name: 'Course', path: '/admin/course', icon: BookOpen },
        { name: 'Quizzes', path: '/admin/quizzes', icon: ClipboardList },
        { name: 'Resources', path: '/admin/documents', icon: BookOpen },
        { name: 'Forum', path: '/admin/forum', icon: MessageCircle },
        { name: 'Messages', path: '/admin/messages', icon: Mail },
        { name: 'Course members', path: '/admin/course-members', icon: UserCircle },
        { name: 'Profile', path: '/admin/profile', icon: User },
      ]
    : [
        { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
        { name: 'My Submissions', path: '/student/submissions', icon: FileText },
        { name: 'Course', path: '/student/course', icon: BookOpen },
        { name: 'Quizzes', path: '/student/quizzes', icon: ClipboardList },
        { name: 'Resources', path: '/student/documents', icon: BookOpen },
        { name: 'Forum', path: '/student/forum', icon: MessageCircle },
        { name: 'Messages', path: '/student/messages', icon: Mail },
        { name: 'Course members', path: '/student/course-members', icon: UserCircle },
        { name: 'Profile', path: '/student/profile', icon: User },
      ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header — SM Web Systems style: clean nav, primary-dark accent */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SM Web Systems" className="h-9 w-9" />
              <div>
                <h1 className="text-xl font-bold text-primary-dark leading-tight">SM Web Systems</h1>
                <span className="text-xs text-neutral-500 hidden sm:block">Learning Management System</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-800">{user?.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-teal hover:bg-accent-teal-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-teal"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-x-6 gap-y-1 py-2 sm:gap-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`inline-flex items-center px-1 pt-1 pb-2 sm:pb-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(item.path)
                      ? 'border-accent-teal text-primary-dark'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2 shrink-0" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

