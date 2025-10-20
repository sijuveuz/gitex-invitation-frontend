import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { format } from "date-fns";

const InviteRegister = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    company_name: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const API_URL = process.env.REACT_APP_API_URL;
  // Fetch invite details on load
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/invitations/link/${uuid}/`
        );
        setInviteData(res.data);
      } catch (err) {
        setError("Invalid or expired invitation link.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [uuid]);

  // Field validation
  const validateField = (name, value) => {
    switch (name) {
      case 'guest_name':
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 2) return "Full name must be at least 2 characters.";
        if (!/^[A-Za-z\s]+$/.test(value.trim())) return "Full name can only contain letters and spaces.";
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

  // Handle change in form fields with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    const error = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
    // Clear general error on input
    if (generalError) setGeneralError(null);
  };

  // Full form validation
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    return newErrors;
  };

  // Handle registration submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...validationErrors }));
      return;
    }

    setFieldErrors({});
    setGeneralError(null);
    setSubmitLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/invitations/register-from-link/`,
        {
          ...formData,
          link_code: uuid, // 🔹 include the UUID here
        }
      );
  
      MySwal.fire("🎉 Registered!", "You’ve successfully registered!", "success");
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setGeneralError(detail || "Registration failed.");
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Loading state
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading invitation...
      </div>
    );

  // Error state
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600 text-lg font-semibold">
        ⚠️ {error}
      </div>
    );

  const today = new Date();
  const expiryDate = new Date(inviteData.expire_date);
  expiryDate.setHours(23, 59, 59, 999);
  
  const isExpired = today > expiryDate;
  const isLimitReached = inviteData.usage_count >= inviteData.link_limit;

  return (
    <div className="flex min-h-screen bg-gray-50 justify-center items-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-center text-indigo-700 mb-4">
          🎟️ GITEX Registration
        </h2>

        <div className="text-center mb-6">
          <p className="text-gray-700 text-lg font-medium">
            Ticket Type:{" "}
            <span className="font-semibold text-indigo-600">
              {inviteData.ticket_type?.name}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Expires on:{" "}
            {format(new Date(inviteData.expire_date), "PPP")}
          </p>
          <p className="text-sm text-gray-500">
            Usage: {inviteData.usage_count}/{inviteData.link_limit}
          </p>
        </div>

        {/* Expired or Limit Reached or Active */}
        {isLimitReached || isExpired ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-center mb-4">
            ⚠️ This invitation link {isLimitReached ? "has reached its usage limit" : "has expired"}. No more registrations allowed.
          </div>
        ) : (
          <>
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md mb-4">
                {generalError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleChange}
                  required
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.guest_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.guest_name && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.guest_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="guest_email"
                  value={formData.guest_email}
                  onChange={handleChange}
                  required
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.guest_email ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.guest_email && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.guest_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.company_name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.company_name && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.company_name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white w-full py-2 rounded-md font-semibold transition-all"
              >
                {submitLoading ? "Registering..." : "Register Now"}
              </button>
            </form>
          </>
        )}

        <p className="text-center mt-6 text-xs text-gray-400">
          Invitation ID: <span className="font-mono">{uuid}</span>
        </p>
      </div>
    </div>
  );
};

export default InviteRegister;