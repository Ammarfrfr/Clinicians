import React, { useState, useEffect } from 'react';
import { apiClient } from '../config.js';
import { 
  Users, 
  FileAudio, 
  Activity, 
  Search, 
  LogOut, 
  ShieldCheck, 
  TrendingUp, 
  ClipboardList,
  Calendar,
  PhoneCall,
  Mail,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('clinicians'); // 'clinicians' | 'leads' | 'activity'

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/admin/stats');
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch admin stats.');
      }
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
      setError(err.response?.data?.message || 'Access denied or server error. Make sure you are logged in as an Admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await apiClient.patch(`/api/leads/admin/${leadId}/status`, { status: newStatus });
      if (response.data.success) {
        // Refresh local state
        setStats((prev) => {
          if (!prev) return prev;
          const updatedLeads = (prev.leads || []).map((lead) =>
            lead._id === leadId ? { ...lead, status: newStatus } : lead
          );
          return { ...prev, leads: updatedLeads };
        });
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
      alert('Failed to update lead status.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full bg-warm-white justify-center items-center font-sans">
        <div className="flex flex-col gap-4 items-center">
          <span className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-teal"></span>
          <p className="text-sm text-gray-600 font-medium">Loading Administrator Workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-full bg-warm-white justify-center items-center font-sans p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg max-w-md flex flex-col items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-red-brand" />
          <h2 className="text-lg font-bold text-navy">Administrator Access Error</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
          <div className="flex gap-3 mt-2 w-full">
            <button 
              onClick={fetchAdminStats}
              className="flex-1 px-4 py-2.5 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none"
            >
              Retry Connection
            </button>
            <button 
              onClick={onLogout}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredDoctors = stats?.doctors?.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (doc.profile?.name || '').toLowerCase();
    const email = (doc.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  }) || [];

  const filteredLeads = stats?.leads?.filter((lead) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (lead.name || '').toLowerCase();
    const email = (lead.email || '').toLowerCase();
    const phone = (lead.phone || '').toLowerCase();
    const clinic = (lead.clinic || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || clinic.includes(q);
  }) || [];

  return (
    <div className="flex flex-col h-screen w-full bg-warm-white font-sans text-left">
      {/* Admin Topbar */}
      <header className="flex items-center justify-between px-6 h-14 bg-navy shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-serif text-[22px] text-white tracking-[0.5px] cursor-default select-none">
            Qa<span className="text-teal">lam</span> <span className="font-sans text-[11px] bg-red-brand text-white px-2 py-0.5 rounded-full font-bold ml-2 uppercase tracking-widest">Admin</span>
          </span>
        </div>
        <button 
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white border-none text-xs font-semibold rounded-xl cursor-pointer transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-serif text-navy font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal" /> Platform Analytics & Leads Dashboard
          </h1>
          <p className="text-xs text-gray-500">Overview of active medical practitioners, incoming demo requests, and transcription audit logs.</p>
        </div>

        {/* Analytics Summary Stats Grid (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div 
            onClick={() => setActiveTab('leads')}
            className={`p-5 bg-white border rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer ${activeTab === 'leads' ? 'border-teal ring-2 ring-teal/20' : 'border-gray-200/60'}`}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Demo Leads</span>
              <span className="text-3xl font-bold text-navy">{stats?.totals?.leads || 0}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('clinicians')}
            className={`p-5 bg-white border rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer ${activeTab === 'clinicians' ? 'border-teal ring-2 ring-teal/20' : 'border-gray-200/60'}`}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Clinicians</span>
              <span className="text-3xl font-bold text-navy">{stats?.totals?.doctors || 0}</span>
            </div>
            <div className="p-3 bg-teal-light/60 text-teal rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-200/60 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Patients</span>
              <span className="text-3xl font-bold text-navy">{stats?.totals?.patients || 0}</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-200/60 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scribe Sessions</span>
              <span className="text-3xl font-bold text-navy">{stats?.totals?.recordings || 0}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileAudio className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Workspace View Switcher Tabs */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center gap-2 ${
              activeTab === 'leads' ? 'bg-navy text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Book Demo Leads ({stats?.totals?.leads || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('clinicians')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border-none flex items-center gap-2 ${
              activeTab === 'clinicians' ? 'bg-navy text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clinicians Directory ({stats?.totals?.doctors || 0})</span>
          </button>
        </div>

        {/* Tab 1: Demo Leads Table */}
        {activeTab === 'leads' && (
          <div className="p-6 bg-white border border-gray-200/60 rounded-2xl shadow-xs flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Book a Demo Inquiries
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Incoming doctor requests submitted via the Book a Demo page.</p>
              </div>
              <div className="relative flex items-center md:w-64">
                <Search className="absolute left-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2 pl-[36px] pr-3 text-sm focus:outline-none focus:border-teal transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100">
                    <th className="pb-3 text-left">Doctor Contact</th>
                    <th className="pb-3 text-left">Clinic & Specialty</th>
                    <th className="pb-3 text-left">Preferred Slot</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-gray-400 italic">
                        No demo requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                      const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
                      return (
                        <tr key={lead._id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-4 text-left">
                            <div className="font-bold text-navy text-base">{lead.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              <a href={`mailto:${lead.email}`} className="hover:text-blue-600 underline">{lead.email}</a>
                            </div>
                            <div className="text-xs text-gray-600 font-mono flex items-center gap-1.5 mt-0.5">
                              <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                              <span>{lead.phone}</span>
                            </div>
                          </td>

                          <td className="py-4 text-left">
                            <div className="font-semibold text-navy">{lead.clinic || 'N/A'}</div>
                            <div className="text-xs text-teal-dark font-medium mt-0.5">{lead.specialty || 'General Practice'}</div>
                          </td>

                          <td className="py-4 text-left">
                            <div className="text-xs font-bold text-navy flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>{lead.preferredDate || 'Flexible Date'}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{lead.preferredTime}</div>
                          </td>

                          <td className="py-4 text-center">
                            <select
                              value={lead.status || 'Pending'}
                              onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer border-none ${
                                lead.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>

                          <td className="py-4 text-right">
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold no-underline transition-colors shadow-xs"
                              >
                                WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Clinicians Directory */}
        {activeTab === 'clinicians' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 p-6 bg-white border border-gray-200/60 rounded-2xl shadow-xs flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-base font-bold text-navy">Clinicians Directory</h3>
                  <p className="text-[11px] text-gray-400">Total registered doctor accounts sorted by creation date.</p>
                </div>
                <div className="relative flex items-center md:w-64">
                  <Search className="absolute left-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-2 pl-[36px] pr-3 text-sm focus:outline-none focus:border-teal transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100">
                      <th className="pb-3 text-left">Doctor Details</th>
                      <th className="pb-3 text-left">Subscription</th>
                      <th className="pb-3 text-center">Patients</th>
                      <th className="pb-3 text-center">Scribes</th>
                      <th className="pb-3 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDoctors.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-400 italic">
                          No doctors match your query.
                        </td>
                      </tr>
                    ) : (
                      filteredDoctors.map((doc) => (
                        <tr key={doc._id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-3.5 text-left">
                            <div className="font-semibold text-navy">Dr. {doc.profile?.name || 'Unregistered'}</div>
                            <div className="text-xs text-gray-400">{doc.profile?.qualification || 'Clinician'} · {doc.profile?.specialization || 'General'}</div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">{doc.email}</div>
                          </td>
                          <td className="py-3.5 text-left">
                            <span className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              doc.subscriptionPlan === 'clinic' ? 'bg-purple-100 text-purple-700' :
                              doc.subscriptionPlan === 'pro' ? 'bg-teal-light text-teal-dark' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {doc.subscriptionPlan}
                            </span>
                          </td>
                          <td className="py-3.5 text-center font-semibold text-navy">{doc.patientCount || 0}</td>
                          <td className="py-3.5 text-center font-semibold text-navy">{doc.recordingCount || 0}</td>
                          <td className="py-3.5 text-right text-xs text-gray-500 font-mono">
                            {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Feed */}
            <div className="p-6 bg-white border border-gray-200/60 rounded-2xl shadow-xs flex flex-col gap-4">
              <div className="border-b border-gray-100 pb-3 flex flex-col gap-0.5">
                <h3 className="text-base font-bold text-navy flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal animate-pulse" /> Scribe Activity Audit
                </h3>
                <p className="text-[11px] text-gray-400">Live feed of processed clinical transcriptions.</p>
              </div>

              <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1">
                {stats?.recentActivity?.length === 0 ? (
                  <div className="text-center text-gray-400 italic py-8">
                    No scribe sessions processed yet.
                  </div>
                ) : (
                  stats?.recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex flex-col gap-1.5 p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:border-teal/20 transition-all text-left">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-navy truncate">Pt: {activity.patientName}</span>
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          activity.status === 'completed' ? 'bg-teal-light text-teal-dark' : 'bg-red-brand-light text-red-brand'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">Scribed by: <strong>Dr. {activity.doctorName}</strong></div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-0.5">
                        <span>Duration: {activity.duration ? `${activity.duration.toFixed(0)}s` : 'N/A'}</span>
                        <span>
                          {new Date(activity.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
