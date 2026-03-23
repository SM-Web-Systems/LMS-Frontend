import React from 'react';
import { Link } from 'react-router-dom';

const SignUp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary-medium flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SM Web Systems" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">SM Web Systems</h1>
          <p className="text-white/80">Learning Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Registration</h2>
          <p className="text-gray-600 mb-6">
            New accounts are created through the WordPress site.
            Please contact your administrator for access.
          </p>
          <Link
            to="/login"
            className="inline-block py-2.5 px-6 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
