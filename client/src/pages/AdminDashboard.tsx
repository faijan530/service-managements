import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { ServiceRequest } from '../types';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

const STATUS_OPTIONS = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'] as const;
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [admins, setAdmins] = useState<{_id: string, name: string, email: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    cancelled: 0,
  });

  const fetchRequestsAndAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, adminRes] = await Promise.all([
        api.get('/requests'),
        api.get('/auth/admins')
      ]);
      setRequests(reqRes.data);
      setAdmins(adminRes.data);
      const nextStats = {
        total: reqRes.data.length,
        open: reqRes.data.filter((request: ServiceRequest) => request.status === 'OPEN').length,
        inProgress: reqRes.data.filter((request: ServiceRequest) => request.status === 'IN_PROGRESS').length,
        resolved: reqRes.data.filter((request: ServiceRequest) => request.status === 'RESOLVED').length,
        cancelled: reqRes.data.filter((request: ServiceRequest) => request.status === 'CANCELLED').length,
      };
      setStats(nextStats);
    } catch (err: any) {
      setError('Failed to retrieve data for admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsAndAdmins();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = `${request.requestNumber} ${request.title} ${request.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pagedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/requests/${id}/status`, { status: newStatus });
      setError(null);
      fetchRequestsAndAdmins();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error updating status.');
    }
  };

  const handleAssign = async (id: string, assignedUserId: string) => {
    try {
      const res = await api.put(`/requests/${id}/assign`, { assignedTo: assignedUserId });
      setError(null);
      fetchRequestsAndAdmins();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Assignment failed.');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    try {
      await api.patch(`/requests/${id}/priority`, { priority: newPriority });
      setError(null);
      fetchRequestsAndAdmins();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Priority update failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-slate-500 mt-1">Review, assign, and manage all organization service requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Tickets</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-blue-500 uppercase">Open</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-purple-500 uppercase">In Progress</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-green-500 uppercase">Resolved</span>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">Cancelled</span>
          <p className="text-2xl font-bold text-slate-500 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button onClick={fetchRequestsAndAdmins} className="text-red-700 hover:text-red-900">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by request number, title, or description"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg">
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg">
          <option value="ALL">All priorities</option>
          {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin h-8 w-8 text-brand-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pagedRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-600">{req.requestNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-xs truncate">{req.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.createdBy?.name || 'User'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={req.priority}
                        onChange={(e) => handlePriorityChange(req._id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1"
                      >
                        {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1"
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <select
                        value={req.assignedTo?._id || ''}
                        onChange={(e) => handleAssign(req._id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1"
                      >
                        <option value="">Unassigned</option>
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name} ({admin.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/request/${req._id}`)}
                        className="text-brand-600 hover:text-brand-900 px-3 py-1 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filteredRequests.length > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
          <span>Showing {Math.min(pageSize, filteredRequests.length)} of {filteredRequests.length} matches</span>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};
