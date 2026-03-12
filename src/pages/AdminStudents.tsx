import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardContent, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input, { Select } from '../components/Input';
import Modal from '../components/Modal';
import { courseService } from '../services/courseService';
import { userDirectoryService } from '../services/userDirectoryService';
import { usersService } from '../services/usersService';
import { UserPlus, Edit, Trash2, Mail, BookOpen, Loader2, KeyRound } from 'lucide-react';
import { Student, CreateStudentData, UpdateStudentData } from '../types/api';

const AdminStudents: React.FC = () => {
  const { 
    students, 
    studentsLoading, 
    studentsError, 
    fetchStudents, 
    addStudent, 
    updateStudent, 
    deleteStudent 
  } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<CreateStudentData>({
    name: '',
    email: '',
    enrollmentNumber: '',
    department: 'Computer Science',
    semester: 1,
  });
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof courseService.fetchCourses>>>([]);
  const [courseCodesMap, setCourseCodesMap] = useState<Record<string, string[]>>({});

  const courseCodesWithTitles = useMemo(
    () => courses.filter((c) => c.courseCode).map((c) => ({ code: c.courseCode!, title: c.title })),
    [courses]
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    courseService.fetchCourses().then(setCourses).catch(() => setCourses([]));
    usersService.getUsers().then((users) => {
      const map: Record<string, string[]> = {};
      users.forEach((u) => {
        map[u.id] = u.courseCodes ?? [];
      });
      setCourseCodesMap(map);
    }).catch(() => {});
  }, []);

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
  ];

  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        enrollmentNumber: student.enrollmentNumber,
        department: student.department,
        semester: student.semester,
      });
      setSelectedCourseCodes(courseCodesMap[student.userId || student.id] ?? []);
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        email: '',
        enrollmentNumber: '',
        department: 'Computer Science',
        semester: 1,
      });
      setSelectedCourseCodes([]);
    }
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      if (editingStudent) {
        const updateData: UpdateStudentData = {
          name: formData.name,
          email: formData.email,
          enrollmentNumber: formData.enrollmentNumber,
          department: formData.department,
          semester: formData.semester,
        };
        await updateStudent(editingStudent.id, updateData);
        const userId = editingStudent.userId || editingStudent.id;
        if (userId) {
          await usersService.patchUserCourseCodes(userId, selectedCourseCodes);
        }
        userDirectoryService.update(userId || editingStudent.id, {
          name: formData.name,
          email: formData.email,
          courseCodes: selectedCourseCodes,
        });
      } else {
        const student = await addStudent(formData);
        const userId = student.userId || student.id;
        if (userId && selectedCourseCodes.length > 0) {
          await usersService.patchUserCourseCodes(userId, selectedCourseCodes);
        }
        userDirectoryService.add({
          id: userId || student.id,
          name: student.name,
          email: student.email,
          role: 'student',
          courseCodes: selectedCourseCodes,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student? All their submissions will also be deleted.')) {
      try {
        await deleteStudent(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete student');
      }
    }
  };

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Loading students...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage student records and information</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {studentsError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{studentsError}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No students yet</p>
              <p className="text-sm text-gray-500">Click "Add Student" to register the first student</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {student.enrollmentNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                          {student.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Semester {student.semester}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(courseCodesMap[student.userId || student.id] ?? []).length === 0
                          ? '—'
                          : (courseCodesMap[student.userId || student.id] ?? []).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenModal(student)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(student.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
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

      {/* Add/Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="student@smwebsystems.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Enrollment Number"
            placeholder="KCS2024001"
            value={formData.enrollmentNumber}
            onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
            required
          />

          <Select
            label="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            options={departments.map(dept => ({ value: dept, label: dept }))}
          />

          <Select
            label="Semester"
            value={formData.semester}
            onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
            options={semesters.map(sem => ({ value: sem, label: `Semester ${sem}` }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <KeyRound className="h-4 w-4 inline mr-1" />
              Course access
            </label>
            <p className="text-sm text-gray-500 mb-2">Select which courses this student can see (0 to many).</p>
            {courseCodesWithTitles.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No courses with codes yet. Create courses from the Course tab first.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {courseCodesWithTitles.map(({ code, title }) => (
                  <label key={code} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCourseCodes.includes(code)}
                      onChange={() => {
                        setSelectedCourseCodes((prev) =>
                          prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                        );
                      }}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="font-medium text-gray-800">{code}</span>
                    <span className="text-gray-500 text-sm">— {title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStudents;
