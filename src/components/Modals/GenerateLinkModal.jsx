import axios from "axios";
import React, { useState, useEffect } from "react";
import { MdClose, MdLink } from "react-icons/md";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const API_URL = process.env.REACT_APP_API_URL;

const MySwal = withReactContent(Swal);
const GenerateLinkModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    linkTitle: "",
    expire_date: "",
    usage_limit: 1,
    ticketType: "",
    links_needed: 1,
  });

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch ticket types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      setErrors({}); // Clear errors on open
    }
  }, [isOpen]);
  // Fetch tickets from backend
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/invitations/tickets/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.status === "success") {
        setTickets(res.data.data);
        if (res.data.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            ticketType: res.data.data[0].id,
          }));
        }
      } else {
        MySwal.fire("Error", "Failed to load ticket types.", "error");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      MySwal.fire("Error", "Something went wrong while fetching tickets.", "error");
    } finally {
      setLoadingTickets(false);
    }
  };

  // Validation functions
  const validateLinkTitle = (value) => {
    if (!value.trim()) return "Link title is required.";
    const trimmed = value.trim();
    if (trimmed.length < 3) return "Link title must be at least 3 characters.";
    if (!/[a-zA-Z]/.test(trimmed)) return "Link title must contain at least 2 alphabetic characters.";
    // if (!/\d/.test(trimmed)) return "Link title must contain at least one number.";
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) return "Link title can only contain letters, numbers, and spaces.";
    return "";
  };

  const validateExpireDate = (value) => {
    if (!value) return "Expiry date is required.";
    const today = new Date().toISOString().split("T")[0];
    if (value < today) return "Expiry date must be in the future.";
    return "";
  };

  const validateLinksNeeded = (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return "Links needed must be at least 1.";
    if (num > 1000) return "Links needed cannot exceed 1000.";
    return "";
  };

  const validateUsageLimit = (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) return "Usage limit must be at least 1.";
    if (num > 100) return "Usage limit cannot exceed 100.";
    return "";
  };

  const validateTicketType = (value) => {
    if (!value) return "Please select a ticket type.";
    return "";
  };

  // Handle input changes with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate on change
    let error = "";
    switch (name) {
      case "linkTitle":
        error = validateLinkTitle(value);
        break;
      case "expire_date":
        error = validateExpireDate(value);
        break;
      case "links_needed":
        error = validateLinksNeeded(value);
        break;
      case "usage_limit":
        error = validateUsageLimit(value);
        break;
      case "ticketType":
        error = validateTicketType(value);
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Check if form is valid (no errors)
  const isFormValid = () => {
    return Object.values(errors).every((error) => !error);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    const linkTitleError = validateLinkTitle(formData.linkTitle);
    const expireDateError = validateExpireDate(formData.expire_date);
    const linksNeededError = validateLinksNeeded(formData.links_needed);
    const usageLimitError = validateUsageLimit(formData.usage_limit);
    const ticketTypeError = validateTicketType(formData.ticketType);

    setErrors({
      linkTitle: linkTitleError,
      expire_date: expireDateError,
      links_needed: linksNeededError,
      usage_limit: usageLimitError,
      ticketType: ticketTypeError,
    });

    if (!isFormValid()) {
      return MySwal.fire("Validation Error", "Please fix the errors below.", "warning");
    }

    const { linkTitle, expire_date, usage_limit, ticketType, links_needed } = formData;

    const token = localStorage.getItem("token");
    if (!token) {
      return MySwal.fire("Error", "You must be logged in to perform this action.", "error");
    }

    try {
      setSubmitting(true);

      const res = await axios.post(
        `${API_URL}/api/invitations/generate-link/`,
        {
          guest_name: linkTitle, // Backend expects guest_name
          expire_date,
          usage_limit,
          ticket_type: ticketType,
          links_needed,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("RES - Generate link",res.data)
      // ✅ Check success using HTTP status
      if (res.status >= 200 && res.status < 300) {
        MySwal.fire("Success", res.data.message || "Invitation link generated successfully!", "success");
        onSubmit?.(res.data);
        onClose();
      } else {
        console.error("Server validation errors:", res.data);
        MySwal.fire("Error", res.data.message || "Failed to generate link.", "error");
      }
    } catch (error) {
      console.error("Error creating link:", error.response || error);
      MySwal.fire(
        "Error",
        error.response?.data?.message || "Something went wrong while generating link.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Generate Invitation Link</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <MdClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Link Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Title</label>
            <input
              type="text"
              name="linkTitle"
              value={formData.linkTitle}
              onChange={handleChange}
              placeholder="Enter link title (min 2 letters + 1 number, no symbols)"
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.linkTitle ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              required
            />
            {errors.linkTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.linkTitle}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <input
              type="date"
              name="expire_date"
              value={formData.expire_date}
              onChange={handleChange}
              min={today}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.expire_date ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              required
            />
            {errors.expire_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expire_date}</p>
            )}
          </div>

          {/* Links Needed */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">How many invitation links do you need?*</label>
            <input
              type="number"
              name="links_needed"
              value={formData.links_needed}
              onChange={handleChange}
              min="1"
              max="1000"
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.links_needed ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              required
            />
            {errors.links_needed && (
              <p className="mt-1 text-sm text-red-600">{errors.links_needed}</p>
            )}
          </div>

          {/* Usage Limit */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">How many times each link can be used? *</label>
            <input
              type="number"
              name="usage_limit"
              value={formData.usage_limit}
              onChange={handleChange}
              min="1"
              max="100"
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.usage_limit ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              required
            />
            {errors.usage_limit && (
              <p className="mt-1 text-sm text-red-600">{errors.usage_limit}</p>
            )}
          </div>

          {/* Ticket Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Type</label>
            <select
              name="ticketType"
              value={formData.ticketType}
              onChange={handleChange}
              disabled={loadingTickets}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.ticketType ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
            >
              {loadingTickets ? (
                <option>Loading...</option>
              ) : tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.name}
                  </option>
                ))
              ) : (
                <option>No tickets available</option>
              )}
            </select>
            {errors.ticketType && (
              <p className="mt-1 text-sm text-red-600">{errors.ticketType}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                submitting || !isFormValid() 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <MdLink size={16} />
              {submitting ? "Generating..." : "Generate Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateLinkModal;