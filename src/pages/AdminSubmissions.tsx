import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card';
import Button from '../components/Button';
import { TextArea } from '../components/Input';
import Modal from '../components/Modal';
import { FileText, CheckCircle, XCircle, Clock, Eye, Download, Loader2 } from 'lucide-react';
import { Submission, SubmissionStatus } from '../types/api';

const AdminSubmissions: React.FC = () => {
  const { user } = useAuth();
  const { 
    submissions, 
    submissionsLoading, 
    submissionsError,
    fetchSubmissions, 
    reviewSubmission, 
    deleteSubmission,
    downloadSubmission 
  } = useData();
  
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SubmissionStatus>('all');
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filteredSubmissions = filterStatus === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filterStatus);

  const handleReview = (submission: Submission) => {
    setReviewingSubmission(submission);
    setFeedback(submission.feedback || '');
    setReviewError('');
  };

  const handleApprove = async () => {
    if (reviewingSubmission && user) {
      setReviewing(true);
      setReviewError('');
      try {
        await reviewSubmission(reviewingSubmission.id, 'approved', feedback, user.name);
        setReviewingSubmission(null);
        setFeedback('');
      } catch (error) {
        setReviewError(error instanceof Error ? error.message : 'Failed to approve');
      } finally {
        setReviewing(false);
      }
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      setReviewError('Please provide feedback before rejecting a submission.');
      return;
    }
    
    if (reviewingSubmission && user) {
      setReviewing(true);
      setReviewError('');
      try {
        await reviewSubmission(reviewingSubmission.id, 'rejected', feedback, user.name);
        setReviewingSubmission(null);
        setFeedback('');
      } catch (error) {
        setReviewError(error instanceof Error ? error.message : 'Failed to reject');
      } finally {
        setReviewing(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await deleteSubmission(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete submission');
      }
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadSubmission(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  if (submissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading submissions...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submission Review</h1>
        <p className="text-gray-600 mt-1">Review and manage student submissions</p>
      </div>

      {submissionsError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{submissionsError}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          {[
            { value: 'all', label: 'All', count: submissions.length },
            { value: 'pending', label: 'Pending', count: submissions.filter(s => s.status === 'pending').length },
            { value: 'approved', label: 'Approved', count: submissions.filter(s => s.status === 'approved').length },
            { value: 'rejected', label: 'Rejected', count: submissions.filter(s => s.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value as 'all' | SubmissionStatus)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filterStatus === tab.value
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === 'all' ? 'All Submissions' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Submissions`} 
            ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No submissions found</p>
              <p className="text-sm text-gray-500">
                {filterStatus === 'all' 
                  ? 'Waiting for students to submit their work'
                  : `No ${filterStatus} submissions at the moment`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {submission.studentName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {submission.studentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{submission.title}</div>
                          <div className="text-sm text-gray-500">{submission.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-gray-900">{submission.fileName}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(submission.fileSize)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReview(submission)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                          {submission.status === 'pending' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(submission.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingSubmission}
        onClose={() => setReviewingSubmission(null)}
        title="Review Submission"
      >
        {reviewingSubmission && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Student</p>
                  <p className="font-medium text-gray-900">{reviewingSubmission.studentName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(reviewingSubmission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Title</p>
                  <p className="font-medium text-gray-900">{reviewingSubmission.title}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      reviewingSubmission.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : reviewingSubmission.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {reviewingSubmission.status}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-1">Description</p>
                <p className="text-gray-900">{reviewingSubmission.description}</p>
              </div>
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-2">File</p>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reviewingSubmission.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(reviewingSubmission.fileSize)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleDownload(reviewingSubmission.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            <TextArea
              label="Feedback"
              placeholder="Provide feedback for the student..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />

            {reviewingSubmission.reviewedBy && (
              <div className="text-sm text-gray-600">
                <p>Reviewed by: <span className="font-medium">{reviewingSubmission.reviewedBy}</span></p>
                <p>Reviewed on: {new Date(reviewingSubmission.reviewedAt!).toLocaleString()}</p>
              </div>
            )}

            {reviewError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{reviewError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReviewingSubmission(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleReject}
                disabled={reviewing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {reviewing ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={handleApprove}
                disabled={reviewing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {reviewing ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSubmissions;
