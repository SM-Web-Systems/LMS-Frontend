import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { assetUrl, isEmbedded, withBase } from '../utils/embed';

const Login: React.FC = () => {
  // Clerk paths are origin-relative — include the base path so routing works
  // when the app is served under /learn. Embedded visitors land on the course.
  const afterAuth = withBase(isEmbedded() ? '/student/course' : '/');
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary-medium flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src={assetUrl('logo.png')} alt="SM Web Systems" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">SM Web Systems</h1>
          <p className="text-white/80">Learning Management System</p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path={withBase('/login')}
            signUpUrl={withBase('/sign-up')}
            fallbackRedirectUrl={afterAuth}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
