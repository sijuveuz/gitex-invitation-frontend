import React, { useState, useEffect, useRef, useCallback } from "react";
import Select from "react-select";
import { MdSearch, MdDownload, MdClear, MdRefresh  } from "react-icons/md";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL;
const FilterSection = ({ onFilter, onReset }) => {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    expiry_date: "",
    ticket_type: "",
  });
  const [ticketOptions, setTicketOptions] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const timeoutRef = useRef(null);
  const pollingRef = useRef(null);


  const API_BASE = `${API_URL}/api/invitations`;
  const FILE_BASE = `${API_URL}`;

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "pending", label: "Pending" },
  ];

  const typeOptions = [
    { value: "personalized", label: "Personalized" },
    { value: "invitation link", label: "Invitation Link" },
    { value: "bulk upload", label: "Bulk Upload" },
  ];

  // ✅ Fetch ticket types
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${API_BASE}/tickets/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const opts = res.data.data.map((t) => ({
          value: t.id,
          label: t.name,
        }));
        setTicketOptions(opts);
      })
      .catch((err) => console.error("Failed to load ticket types", err));
  }, []);

  // ✅ Apply filters with debounce
  const applyFilters = useCallback(
    (currentFilters) => {
      const cleanFilters = {
        search: currentFilters.search.trim() || undefined,
        status: currentFilters.status || undefined,
        type: currentFilters.type || undefined,
        expiry_date: currentFilters.expiry_date || undefined,
        ticket_type: currentFilters.ticket_type || undefined,
      };

      const hasOtherFilters = Object.entries(cleanFilters).some(
        ([key, value]) =>
          key !== "search" && value && value !== undefined && value !== ""
      );
      if (cleanFilters.search?.length < 2 && !hasOtherFilters) {
        setHasActiveFilters(false);
        return;
      }

      const isActive = Object.values(cleanFilters).some(
        (v) => v && v !== undefined && v !== ""
      );
      setHasActiveFilters(isActive);
      onFilter(cleanFilters);
    },
    [onFilter]
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => applyFilters(filters), 500);
    return () => clearTimeout(timeoutRef.current);
  }, [filters, applyFilters]);

  const handleChange = (name, value) =>
    setFilters((prev) => ({ ...prev, [name]: value }));

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      type: "",
      expiry_date: "",
      ticket_type: "",
    });
    setHasActiveFilters(false);
    onReset();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    applyFilters(filters);
  };

  // ✅ EXPORT HANDLER (Full Logic)
  
  const handleExportClick = () => {
    MySwal.fire({
      title: "Export Invitations",
      html: `
        <p style="font-size:14px; margin-bottom:10px;">Choose your export format:</p>
        <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
          <button id="csvExport" class="swal2-confirm swal2-styled" style="background:#2563eb; width:120px;">CSV</button>
          <button id="xlsxExport" class="swal2-confirm swal2-styled" style="background:#059669; width:120px;">Excel</button>
          <button id="pdfExport" class="swal2-confirm swal2-styled" style="background:#dc2626; width:120px;">PDF</button>
        </div>
      `,
      background: "rgba(255,255,255,0.95)",
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        const triggerExport = async (format) => {
          MySwal.fire({
            title: `Exporting ${format.toUpperCase()}...`,
            text: "Please wait while your file is being prepared.",
            allowOutsideClick: false,
            didOpen: () => MySwal.showLoading(),
          });
  
          try {
            const token = localStorage.getItem("token");
            const { data } = await axios.post(
              `${API_URL}/api/invitations/exports/request/`,
              { format }, // <-- body
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
  
            const jobId = data.job_id;
  
            // 2️⃣ Poll every 500ms
            const pollInterval = setInterval(async () => {
              try {
                const res = await axios.get(
                  `${API_URL}/api/invitations/exports/${jobId}/`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
  
                if (res.data.status === "ready") {
                  clearInterval(pollInterval);
                  MySwal.close();
  
                  const fileUrl = `${API_URL}${res.data.data}`;
  
                  try {
                    const response = await axios.get(fileUrl, {
                      responseType: "blob", // 👈 important
                    });
                  console.log("fileUrl", fileUrl)
                    // create a blob link
                    const blob = new Blob([response.data]);
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = downloadUrl;
                    link.download = fileUrl.split("/").pop(); // file name from URL
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(downloadUrl); // cleanup
                  
                    MySwal.fire(
                      "Export Complete!",
                      `Your ${format.toUpperCase()} file has been downloaded.`,
                      "success"
                    );
                  } catch (downloadErr) {
                    console.error("Download failed:", downloadErr);
                    MySwal.fire("Error", "Download failed. Try again.", "error");
                  }
  
                  MySwal.fire(
                    "Export Complete!",
                    `Your ${format.toUpperCase()} file has been downloaded.`,
                    "success"
                  );
                }
              } catch (pollErr) {
                console.error("Polling error:", pollErr);
              }
            }, 500);
          } catch (err) {
            console.error("Export failed:", err);
            MySwal.fire("Error", "Failed to start export.", "error");
          }
        };
  
        // Bind click handlers
        document.getElementById("csvExport").addEventListener("click", () => triggerExport("csv"));
        document.getElementById("xlsxExport").addEventListener("click", () => triggerExport("xlsx"));
        document.getElementById("pdfExport").addEventListener("click", () => triggerExport("pdf"));
      },
    });
  };
  

  // ✅ Start Export → POST request → poll until ready
  const startExport = async (format) => {
    MySwal.close();
    setIsExporting(true);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.post(
        `${API_BASE}/exports/request/`,
        { format },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { job_id, message } = res.data;
      console.log("Export started:", message);

      // show loading popup
      MySwal.fire({
        title: "Export in progress...",
        html: `<div class="text-gray-500 text-sm">Please wait while we prepare your ${format.toUpperCase()} file.</div>`,
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        },
      });

      // start polling
      pollExportStatus(job_id, format);
    } catch (err) {
      console.error("Export start failed:", err);
      setIsExporting(false);
      Swal.fire("Error", "Failed to start export.", "error");
    }
  };

  // ✅ Poll export status every 500 ms
  const pollExportStatus = (jobId, format) => {
    const token = localStorage.getItem("token");

    const checkStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/exports/${jobId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.status === "ready" && res.data.data) {
          const downloadUrl = FILE_BASE + res.data.data;

          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsExporting(false);
          MySwal.close();

          // trigger browser download
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = downloadUrl.split("/").pop();
          a.click();

          Swal.fire({
            icon: "success",
            title: "Export Ready!",
            html: `<a href="${downloadUrl}" target="_blank" class="text-blue-600 underline">Click here to open</a>`,
            timer: 3000,
          });
        } else if (res.data.status === "failed") {
          clearInterval(pollingRef.current);
          setIsExporting(false);
          Swal.fire("Error", "Export failed.", "error");
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    };

    pollingRef.current = setInterval(checkStatus, 500);
  };

  // ✅ Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <form
      onSubmit={handleManualSubmit}
      className="bg-white p-4 rounded shadow mb-4 filter-section"
      style={{
        borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        padding: "15px",
        marginBottom: "15px",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        {/* Keyword */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Keyword</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            placeholder="Search by name or email (min 2 chars)"
            className="border w-full rounded px-2"
            style={{ fontSize: "13px", height: "38px" }}
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <Select
            options={statusOptions}
            value={
              filters.status
                ? statusOptions.find((opt) => opt.value === filters.status)
                : null
            }
            onChange={(option) => handleChange("status", option?.value || "")}
            placeholder="Select..."
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "38px",
                height: "38px",
                fontSize: "13px",
              }),
            }}
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Type</label>
          <Select
            options={typeOptions}
            value={
              filters.type
                ? typeOptions.find((opt) => opt.value === filters.type)
                : null
            }
            onChange={(option) => handleChange("type", option?.value || "")}
            placeholder="Select..."
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "38px",
                height: "38px",
                fontSize: "13px",
              }),
            }}
          />
        </div>

        {/* Expiry */}
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1 block">Expiry</label>
          <div className="flex items-center">
            <input
              type="date"
              value={filters.expiry_date || ""}
              onChange={(e) => handleChange("expiry_date", e.target.value)}
              className="border w-full rounded px-2"
              style={{ fontSize: "13px", height: "38px" }}
            />
            {filters.expiry_date && (
              <button
                type="button"
                onClick={() => handleChange("expiry_date", "")}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Ticket Type */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ticket</label>
          <Select
            options={ticketOptions}
            value={
              filters.ticket_type
                ? ticketOptions.find(
                    (opt) => opt.value === filters.ticket_type
                  )
                : null
            }
            onChange={(option) =>
              handleChange("ticket_type", option?.value || "")
            }
            placeholder="Select..."
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "38px",
                height: "38px",
                fontSize: "13px",
              }),
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2 justify-end md:justify-start">
          <button
            type="submit"
            className="hidden md:flex items-center justify-center bg-primary text-white rounded"
            style={{
              height: "38px",
              fontSize: "13px",
              padding: "0 12px",
              lineHeight: "1",
            }}
          >
            <MdSearch className="mr-1 text-sm" /> Search
          </button>

          <button
            type="button"
            onClick={handleExportClick}
            disabled={isExporting}
            className={`flex items-center rounded px-3 text-white ${
              isExporting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            style={{ height: "38px", fontSize: "13px" }}
          >
            <MdDownload className={`mr-1 ${isExporting ? "animate-pulse" : ""}`} />
            {isExporting ? "Exporting..." : " "}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center bg-red-500 text-white rounded px-3"
              style={{ height: "38px", fontSize: "13px" }}
            >
              <MdRefresh className="mr-1" size={14} />
            </button>
          )}


        </div>
      </div>
    </form>
  );
};

export default FilterSection;

























// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import Select from 'react-select';
// import { MdSearch, MdRefresh, MdDownload, MdClear, MdClose } from 'react-icons/md';
// import axios from 'axios';

// const FilterSection = ({ onFilter, onReset, onExport }) => {
//   const [filters, setFilters] = useState({
//     search: "",
//     status: "",
//     type: "",
//     expiry_date: "",
//     ticket_type: "",
//   });

//   const [isExportModalOpen, setIsExportModalOpen] = useState(false);
//   const openExportModal = () => setIsExportModalOpen(true);
//   const closeExportModal = () => setIsExportModalOpen(false);

//   const [ticketOptions, setTicketOptions] = useState([]);
//   const [hasActiveFilters, setHasActiveFilters] = useState(false);
//   const timeoutRef = useRef(null);

//   const statusOptions = [
//     { value: "active", label: "Active" },
//     { value: "expired", label: "Expired" },
//     { value: "pending", label: "Pending" },
//   ];

//   const typeOptions = [
//     { value: "personalized", label: "Personalized" },
//     { value: "invitation link", label: "Invitation Link" },
//     { value: "bulk upload", label: "Bulk Upload" },
//   ];

//   // ✅ Fetch ticket types from API with auth
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (!token) return; // Skip if no token

//     axios
//       .get("${API_URL}/api/invitations/tickets/", {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => {
//         const opts = res.data.data.map((t) => ({
//           value: t.id,
//           label: t.name,
//         }));
//         setTicketOptions(opts);
//       })
//       .catch((err) => console.error("Failed to load ticket types", err));
//   }, []);

//   // ✅ Debounced filter application
//   const applyFilters = useCallback((currentFilters) => {
//     const cleanFilters = {
//       search: currentFilters.search.trim() || undefined,
//       status: currentFilters.status || undefined,
//       type: currentFilters.type || undefined,
//       expiry_date: currentFilters.expiry_date || undefined,
//       ticket_type: currentFilters.ticket_type || undefined,
//     };
//     // Skip if search < 2 chars AND no other filters are set
//     const hasOtherFilters = Object.entries(cleanFilters).some(([key, value]) => 
//       key !== 'search' && value && value !== undefined && value !== ''
//     );
//     if (cleanFilters.search?.length < 2 && !hasOtherFilters) {
//       setHasActiveFilters(false);
//       return;
//     }
//     // Check if active filters
//     const isActive = Object.values(cleanFilters).some(v => v && v !== undefined && v !== '');
//     setHasActiveFilters(isActive);
//     onFilter(cleanFilters);
//   }, [onFilter]);

//   // ✅ Auto-apply filters on change with debounce
//   useEffect(() => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     timeoutRef.current = setTimeout(() => {
//       applyFilters(filters);
//     }, 500); // Increased to 500ms to reduce rapid calls

//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//     };
//   }, [filters, applyFilters]);

//   // Handle input changes
//   const handleChange = (name, value) => {
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   // ✅ Reset all filters (clear local and call onReset)
//   const handleResetFilters = () => {
//     const resetFilters = {
//       search: "",
//       status: "",
//       type: "",
//       expiry_date: "",
//       ticket_type: "",
//     };
//     setFilters(resetFilters);
//     setHasActiveFilters(false);
//     onReset();
//   };

//   // ✅ Manual search (Enter key or button)
//   const handleManualSubmit = (e) => {
//     e.preventDefault();
//     applyFilters(filters);
//   };

//   // ✅ Trigger export (from modal confirm)
//   const handleExportConfirm = (format) => {
//     closeExportModal();
//     if (onExport) {
//       onExport(format);
//     }
//   };

//   return (
//     <>
//       <form
//         onSubmit={handleManualSubmit}
//         className="bg-white p-4 rounded shadow mb-4 filter-section"
//         style={{
//           borderRadius: "6px",
//           boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
//           padding: "15px",
//           marginBottom: "15px",
//         }}
//       >
//         <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
//           {/* Keyword */}
//           <div>
//             <label className="text-xs text-gray-500 mb-1 block">Keyword</label>
//             <input
//               type="text"
//               value={filters.search}
//               onChange={(e) => handleChange("search", e.target.value)}
//               placeholder="Search by name or email (min 2 chars)"
//               className="border w-full rounded px-2"
//               style={{ fontSize: "13px", height: "38px" }}
//             />
//           </div>

//           {/* Status */}
//           <div>
//             <label className="text-xs text-gray-500 mb-1 block">Status</label>
//             <div className="react-select-container">
//               <Select
//                 options={statusOptions}
//                 value={
//                   filters.status
//                     ? statusOptions.find((opt) => opt.value === filters.status)
//                     : null
//                 }
//                 onChange={(option) => handleChange("status", option?.value || "")}
//                 placeholder="Select..."
//                 isClearable
//                 styles={{
//                   control: (base) => ({
//                     ...base,
//                     minHeight: "38px",
//                     height: "38px",
//                     fontSize: "13px",
//                   }),
//                 }}
//               />
//             </div>
//           </div>

//           {/* Type */}
//           <div>
//             <label className="text-xs text-gray-500 mb-1 block">Type</label>
//             <Select
//               options={typeOptions}
//               value={
//                 filters.type
//                   ? typeOptions.find((opt) => opt.value === filters.type)
//                   : null
//               }
//               onChange={(option) => handleChange("type", option?.value || "")}
//               placeholder="Select..."
//               isClearable
//               styles={{
//                 control: (base) => ({
//                   ...base,
//                   minHeight: "38px",
//                   height: "38px",
//                   fontSize: "13px",
//                 }),
//               }}
//             />
//           </div>

//           {/* Expiry */}
//           <div className="relative">
//             <label className="text-xs text-gray-500 mb-1 block">Expiry</label>
//             <div className="flex items-center">
//               <input
//                 type="date"
//                 value={filters.expiry_date || ""}
//                 onChange={(e) => handleChange("expiry_date", e.target.value)}
//                 className="border w-full rounded px-2"
//                 style={{ fontSize: "13px", height: "38px" }}
//               />
//               {filters.expiry_date && (
//                 <button
//                   type="button"
//                   onClick={() => handleChange("expiry_date", "")}
//                   className="absolute right-3 text-gray-400 hover:text-gray-600"
//                   style={{ top: "50%", transform: "translateY(-50%)" }}
//                 >
//                   ×
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Ticket Type */}
//           <div>
//             <label className="text-xs text-gray-500 mb-1 block">Ticket</label>
//             <Select
//               options={ticketOptions}
//               value={
//                 filters.ticket_type
//                   ? ticketOptions.find((opt) => opt.value === filters.ticket_type)
//                   : null
//               }
//               onChange={(option) => handleChange("ticket_type", option?.value || "")}
//               placeholder="Select..."
//               isClearable
//               styles={{
//                 control: (base) => ({
//                   ...base,
//                   minHeight: "38px",
//                   height: "38px",
//                   fontSize: "13px",
//                 }),
//               }}
//             />
//           </div>

//           {/* Buttons */}
//           <div className="flex items-end gap-2 justify-end md:justify-start">
//             <button
//               type="submit"
//               className="hidden md:flex items-center justify-center bg-primary text-white rounded"
//               style={{
//                 height: "38px",
//                 fontSize: "13px",
//                 padding: "0 12px",
//                 lineHeight: "1",
//               }}
//             >
//               <MdSearch className="mr-1 text-sm" /> Search
//             </button>

//             {hasActiveFilters && (
//               <button
//                 type="button"
//                 onClick={handleResetFilters}
//                 className="flex items-center bg-red-500 text-white rounded px-3"
//                 style={{ height: "38px", fontSize: "13px" }}
//                 title="Clear Filters"
//               >
//                 <MdClear className="mr-1" size={14} /> Clear
//               </button>
//             )}

//             <button
//               type="button"
//               onClick={openExportModal} // 👈 open modal here
//               className="flex items-center bg-gray-600 hover:bg-gray-700 text-white rounded px-3"
//               style={{ height: "38px", fontSize: "13px" }}
//             >
//               <MdDownload className="mr-1" /> Export
//             </button>
//           </div>
//         </div>
//       </form>

//       {/* ✅ Inline Modal Component */}
//       {isExportModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
//             <button
//               onClick={closeExportModal}
//               className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
//             >
//               <MdClose size={18} />
//             </button>
//             <h2 className="text-lg font-semibold mb-3">Export Invitations</h2>
//             <p className="text-sm text-gray-500 mb-4">
//               Choose a format to export your data:
//             </p>
//             <div className="flex justify-between gap-2">
//               <button
//                 onClick={() => handleExportConfirm("csv")}
//                 className="flex-1 bg-primary text-white py-2 rounded text-sm hover:bg-blue-700"
//               >
//                 CSV
//               </button>
//               <button
//                 onClick={() => handleExportConfirm("xlsx")}
//                 className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700"
//               >
//                 Excel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default FilterSection;
