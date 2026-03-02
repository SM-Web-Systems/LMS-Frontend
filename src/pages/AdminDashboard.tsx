import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card';
import { Users, FileText, CheckCircle, Clock, XCircle, TrendingUp, Loader2, MessageCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    students, 
    submissions, 
    studentsLoading, 
    submissionsLoading, 
    fetchStudents, 
    fetchSubmissions 
  } = useData();

  useEffect(() => {
    fetchStudents();
    fetchSubmissions();
  }, [fetchStudents, fetchSubmissions]);

  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
  const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
    },
    {
      title: 'Total Submissions',
      value: submissions.length,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+8%',
    },
    {
      title: 'Pending Review',
      value: pendingSubmissions,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '-3%',
    },
    {
      title: 'Approved',
      value: approvedSubmissions,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+15%',
    },
  ];

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

  if (studentsLoading || submissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of the student management system</p>
      </div>

      {/* Quick link: Forum */}
      <Card className="mb-6 border-accent-teal/30 bg-primary-dark/5">
        <CardContent className="py-4">
          <button
            type="button"
            onClick={() => navigate('/admin/forum')}
            className="flex items-center gap-4 w-full text-left hover:opacity-90 transition-opacity"
          >
            <div className="p-3 rounded-lg bg-accent-teal/20">
              <MessageCircle className="h-6 w-6 text-accent-teal" />
            </div>
            <div>
              <p className="font-medium text-neutral-800">Class discussions</p>
              <p className="text-sm text-neutral-600">View and join forum questions and discussions → Forum</p>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                      <span className="text-xs text-gray-500 ml-2">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubmissions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No submissions yet</p>
              ) : (
                recentSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {submission.title}
                      </p>
                      <p className="text-sm text-gray-600">{submission.studentName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        submission.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : submission.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {submission.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.length > 0 ? (
                Array.from(new Set(students.map(s => s.department))).map(dept => {
                  const count = students.filter(s => s.department === dept).length;
                  const percentage = ((count / students.length) * 100).toFixed(1);
                  return (
                    <div key={dept}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{dept}</span>
                        <span className="text-sm text-gray-600">{count} students</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">No students enrolled yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Status Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Submission Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{pendingSubmissions}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{approvedSubmissions}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{rejectedSubmissions}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
