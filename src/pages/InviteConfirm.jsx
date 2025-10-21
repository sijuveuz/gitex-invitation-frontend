import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL;

const InviteConfirm = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({ guest_name: '', company_name: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const MySwal = withReactContent(Swal);
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/invitations/${uuid}/`);
        console.log("INVITE CONFIRM PAGE:", res.data);

        if (res.data.status === 'success') {
          const data = res.data.data;
          setInviteData(data);
          setFormData({
            guest_name: data.guest_name || '',
            company_name: data.company_name || '',
          });

          const today = new Date();
          const expireDate = new Date(data.expire_date);
          const canEdit = data.status === 'active' && !data.registered && today <= expireDate;
          setIsEditable(canEdit);
        } else {
          setError('Failed to fetch invitation details.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [uuid]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditable) return;
  
    try {
      const res = await axios.post(
        `${API_URL}/api/invitations/${uuid}/confirm/`,
        formData
      );
  
      MySwal.fire('✅ Success!', res.data.detail || 'Registration confirmed.', 'success');
  
      // Re-fetch to update page with latest status
      const refreshed = await axios.get(`${API_URL}/api/invitations/${uuid}/`);
      if (refreshed.data.status === 'success') {
        const data = refreshed.data.data;
        setInviteData(data);
        setFormData({
          guest_name: data.guest_name || '',
          company_name: data.company_name || '',
        });
  
        const today = new Date();
        const expireDate = new Date(data.expire_date);
        const canEdit = data.status === 'active' && !data.registered && today <= expireDate;
        setIsEditable(canEdit);
      }
    } catch (err) {
      MySwal.fire('❌ Error', err.response?.data?.detail || 'Confirmation failed.', 'error');
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 text-lg">
        Loading invitation details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600 text-lg font-semibold">
        ⚠️ {error}
      </div>
    );
  }

  if (!inviteData) return null;

  const isExpired = new Date() > new Date(inviteData.expire_date);
  const isRegistered = inviteData.registered;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      {/* <div className="w-64 bg-red-700 text-white p-6 hidden md:flex flex-col">
        <h1 className="text-2xl font-bold mb-6">🎟️ GITEX Portal</h1>
        <ul className="space-y-3">
          <li className="hover:bg-indigo-600 rounded-md px-3 py-2 cursor-pointer">
            Dashboard
          </li>
          <li className="hover:bg-indigo-600 rounded-md px-3 py-2 cursor-pointer">
            Invitations
          </li>
          <li className="hover:bg-indigo-600 rounded-md px-3 py-2 cursor-pointer">
            Help
          </li>
        </ul>
        <div className="mt-auto pt-6 text-sm text-indigo-200">
          &copy; 2025 Veuz Events
        </div>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Invitation Confirmation
          </h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Back to Home
          </button>
        </header>

        {/* Content Area */}
        <main className="flex justify-center items-center flex-1 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 relative">

            {/* Personal Message */}
            {inviteData.personal_message && (
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-2">
                  {inviteData.personal_message}
                </h2>
                <p className="text-gray-600">You’re invited to join us at GITEX!</p>
              </div>
            )}

            {/* Alerts */}
            {isExpired && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-center mb-4">
                ⚠️ This invitation link has expired.
              </div>
            )}
            {isRegistered && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-center mb-4">
                ✅ You’ve already registered for this event.
              </div>
            )}
            {!isEditable && !isExpired && !isRegistered && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-center mb-4">
                This invitation is not editable.
              </div>
            )}

            {/* Invite Details */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteData.guest_email}
                  disabled
                  className="border p-2 w-full rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Ticket Class</label>
                <input
                  type="text"
                  value={inviteData.ticket_type.name} 
                  disabled
                  className="border p-2 w-full rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Guest Name {isEditable && '*'}
                </label>
                <input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleChange}
                  disabled={!isEditable}
                  required={isEditable}
                  className={`border p-2 w-full rounded-lg ${
                    isEditable ? 'bg-white' : 'bg-gray-100'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  disabled={!isEditable}
                  className={`border p-2 w-full rounded-lg ${
                    isEditable ? 'bg-white' : 'bg-gray-100'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Expire Date</label>
                <input
                  value={format(new Date(inviteData.expire_date), 'PPP')}
                  disabled
                  className="border p-2 w-full rounded-lg bg-gray-100"
                />
              </div>

              {isEditable && (
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 w-full rounded-lg font-semibold transition-all duration-200"
                >
                  Confirm Invitation
                </button>
              )}
            </form>

            {/* Footer */}
            <p className="text-center mt-6 text-sm text-gray-500">
              Invitation URL:{' '}
              <a
                href={inviteData.invitation_url}
                className="text-indigo-600 hover:underline break-all"
              >
                {inviteData.invitation_url}
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InviteConfirm;
