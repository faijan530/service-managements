import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { ServiceRequest } from '../types';
import { Eye, Plus, AlertCircle, RefreshCw, XCircle, Search } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const pageSize = 5;

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err: any) {
      setError('Could not retrieve requests. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredRequests = useMemo(() => {
    const searchable = search.toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        request.title.toLowerCase().includes(searchable) ||
        request.description.toLowerCase().includes(searchable) ||
        request.requestNumber.toLowerCase().includes(searchable);

      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCancelRequest = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/requests/${id}/cancel`);
      await fetchRequests();
      setSuccess('Request cancelled successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW':
        return 'bg-amber-100 text-amber-800';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Service Requests</h1>
          <p className="text-slate-500 mt-1">Raise, track, and manage your support tickets.</p>
        </div>
        <Link
          to="/create-request"
          className="flex items-center space-x-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button onClick={fetchRequests} className="text-red-700 hover:text-red-900">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="animate-spin h-8 w-8 text-brand-600" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-slate-500">No requests match your current search or filter.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Request ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-600">{req.requestNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-xs truncate">{req.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/request/${req._id}`)}
                          className="inline-flex items-center space-x-1 text-slate-600 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>

                        {req.status !== 'CANCELLED' && req.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleCancelRequest(req._id)}
                            disabled={actionLoadingId === req._id}
                            className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition border border-red-200 disabled:opacity-60"
                          >
                            {actionLoadingId === req._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            <span>{actionLoadingId === req._id ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-200">
              {paginatedRequests.map((req) => (
                <div key={req._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{req.title}</p>
                      <p className="text-sm text-slate-500">{req.requestNumber}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(req.priority)}`}>
                      {req.priority}
                    </span>
                    <span className="text-sm text-slate-500">{req.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/request/${req._id}`)}
                      className="inline-flex items-center space-x-1 text-slate-600 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    {req.status !== 'CANCELLED' && req.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleCancelRequest(req._id)}
                        disabled={actionLoadingId === req._id}
                        className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition border border-red-200 disabled:opacity-60"
                      >
                        {actionLoadingId === req._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        <span>{actionLoadingId === req._id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                Showing {Math.min(pageSize, filteredRequests.length)} of {filteredRequests.length} matching tickets
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
