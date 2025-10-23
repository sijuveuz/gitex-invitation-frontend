// components/Modals/BulkPersonalLinkEditModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { MdClose } from "react-icons/md";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL;

const BulkPersonalLinkEditModal = ({ show, id, initialData = null, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    guest_name: "",
    company_name: "",
    ticket_type: "",
    expire_date: "",
    guest_email: "",
    registered: false,
    source_type: "",
  });

  const [tickets, setTickets] = useState([]); // list from /api/tickets/
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const modalRef = useRef(null);

  // Close modal when clicking outside or pressing Esc
  useEffect(() => {
    if (!show) return;

    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [show, onClose]);

  // Initialize form: use initialData if provided; otherwise fetch
  useEffect(() => {
    if (!show || !id) return;

    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        let d = null;
        if (initialData) {
          d = initialData;
        } else {
          const res = await axios.get(`${API_URL}/api/invitations/dash/${id}/`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          });
          d = res.data?.data || {};
        }

        const normalized = {
          guest_name: d.guest_name || "",
          company_name: d.company_name || "",
          ticket_type:
            typeof d.ticket_type === "object" ? d.ticket_type?.name || "" : d.ticket_type || "",
          expire_date: d.expire_date || "",
          guest_email: d.guest_email || "",
          registered: d.registered === true || d.registered === "true" || false,
          source_type: d.source_type || "",
        };

        if (!mounted) return;
        setFormData(normalized);

        // fetch ticket list only if guest is NOT registered (editable ticket)
        if (!normalized.registered) {
          try {
            const ticketRes = await axios.get(`${API_URL}/api/invitations/tickets/`, {
              headers: { Authorization: token ? `Bearer ${token}` : "" },
            });

            // Accept different API shapes: data.data or data
            const ticketList = ticketRes.data?.data ?? ticketRes.data ?? [];
            setTickets(ticketList);
          } catch (err) {
            console.error("Failed to fetch tickets", err);
            // silent fail — dropdown will be empty
            setTickets([]);
          }
        }
      } catch (err) {
        console.error(err);
        MySwal.fire("Error", "Failed to load details", "error");
        onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [show, id, initialData]);

  // Validation
  const validateField = (name, value) => {
    let msg = "";
    if (name === "guest_name") {
      if (!/^[A-Za-z\s]*$/.test(value)) msg = "Only letters and spaces allowed.";
      else if (value.trim().length < 2) msg = "Name must be at least 2 characters.";
    } else if (name === "company_name") {
      if (!/^[A-Za-z\s]*$/.test(value)) msg = "Only letters and spaces allowed.";
      if (value && value.trim().length < 2) msg = "Company name must be at least 2 characters.";
    } else if (name === "expire_date") {
      const today = new Date().toISOString().split("T")[0];
      if (value && value < today) msg = "Expiry date cannot be in the past.";
    }
    setErrors((p) => ({ ...p, [name]: msg }));
    return msg === "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate important fields
    const validated = [
      validateField("guest_name", formData.guest_name),
      validateField("company_name", formData.company_name),
      validateField("expire_date", formData.expire_date),
    ];

    if (validated.includes(false)) {
      MySwal.fire("Validation Error", "Please fix the errors.", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      // If backend expects ticket id instead of name, prefer id
      let ticketPayload = formData.ticket_type;
      // detect if tickets list has id and name, and selected value is name -> convert to id
      if (tickets.length > 0 && tickets[0].id && tickets[0].name) {
        const found = tickets.find((t) => t.name === formData.ticket_type || String(t.id) === String(formData.ticket_type));
        if (found) ticketPayload = found.id;
      }

      const payload = {
        guest_name: formData.guest_name.trim(),
        company_name: formData.company_name.trim(),
        ticket_type: ticketPayload ? String(ticketPayload).trim() : null,
        expire_date: formData.expire_date ? new Date(formData.expire_date).toISOString().split("T")[0] : null,
      };

      await axios.patch(`${API_URL}/api/invitations/${id}/edit/`, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      MySwal.fire("Updated!", "Invitation updated successfully", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      MySwal.fire("Error", "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const isRegistered = Boolean(formData.registered);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-5 py-3 border-b text-white"
          style={{ background: "#e74c3c" }}
        >
          <h3 className="text-lg font-semibold tracking-wide">Edit Invitation</h3>
          <button onClick={onClose} className="hover:text-gray-200 transition" title="Close">
            <MdClose size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {isRegistered && (
                <div className="mb-4 bg-yellow-50 border border-yellow-300 text-yellow-700 px-3 py-2 rounded text-sm">
                  This guest is already registered. Only name and company can be edited.
                </div>
              )}

              {/* Email - always readonly */}
              <div>
  <label className="block font-medium text-gray-700">Email</label>
  <input
    type="email"
    name="guest_email"
    value={formData.guest_email || ""}
    onChange={handleChange}
    disabled={isRegistered}
    className={`w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
      isRegistered
        ? "bg-gray-100 cursor-not-allowed"
        : "focus:ring-[#e74c3c]/40 border-gray-300"
    }`}
  />
  {isRegistered && (
    <p className="text-xs text-gray-500 mt-1">
      Email cannot be changed for registered users.
    </p>
  )}
</div>

              {/* Guest Name - editable always */}
              <div>
                <label className="block font-medium text-gray-700">Guest Name</label>
                <input
                  name="guest_name"
                  value={formData.guest_name || ""}
                  onChange={handleChange}
                  disabled={false}
                  className={`w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.guest_name ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#e74c3c]/40"
                  }`}
                />
                {errors.guest_name && <p className="text-xs text-red-500 mt-1">{errors.guest_name}</p>}
              </div>

              {/* Company Name - editable always */}
              <div>
                <label className="block font-medium text-gray-700">Company Name</label>
                <input
                  name="company_name"
                  value={formData.company_name || ""}
                  onChange={handleChange}
                  disabled={false}
                  className={`w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.company_name ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#e74c3c]/40"
                  }`}
                />
                {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
              </div>

              {/* Ticket Type - dropdown if not registered, readonly text if registered */}
              <div>
                <label className="block font-medium text-gray-700">Ticket Type</label>
                {isRegistered ? (
                  <input
                    type="text"
                    value={formData.ticket_type || ""}
                    disabled
                    className="w-full mt-1 border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <select
                    name="ticket_type"
                    value={formData.ticket_type || ""}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#e74c3c]/40"
                  >
                    <option value="">-- Select Ticket Type --</option>
                    {tickets.map((t) => {
                      // try support different shapes
                      const name = t.name ?? t.title ?? String(t);
                      const id = t.id ?? t.pk ?? name;
                      // we keep option value as name (for backwards compat), but if you prefer id, switch to value={id}
                      return (
                        <option key={id} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Expire Date - editable only if not registered */}
              <div>
                <label className="block font-medium text-gray-700">Expire Date</label>
                <input
                  type="date"
                  name="expire_date"
                  min={today}
                  value={formData.expire_date || ""}
                  onChange={handleChange}
                  disabled={isRegistered}
                  className={`w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.expire_date ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-[#e74c3c]/40"
                  } ${isRegistered ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                {errors.expire_date && <p className="text-xs text-red-500 mt-1">{errors.expire_date}</p>}
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end gap-2 border-t mt-5">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-[#e74c3c] text-white hover:bg-red-600 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkPersonalLinkEditModal;
