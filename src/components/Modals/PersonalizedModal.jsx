import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import Select from "react-select";
import { MdSend, MdClose, MdEmail } from "react-icons/md";

const API_URL = process.env.REACT_APP_API_URL;

const PersonalizedModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    guest_email: "",
    ticketType: null,
    company: "",
    message: "",
    expireDate: "",
  });

  const [errors, setErrors] = useState({});
  const [ticketOptions, setTicketOptions] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({  
        name: "",
        guest_email: "",
        ticketType: null,
        company: "", 
        message: "",
        expireDate: "",
      });
      setErrors({});
    }
  }, [isOpen]);
 
  
  // ✅ Fetch ticket types
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoadingTickets(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/invitations/tickets/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          // ✅ Store id as value (not name)
          const options = data.data.map((t) => ({
            value: t.id,
            label: t.name,
          }));
          setTicketOptions(options);
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoadingTickets(false);
      }
    };
    if (isOpen) fetchTickets();
  }, [isOpen]); 

  // ✅ Field validation
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return "Name is required.";
        if (value.trim().length < 2) return "Name must be at least 2 characters.";
        if (!/^[A-Za-z\s]+$/.test(value.trim())) return "Name can only contain letters and spaces.";
        return '';
      case 'guest_email':
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
        return '';
      case 'ticketType':
        if (!value) return "Select a ticket type.";
        return '';
      case 'company':
        if (value && value.trim().length < 2) return "Company name must be at least 2 characters.";
        return '';
      case 'expireDate':
        if (!value) return "Please select an expiry date.";
        const today = new Date().toISOString().split("T")[0];
        if (value <= today) return "Please select a future date.";
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
  };

  const handleSelect = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : null;
    setFormData((prev) => ({ ...prev, ticketType: value }));
    const error = validateField('ticketType', value);
    setErrors((prev) => ({
      ...prev,
      ticketType: error,
    }));
  }; 
  

  // ✅ Full validation on submit
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'message') {
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
    const result = await onSubmit(formData);
    if (result?.status === "error") {
      setErrors({ general: result.message || "Something went wrong." });
    } else if (result?.status === "success") {
      onClose(); // ✅ auto-close from inside modal 
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
        <MdEmail className="mr-2 text-primary" /> Send Personalized Invitation
      </h5>

      {errors.general && (
        <div className="bg-red-100 text-red-700 p-2 mb-3 rounded text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="mb-3">
          <label className="text-sm">Guest Full Name *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${
              errors.name ? "border-red-500" : ""
            }`}
          />
          {renderError("name")}
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

        {/* Ticket type */}
        <div className="mb-3">
          <label className="text-sm">Ticket Type *</label>
          <Select
            options={ticketOptions}
            value={
              ticketOptions.find((opt) => opt.value === formData.ticketType) || null
            }
            onChange={handleSelect}
            isLoading={loadingTickets}
            placeholder="Select ticket type"
          /> 
          {renderError("ticketType")}
        </div>

        {/* Company */}
        <div className="mb-3">
          <label className="text-sm">Company Name</label>
          <input
            name="company"
            value={formData.company}
            onChange={handleChange}
            className={`border p-2 w-full rounded ${
              errors.company ? "border-red-500" : ""
            }`}
          />
          {renderError("company")}
        </div>

        {/* Message */}
        <div className="mb-3">
          <label className="text-sm">Personal Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            rows="3"
          />
        </div>

        {/* Expiry */}
        <div className="mb-3 relative">
          <label className="text-sm">Expire Date *</label>
          <input
            type="date"
            name="expireDate"
            min={new Date().toISOString().split("T")[0]} // ✅ blocks past dates
            value={formData.expireDate}
            onChange={handleChange}
            title="Select a future date" // ✅ hover message
            className={`border p-2 w-full rounded cursor-pointer ${ 
              errors.expireDate ? "border-red-500" : ""
            }`}
          />
          {renderError("expireDate")}
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
            className="bg-primary text-white px-4 py-2 rounded flex items-center"
          >
            <MdSend className="mr-1" /> Send
          </button>
        </div>
      </form>
    </Modal> 
  );
};

export default PersonalizedModal;

