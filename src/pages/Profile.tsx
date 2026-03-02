import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { profileService } from '../services/profileService';
import { quizService } from '../services/quizService';
import { userDirectoryService } from '../services/userDirectoryService';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import Input, { TextArea } from '../components/Input';
import { User, CheckCircle, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const isViewingOther = routeUserId && routeUserId !== user?.id;

  const [name, setName] = useState(user?.name ?? '');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.name && !isViewingOther) setName(user.name);
  }, [user?.name, isViewingOther]);

  useEffect(() => {
    const id = isViewingOther ? routeUserId! : user?.id;
    if (id) {
      const profile = profileService.get(id);
      setDescription(profile.description ?? '');
      if (profile.displayName) setName(profile.displayName);
      else if (isViewingOther) {
        const dirUser = userDirectoryService.get(id);
        if (dirUser) setName(dirUser.name);
      }
    }
  }, [user?.id, routeUserId, isViewingOther]);

  const handleSave = () => {
    if (!user || isViewingOther) return;
    setSaving(true);
    setSaved(false);
    try {
      const updatedUser = { ...user, name: name.trim() || user.name };
      updateUser(updatedUser);
      profileService.save(user.id, {
        displayName: name.trim() || undefined,
        description: description.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const profileUserId = isViewingOther ? routeUserId! : user?.id;
  const completions = profileUserId ? quizService.getCompletionsForUser(profileUserId).filter((c) => c.passed) : [];
  const completionsWithTitles = completions.map((c) => ({
    ...c,
    quizTitle: quizService.getById(c.quizId)?.title ?? 'Quiz',
  })).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-neutral-600">You must be signed in to view profiles.</p>
      </div>
    );
  }

  const displayName = isViewingOther ? (userDirectoryService.get(routeUserId!)?.name ?? name) : (name || user.name);
  const basePath = user.role === 'admin' ? '/admin' : '/student';

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        {isViewingOther && (
          <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/profile`)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to my profile
          </Button>
        )}
        <User className="h-8 w-8 text-primary-600 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            {isViewingOther ? `${displayName}'s profile` : 'Profile'}
          </h1>
          <p className="text-neutral-600 mt-0.5">
            {isViewingOther ? 'View their profile and completed work.' : 'Edit your profile and see what you’ve completed.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">About</h2>
              {isViewingOther ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                    <p className="text-neutral-800">{displayName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                    <p className="text-neutral-600 whitespace-pre-wrap">{description || '—'}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`${basePath}/messages`, { state: { openUserId: routeUserId, openUserName: displayName } })}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                    <p className="text-neutral-600">{user.email}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Email is managed by your account and can’t be changed here.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                    <p className="capitalize text-neutral-600">{user.role}</p>
                  </div>
                  <TextArea
                    label="Description / bio"
                    placeholder="Write a short description about yourself, your goals, or what you’re learning."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save profile
                    </Button>
                    {saved && (
                      <span className="inline-flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary-dark/10 flex items-center justify-center mb-3">
                <User className="w-12 h-12 text-primary-dark" />
              </div>
              <p className="font-medium text-neutral-800">{displayName}</p>
              {!isViewingOther && <p className="text-sm text-neutral-500">{user.email}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed
              </h2>
              {completionsWithTitles.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  {isViewingOther ? 'No completed quizzes yet.' : 'No completed quizzes yet. Take a quiz from the Quizzes page.'}
                </p>
              ) : (
                <ul className="space-y-3">
                  {completionsWithTitles.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="font-medium text-neutral-800">{c.quizTitle}</span>
                      <span className="text-sm text-neutral-500">{c.score}% · {new Date(c.completedAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
