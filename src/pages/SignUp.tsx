import React from 'react';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { assetUrl, isEmbedded, withBase } from '../utils/embed';

const SignUp: React.FC = () => {
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
          <ClerkSignUp
            routing="path"
            path={withBase('/sign-up')}
            signInUrl={withBase('/login')}
            fallbackRedirectUrl={afterAuth}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
