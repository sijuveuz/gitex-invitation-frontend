import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { MdSend, MdClose, MdEmail } from "react-icons/md";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

const BroadcastModal = ({ isOpen, onClose, invitationId, onSubmit, onSuccess }) => {
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    company_name: "",
    personal_message: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({  
        guest_name: "",
        guest_email: "",
        company_name: "",
        personal_message: "",
      });
      setErrors({});
      setGeneralError(null);
    }
  }, [isOpen]);

  // ✅ Field validation
  const validateField = (name, value) => {
    switch (name) {
      case 'guest_name':
        if (!value.trim()) return "Guest name is required.";
        if (value.trim().length < 2) return "Guest name must be at least 2 characters.";
        if (!/^[A-Za-z\s]+$/.test(value.trim())) return "Guest name can only contain letters and spaces.";
        return '';
      case 'guest_email':
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
        return '';
      case 'company_name':
        if (value && value.trim().length < 2) return "Company name must be at least 2 characters.";
        return '';
      default:
        return '';
    }
  };

  // ✅ Input handlers with onChange validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
    // Clear general error on input
    if (generalError) setGeneralError(null);
  };

  // ✅ Full validation on submit
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'personal_message') { // Skip message validation
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    return newErrors;
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));
      return;
    }
  
    setErrors({});
    setGeneralError(null);
    setLoading(true);
    const result = await onSubmit(formData);
    setLoading(false);
    if (result?.status === "error") {
      setGeneralError(result.message || "Something went wrong.");
    } else if (result?.status === "success") {
      onSuccess();
    }
  };
  

  // ✅ Helper for rendering errors
  const renderError = (field) =>
    errors[field] ? (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white p-6 rounded shadow max-w-md mx-auto mt-20 w-[90%] sm:w-[400px]"
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <h5 className="text-base font-semibold mb-4 flex items-center">
        <MdEmail className="mr-2 text-primary" /> Broadcast Invitation
      </h5>

      {generalError && (
        <div className="bg-red-100 text-red-700 p-2 mb-3 rounded text-sm">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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

        {/* Email */}
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

        {/* Company */}
        <div className="mb-3">
          <label className="text-sm">Company Name</label>
          <input
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${
              errors.company_name ? "border-red-500" : ""
            }`}
          />
          {renderError("company_name")}
        </div>

        {/* Message */}
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

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded flex items-center"
          >
            <MdClose className="mr-1" /> Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            <MdSend className="mr-1" /> {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </Modal> 
  );
};

export default BroadcastModal;