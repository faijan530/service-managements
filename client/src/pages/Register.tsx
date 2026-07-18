import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AlertCircle, UserPlus, Mail, KeyRound, User as UserIcon } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      setSuccess('Account registered successfully! You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Account
          </h2>
          <p class="mt-2 text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" class="font-medium text-brand-600 hover:text-brand-500 transition">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start space-x-2">
            <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span class="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start space-x-2">
            <span class="text-sm text-green-700">{success}</span>
          </div>
        )}

        <form class="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div class="space-y-4 rounded-md">
            <div>
              <label htmlFor="fullname" class="block text-sm font-medium text-slate-700 font-semibold mb-1">
                Full Name
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon class="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="fullname"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email-address" class="block text-sm font-medium text-slate-700 font-semibold mb-1">
                Email Address
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail class="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email-address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" class="block text-sm font-medium text-slate-700 font-semibold mb-1">
                Password
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound class="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" class="block text-sm font-medium text-slate-700 font-semibold mb-1">
                Register As (Role)
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg"
              >
                <option value="USER">User (Standard)</option>
                <option value="ADMIN">Admin (Privileged)</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition shadow-md"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
