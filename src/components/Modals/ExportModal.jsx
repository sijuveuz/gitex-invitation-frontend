import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MdDownload, MdClose } from "react-icons/md";

const ExportModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("");
  const API_URL = process.env.REACT_APP_API_URL;
  const handleExport = async () => {
    if (!selectedFormat) {
      Swal.fire({
        icon: "warning",
        title: "Please select a format",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      const response = await axios.post(
        "${API_URL}/api/invitations/exports/request/",
        { format: selectedFormat },
        { headers: { "Content-Type": "application/json" } }
      );

      Swal.fire({
        icon: "success",
        title: "Export Started",
        text: response.data.message,
        confirmButtonColor: "#2563eb",
      });
      setIsOpen(false);
      setSelectedFormat("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: error.response?.data?.error || "An unexpected error occurred.",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <>
      {/* Export Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center bg-gray-600 hover:bg-gray-700 text-white rounded px-3"
        style={{ height: "38px", fontSize: "13px" }}
      >
        <MdDownload className="mr-1" /> Export
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <MdClose size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MdDownload className="mr-2 text-gray-600" /> Export Invitations
            </h2>

            <p className="text-sm text-gray-600 mb-3">Select export format:</p>

            <div className="space-y-2 mb-4">
              {["csv", "xlsx", "pdf"].map((format) => (
                <label
                  key={format}
                  className={`flex items-center border rounded px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    selectedFormat === format ? "border-blue-500" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={selectedFormat === format}
                    onChange={() => setSelectedFormat(format)}
                    className="mr-2"
                  />
                  {format.toUpperCase()}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportModal;

