import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card';
import { FileText, Upload, CheckCircle, XCircle, Clock, Loader2, MessageCircle } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submissions, submissionsLoading, submissionsError, fetchSubmissions } = useData();

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const stats = [
    {
      title: 'Total Submissions',
      value: submissions.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Review',
      value: pendingCount,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Approved',
      value: approvedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Rejected',
      value: rejectedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (submissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (submissionsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{submissionsError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Here's an overview of your submissions</p>
      </div>

      {/* Quick link: Forum */}
      <Card className="mb-6 border-accent-teal/30 bg-primary-dark/5">
        <CardContent className="py-4">
          <button
            type="button"
            onClick={() => navigate('/student/forum')}
            className="flex items-center gap-4 w-full text-left hover:opacity-90 transition-opacity"
          >
            <div className="p-3 rounded-lg bg-accent-teal/20">
              <MessageCircle className="h-6 w-6 text-accent-teal" />
            </div>
            <div>
              <p className="font-medium text-neutral-800">Class discussions</p>
              <p className="text-sm text-neutral-600">Ask questions and discuss with the class → Forum</p>
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
              <CardContent className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor} mr-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No submissions yet</p>
              <p className="text-sm text-gray-500">Upload your first assignment to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.slice(0, 5).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{submission.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span>{submission.fileName}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        submission.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : submission.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {submission.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {submission.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {submission.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
