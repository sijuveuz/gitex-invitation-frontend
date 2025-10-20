// components/InvitationViewModal.jsx
import React from 'react';
import { MdClose, MdCheckCircle, MdLink } from 'react-icons/md';

const InvitationViewModal = ({ show, loading, data, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden transform transition-all scale-100 hover:scale-[1.01] duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <h3 className="text-lg font-semibold tracking-wide">Invitation Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-100 transition"
            title="Close"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40 text-gray-500">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              Loading details...
            </div>
          ) : data ? (
            <>
              {/* Main Info */}
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <p><strong>Name:</strong> {data.guest_name || 'N/A'}</p>
                  <p><strong>Email:</strong> {data.guest_email || 'N/A'}</p>
                  <p><strong>Company:</strong> {data.company_name || 'N/A'}</p>
                  <p><strong>Ticket Type:</strong> {data.ticket_type.name || 'N/A'}</p>
                  <p><strong>Expire Date:</strong> {data.expire_date || 'N/A'}</p>
                  <p><strong>Usage Limit:</strong> {data.usage_limit ?? 0}</p>
                  <p><strong>Used:</strong> {data.usage_count ?? 0}</p>
                </div>

                {/* Status Badge */}
                <div className="mt-3">
                  <strong>Link Status:</strong>{' '}
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${
                      data.status === 'active'
                        ? 'bg-green-600'
                        : data.status === 'expired'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    {data.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>

              {/* Usages Section (for Link Type) */}
              {data.source_type === 'link' && (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold mb-2 flex items-center text-gray-700">
                    <MdLink className="mr-1 text-blue-500" /> Usages ({data.usages?.length || 0})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                    {data.usages?.length > 0 ? (
                      data.usages.map((u, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white mb-1 p-2 rounded-md shadow-sm border"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-800">{u.guest_name}</p>
                            <p className="text-xs text-gray-500">{u.guest_email}</p>
                          </div>
                          {u.registered && (
                            <MdCheckCircle className="text-green-500" size={18} />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">No usages found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* For Personal/Bulk */}
              {(data.source_type === 'bulk' || data.source_type === 'personal') && (
                <div className="mt-5 flex items-center gap-2 text-sm">
                  <strong>Registered:</strong>
                  {data.registered ? (
                    <span className="flex items-center text-green-600 font-medium gap-1">
                      <MdCheckCircle size={18} /> Yes
                    </span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">No details found.</div>
          )}
        </div>

        {/* Footer */}
        {!loading && data && (
          <div className="px-5 py-3 border-t flex justify-end bg-gray-50">
            <a
              href={data.invitation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Open Invitation
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationViewModal;
