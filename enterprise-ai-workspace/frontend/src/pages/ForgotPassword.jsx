import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Brain, Loader2, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  // Sign the user out when they land on this page — they're resetting their password
  useEffect(() => { logout(); }, []);

  async function onSubmit(data) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      if (res.data.dev_reset_link) setDevLink(res.data.dev_reset_link);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
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
          {submitted ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-6">
                If that address is registered, we've sent a reset link. Check your inbox (and spam folder).
              </p>
              {devLink && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 break-all">
                  <p className="font-semibold mb-1">Dev mode — SendGrid not configured. Use this link to reset:</p>
                  <a href={devLink} className="text-indigo-600 underline">{devLink}</a>
                </div>
              )}
              <Link to="/login" className="text-indigo-600 font-medium hover:underline text-sm mt-4 block">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Forgot your password?</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    {...register('email', { required: 'Email is required' })}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-6"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
