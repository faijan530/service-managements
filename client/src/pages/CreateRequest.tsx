import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AlertCircle, CheckCircle, FileText, Send, ArrowLeft } from 'lucide-react';

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [priority, setPriority] = useState('MEDIUM');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.post('/requests', {
        title,
        description,
        category,
        priority,
      });

      setSuccess(`Request created successfully! Reference: ${response.data.requestNumber}`);
      
      setTitle('');
      setDescription('');
      setCategory('Hardware');
      setPriority('MEDIUM');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        class="flex items-center space-x-1 text-slate-500 hover:text-brand-600 mb-6 transition"
      >
        <ArrowLeft class="h-4 w-4" />
        <span class="text-sm font-medium">Back</span>
      </button>

      <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
        <div class="flex items-center space-x-3 mb-6">
          <div class="bg-brand-100 text-brand-600 p-2.5 rounded-xl">
            <FileText class="h-6 w-6" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Raise Service Request</h1>
            <p class="text-sm text-slate-500">Provide details of the issue you are facing.</p>
          </div>
        </div>

        {error && (
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-2 mb-6">
            <AlertCircle class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span class="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-2 mb-6">
            <CheckCircle class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span class="text-sm text-green-700">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <label htmlFor="title" class="block text-sm font-medium text-slate-700 mb-1">
              Title / Issue Summary *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              class="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              placeholder="e.g., Cannot connect to corporate VPN"
            />
          </div>

          <div>
            <label htmlFor="description" class="block text-sm font-medium text-slate-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              class="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              placeholder="Please provide steps to reproduce the issue, error codes, and symptoms."
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" class="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                class="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              >
                <option value="Hardware">Hardware Issues</option>
                <option value="Software">Software Issues</option>
                <option value="Network">Network / Internet</option>
                <option value="Access">Access / Permissions</option>
                <option value="Other">Other / General</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" class="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                class="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end pt-4">
            <button
              type="submit"
              class="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md transition"
            >
              <Send class="h-4 w-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
