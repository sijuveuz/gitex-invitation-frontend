// components/Modals/GeneratedLinkEditModal.jsx
import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL;
const GeneratedLinkEditModal = ({ show, id, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    guest_name: "",
    usage_limit: "",
    expire_date: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show || !id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/api/invitations/dash/${id}/`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );

        const d = res.data.data || {};
        setFormData({
          guest_name: d.guest_name || "",
          usage_limit: d.usage_limit || "",
          expire_date: d.expire_date || "",
        });
      } catch (err) {
        console.error(err);
        MySwal.fire("Error", "Failed to load link details", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [show, id]);

  // 🔍 Validation logic
  const validateField = (name, value) => {
    let msg = "";
    if (name === "guest_name") {
      if (!/^[A-Za-z\s]*$/.test(value))
        msg = "Only alphabets and spaces are allowed.";
      else if (value.trim().length < 2)
        msg = "Name must be at least 2 characters.";
    }
    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Final validation before submit
    if (errors.guest_name || !formData.guest_name.trim()) {
      MySwal.fire("Validation Error", "Please fix the form errors.", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/api/invitations/${id}/edit/`,
        {
          guest_name: formData.guest_name,
          expire_date: formData.expire_date,
        },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      console.log("GENERATTED LINK EDIT :", res.data)
      MySwal.fire("Success", "Link updated successfully", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      MySwal.fire("Error", "Failed to update link", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  // 🗓️ Disable past dates
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div
          className="flex justify-between items-center px-5 py-3 border-b text-white"
          style={{ background: "#e74c3c" }}
        >
          <h3 className="text-lg font-semibold tracking-wide">Edit Link</h3>
          <button
            onClick={onClose}
            className="hover:text-gray-200 transition"
            title="Close"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Title */}
              <div>
                <label className="block font-medium text-gray-700">
                  Link Title
                </label>
                <input
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleChange}
                  className={`w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.guest_name
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.guest_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.guest_name}
                  </p>
                )}
              </div>

              {/* Link Limit */}
              <div>
                <label className="block font-medium text-gray-700">
                  Link Limit
                </label>
                <input
                  value={formData.usage_limit ?? ""}
                  disabled
                  className="w-full mt-1 border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="block font-medium text-gray-700">
                  Expire Date
                </label>
                <input
                  type="date"
                  name="expire_date"
                  min={today}
                  value={formData.expire_date || ""}
                  onChange={handleChange}
                  className="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end gap-2 border-t mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded border text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#e74c3c] text-white hover:bg-red-600 disabled:opacity-50"
                >
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

export default GeneratedLinkEditModal;
