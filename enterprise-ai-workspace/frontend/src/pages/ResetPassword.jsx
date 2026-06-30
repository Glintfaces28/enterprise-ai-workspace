import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Brain, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function ResetPassword() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  async function onSubmit(data) {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: data.new_password,
      });
      navigate('/login', { state: { message: 'Password updated! Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Brain className="text-indigo-400" size={34} />
          <h1 className="text-white text-2xl font-bold">Enterprise AI Workspace</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Set a new password</h2>
          <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                {...register('new_password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (val) =>
                    val === watch('new_password') || 'Passwords do not match',
                })}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
