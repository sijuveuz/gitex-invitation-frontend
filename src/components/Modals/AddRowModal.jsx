import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import Select from "react-select";
import axios from "axios";
import { MdAdd, MdClose, MdSend } from "react-icons/md";
import Swal from "sweetalert2";

// ✅ This line ensures React-Modal attaches to the app root properly
Modal.setAppElement("#root");

const API_URL = process.env.REACT_APP_API_URL;

const AddRowModal = ({ isOpen, onClose, jobId, onRowAdded }) => {
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    ticket_type: "",
    company: "",
    personal_message: "",
  });

  const [errors, setErrors] = useState({});
  const [ticketOptions, setTicketOptions] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const token = localStorage.getItem("token");
  // ✅ Fetch tickets on open
  useEffect(() => {
    if (!isOpen) return;
    const fetchTickets = async () => {
      try {
        setLoadingTickets(true);
        const res = await axios.get(`${API_URL}/api/invitations/tickets/`,{
            headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
        if (res.data.status === "success") {
          const opts = res.data.data.map((t) => ({
            label: t.name,
            value: t.name,
          }));
          setTicketOptions(opts);
        }
      } catch (err) {
        console.error("Ticket fetch error:", err);
      } finally {
        setLoadingTickets(false);
      }
    };
    fetchTickets();
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);
  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle select
  const handleSelect = (selected) => {
    setFormData((prev) => ({ ...prev, ticket_type: selected?.value || "" }));
  };

  // ✅ Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.guest_name.trim()) newErrors.guest_name = "Guest name is required.";
    if (!formData.guest_email.trim()) newErrors.guest_email = "Guest email is required.";
    if (!formData.ticket_type) newErrors.ticket_type = "Ticket type is required.";
    return newErrors;
  };

  // ✅ Submit
  // ✅ Submit
const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validate();
  if (Object.keys(validationErrors).length) {
    setErrors(validationErrors);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/api/invitations/bulk/${jobId}/rows/add/`,
      formData,
      { headers: { Authorization: token ? `Bearer ${token}` : "" } }
    );

    if (res.data.status === "success") {
      Swal.fire("Added!", res.data.message, "success");
      onRowAdded(res.data.data, res.data.stats);
      onClose();
      setFormData({
        guest_name: "",
        guest_email: "",
        ticket_type: "",
        company: "",
        personal_message: "",
      });
      setErrors({});
    } else {
      // ✅ Backend returned an error response (rare, but just in case)
      setErrors(res.data.errors || { general: res.data.message || "Unknown error" });
    }
  } catch (err) {
    console.error("Add row error:", err);
  
    const apiError = err.response?.data || {};
    const fieldErrors = apiError.errors || {};
  
    // ✅ Merge a general message if present
    const newErrors = { ...fieldErrors };
    if (apiError.message && !fieldErrors.general) {
      newErrors.general = apiError.message;
    }
  
    setErrors(newErrors); // ✅ Show inline
    console.warn("API Error:", apiError);
  }
  
};
const resetForm = () => {
  setFormData({
    guest_name: "",
    guest_email: "",
    ticket_type: "",
    company: "",
    personal_message: "",
  });
  setErrors({});
};


  const renderError = (field) =>
    errors[field] && <div className="text-red-500 text-xs mt-1">{errors[field]}</div>;

  return (
    <Modal
    isOpen={isOpen}
    onRequestClose={() => {
      resetForm();
      onClose();
    }}
      // ✅ Make sure this overlay is above the Bulk modal
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 3000, // 👈 higher than parent modal
        },
        content: {
          position: "relative",
          inset: "unset",
          margin: "auto",
          width: "90%",
          maxWidth: "400px",
          background: "white",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          overflow: "auto",
        },
      }}
      contentLabel="Add Row Modal"
    >
      <h5 className="text-base font-semibold mb-4 flex items-center">
        <MdAdd className="mr-2 text-primary" /> Add New Row
      </h5>

      <form onSubmit={handleSubmit}>
      {errors.general && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
    <i className="fas fa-exclamation-circle mr-1"></i>
    {errors.general}
  </div>
)}

{errors.file_level_duplicate && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
    <i className="fas fa-exclamation-triangle mr-1"></i>
    {errors.file_level_duplicate}
  </div>
)}

        {/* Guest Name */}
        <div className="mb-3">
          <label className="text-sm">Guest Full Name *</label>
          <input
            name="guest_name"
            value={formData.guest_name}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${
              errors.guest_name ? "border-red-500" : ""
            }`}
          />
          {renderError("guest_name")}
        </div>

        {/* Guest Email */}
        <div className="mb-3">
          <label className="text-sm">Guest Email *</label>
          <input
            type="email"
            name="guest_email"
            value={formData.guest_email}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${
              errors.guest_email ? "border-red-500" : ""
            }`}
          />
          {renderError("guest_email")}
        </div>

        {/* Ticket Type */}
        <div className="mb-3">
          <label className="text-sm">Ticket Type *</label>
          <Select
            options={ticketOptions}
            value={ticketOptions.find(
              (opt) => opt.value === formData.ticket_type
            ) || null}
            onChange={handleSelect}
            isLoading={loadingTickets}
            placeholder="Select ticket type"
          />
          {renderError("ticket_type")}
        </div>

        {/* Company */}
        <div className="mb-3">
          <label className="text-sm">Company</label>
          <input
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Personal Message */}
        <div className="mb-3">
          <label className="text-sm">Personal Message</label>
          <textarea
            name="personal_message"
            value={formData.personal_message}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            rows="3"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
        <button
  type="button"
  onClick={() => {
    resetForm();
    onClose();
  }}
  className="bg-gray-500 text-white px-4 py-2 rounded flex items-center"
>
  <MdClose className="mr-1" /> Cancel
</button>

          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded flex items-center"
          >
            <MdSend className="mr-1" /> Add Row
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRowModal;
