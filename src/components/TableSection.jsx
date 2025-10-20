import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  MdRefresh,
  MdViewColumn,
  MdDelete,
  MdVisibility,
  MdEdit,
  MdContentCopy,
} from 'react-icons/md';
import axios from 'axios';
import { FaBroadcastTower } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import InvitationViewModal from './Modals/InvitationViewModal'
import EditHandler from "./Modals/EditHandler";
import BroadcastModal from "./Modals/BroadcastModal";
const MySwal = withReactContent(Swal);

const CopyButton = ({ url }) => {
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;
  const handleCopy = async () => {
    if (!url) {
      MySwal.fire('Error', 'No URL found to copy', 'error');
      return;
    }

    try {
      // Try using navigator clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);

      // Small visual feedback
      setTimeout(() => setCopied(false), 2000);

      // Optional toast (add after 100ms so button label updates first)
      setTimeout(() => {
        MySwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Copied to clipboard!',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
      }, 100);

    } catch (error) {
      console.error('Clipboard error:', error);
      MySwal.fire('Error', 'Unable to copy link. Try manually.', 'error');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`${copied ? 'bg-green-600' : 'bg-primary'
        } text-white px-3 py-1 rounded flex items-center justify-center gap-1 
        font-medium transition-all duration-200 hover:opacity-90 active:scale-95 btn-action`}
      style={{ padding: '2px 6px', fontSize: '11px', margin: '0 1px' }}
    >
      <MdContentCopy size={16} />
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
};

// 🧹 Clean reusable delete handler
const handleDeleteInvitation = async (rowData, onRefresh) => {
  const { limit, registered, id } = rowData;
  const token = localStorage.getItem("token");

  console.log("limit, registered", limit, registered);

  // 🔍 1️⃣ Check usage limit
  if (limit && registered && limit === registered) {
    MySwal.fire({
      icon: "warning",
      title: "Cannot Delete",
      text: "This invitation link has reached its full usage limit. Deletion is not allowed.",
      confirmButtonColor: "#e74c3c",
    });
    return;
  }

  // 🗑️ 2️⃣ Ask confirmation
  const confirm = await MySwal.fire({
    title: "Delete Invitation?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e74c3c",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, Delete it",
  });

  if (!confirm.isConfirmed) return;

  // ⚙️ 3️⃣ Proceed to delete
  try {
    await axios.delete(`${API_URL}/api/invitations/${id}/delete/`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });

    MySwal.fire("Deleted!", "The invitation has been removed.", "success");

    // 🔁 4️⃣ Trigger refresh (if provided)
    if (onRefresh) onRefresh();
  } catch (err) {
    console.error(err);
    MySwal.fire("Error", "Failed to delete the invitation.", "error");
  }
};

const TableSection = ({
  data = [],
  onRefresh,
  onNext,
  onPrev,
  currentPage,
  totalPages,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);

  const handleEditClick = (id) => {
    setEditId(id);
    setShowEdit(true);
  };

  const handleCloseEdit = () => {
    setShowEdit(false);
    setEditId(null);
  };

  const handleSuccess = () => {
    MySwal.fire("Updated!", "Changes saved successfully", "success");
    handleCloseEdit();
    // optionally trigger a reload here
  };

  const handleView = async (id) => {
    setShowModal(true);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/invitations/dash/${id}/`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
      console.log("DASH Int details", res.data)
      setSelectedInvite(res.data.data);
    } catch (error) {
      console.error(error);
      MySwal.fire('Error', 'Failed to load invitation details', 'error');
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = (rowData, onRefresh) => {
    const { limit, registered, type, id } = rowData;

    // Check usage limit
    if (limit && registered && limit === registered) {
      MySwal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: "The usage limit for this invitation has been reached.",
        confirmButtonColor: "#e74c3c",
      });
      return;
    }

    console.log("LINK TYPE", type)
    // Check if type is link
    if (type !== "Invitation Link") {
      console.log("LINK TYPE", type)
      MySwal.fire('Info', 'Broadcast is only available for link type invitations.', 'info');
      return;
    }

    // Open modal
    setSelectedBroadcastId(id);
    setShowBroadcast(true);
  };

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            className="table-checkbox"
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        ),
        cell: () => (
          <input
            type="checkbox"
            className="table-checkbox"
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        ),
      },
      { accessorKey: 'name', header: 'Link Title / Full Name' },
      { 
        accessorKey: 'email', 
        header: 'Email Address',
        cell: ({ getValue }) => {
          const email = getValue();
          return email ? (
            <span>{email}</span>
          ) : (
            <span className="text-gray-400 italic">view</span>
          );
        },
      },

      { accessorKey: 'type', header: 'Invite Type' },
      { accessorKey: 'ticket_type', header: 'Ticket Class' },
      { accessorKey: 'limit', header: 'Link Limit' },
      { accessorKey: 'registered', header: 'Registered' },
      { accessorKey: 'expiry', header: 'Expiry Date' },

      {
        accessorKey: 'invitation_url',
        header: 'Invitation Link',
        cell: ({ getValue }) => <CopyButton url={getValue()} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const value = getValue();
          const lowerValue = value ? value.toString().toLowerCase().trim() : '';
          let displayValue = value;
          let color = 'bg-gray-500'; // default
      
          if (lowerValue === 'active') {
            color = 'bg-green-500';
            displayValue = 'Active';
          } else if (lowerValue === 'pending') {
            color = 'bg-yellow-500';
            displayValue = 'Pending';
          } else if (lowerValue === 'expired') {
            color = 'bg-red-500';
            displayValue = 'Expired';
          }
      
          return (
            <span
              className={`${color} text-white px-2 py-1 rounded text-xs badge-status`}
              style={{ padding: '3px 8px', fontWeight: '500', fontSize: '11px' }}
            >
              {displayValue}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button
              onClick={() => handleView(row.original.id)}
              className="bg-blue-500 text-white p-1 rounded hover:opacity-80 btn-action"
              style={{ padding: '2px 6px', fontSize: '11px', margin: '0 1px' }}
            >
              <MdVisibility />
            </button>

            <button
              onClick={() => handleEditClick(row.original.id)}
              className="bg-blue-500 text-white p-1 rounded hover:opacity-80 btn-action"
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                margin: "0 1px",
              }}
              title="Edit Invitation"
            >
              <MdEdit size={14} />
            </button>
            <button
              onClick={() => handleBroadcast(row.original, onRefresh)}
              className="bg-green-500 text-white p-1 rounded hover:opacity-80 btn-action"
              style={{ padding: '2px 6px', fontSize: '11px', margin: '0 1px' }}
            >
              <FaBroadcastTower />
            </button>
            <button
              onClick={() => handleDeleteInvitation(row.original, onRefresh)}
              className="bg-red-500 text-white p-1 rounded hover:opacity-80 btn-action"
              style={{ padding: "2px 6px", fontSize: "11px", margin: "0 1px" }}
            >
              <MdDelete />
            </button>


          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });



  return (
    <div
      className="bg-white p-4 rounded shadow table-wrapper"
      style={{
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: '15px',
      }}
    >
      <div className="flex justify-between mb-4 table-actions">
        <h5 className="text-base font-semibold mb-0" style={{ fontSize: '16px' }}>
          Invitation List
        </h5>
        <div className="flex gap-2 action-btn-group">
          <button
            onClick={onRefresh}
            className="bg-blue-500 text-white p-1 rounded hover:opacity-80 btn btn-sm"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <MdRefresh />
          </button>
          <button
            className="bg-gray-500 text-white p-1 rounded hover:opacity-80 btn btn-sm"
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            <MdViewColumn />
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table
          className="w-full text-sm border border-gray-200 table"
          style={{ fontSize: '13px' }}
        >
          <thead className="bg-gray-100 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-2 text-left"
                    style={{
                      fontSize: '12px',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      fontWeight: '600',
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 border-b"
                style={{ padding: '8px', verticalAlign: 'middle' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2" style={{ padding: '8px' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4 items-center">
        <span style={{ fontSize: '12px', color: '#6c757d', paddingTop: '8px' }}>
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={currentPage === 1}
            className="bg-white border p-1 rounded disabled:opacity-50"
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
            }}
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="bg-white border p-1 rounded disabled:opacity-50"
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
            }}
          >
            Next
          </button>
        </div>
        {/* Unified Edit Modal */}
        {showEdit && (
          <EditHandler
            show={showEdit}
            id={editId}
            onClose={handleCloseEdit}
            onSuccess={handleSuccess}
          />
        )}
        {showModal && (
          <InvitationViewModal
            show={showModal}
            onClose={() => setShowModal(false)}
            data={selectedInvite}
            loading={loading}
          />
        )}
        {showBroadcast && (
          <BroadcastModal
            isOpen={showBroadcast}
            onClose={() => setShowBroadcast(false)}
            invitationId={selectedBroadcastId}
            onSubmit={async (formData) => {
              const token = localStorage.getItem('token');
              try {
                const res = await axios.post(
                  '${API_URL}/api/invitations/broadcast/',
                  {
                    invitation_id: selectedBroadcastId,
                    source_type: "link",
                    guest_name: formData.guest_name,
                    guest_email: formData.guest_email,
                    company_name: formData.company_name,
                    personal_message: formData.personal_message,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data?.status === 'success') {
                  return res.data;
                }
                return {
                  status: 'error',
                  message: res.data?.message || 'Something went wrong.',
                };
              } catch (err) {
                const backendData = err.response?.data;
                return {
                  status: 'error',
                  message: backendData?.message || 'Something went wrong.',
                };
              }
            }}
            onSuccess={() => {
              MySwal.fire("Sent!", "Broadcast invitation sent successfully", "success");
              setShowBroadcast(false);
              if (onRefresh) onRefresh();
            }}
          />
        )}
      </div>

    </div>
  );
};

export default TableSection;