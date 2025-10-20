import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Papa from "papaparse";
import Swal from "sweetalert2";
import { MdAdd, MdClose, MdSend } from "react-icons/md";
import withReactContent from "sweetalert2-react-content";
import AddRowModal from "./AddRowModal";
const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL; 
const BulkPersonalizedModal = ({ isOpen, onClose }) => {
  const [defaultMessage, setDefaultMessage] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [editTimeouts, setEditTimeouts] = useState({});
  const [ticketTypes, setTicketTypes] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showValid, setShowValid] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const [filterType, setFilterType] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const pollValidationRef = useRef(null);
  const today = new Date().toISOString().split("T")[0];
  const token = localStorage.getItem("token");
  const [isAddOpen, setIsAddOpen] = useState(false);
  // === Fetch ticket types ===
  useEffect(() => {
    const fetchTicketTypes = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/invitations/tickets/`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        console.log("TICKETS API", res.data);
        if (res.data.status === "success") setTicketTypes(res.data.data);
      } catch (err) {
        console.error("Failed to fetch ticket types", err);
      }
    };
    fetchTicketTypes();
  }, [token]);

  useEffect(() => {
    if (jobId && !validating) {
      fetchRowsWithFilters(1);
    }
  }, [searchTerm, showValid, showInvalid, filterType, jobId, validating]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollValidationRef.current) {
        clearInterval(pollValidationRef.current);
        pollValidationRef.current = null;
      }
    };
  }, []);

  const handleRowAdded = (newRow, newStats) => {
    setRows((prev) => [...prev, newRow]);
    setStats(newStats);
  };

  useEffect(() => {
    return () => {
      if (pollValidation.current) {
        clearInterval(pollValidation.current);
        pollValidation.current = null;
      }
    };
  }, []); // Empty deps: Runs on unmount

  // === Clear All Preview Rows ===
  const handleClearAll = async () => {
    if (!jobId) {
      return MySwal.fire("No Job Found", "Please upload a file first.", "warning");
    }

    // Step 1: Ask for confirmation
    const result = await MySwal.fire({
      title: "Clear All Preview?",
      text: "Do you really want to clear all rows from the preview?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Clear All",
      cancelButtonText: "Cancel",
      focusCancel: true,
    });

    // Step 2: If user cancelled, do nothing
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      // Step 3: Make API call
      const res = await axios.delete(
        `${API_URL}/api/invitations/bulk/${jobId}/rows/clear/`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );

      console.log("CLEAR RESPONSE:", res.data);

      // Step 4: Handle success
      if (res.data.status === "success") {
        setRows([]); // clear all rows
        setStats(res.data.stats || { total_count: 0, valid_count: 0, invalid_count: 0 });

        MySwal.fire("Cleared!", res.data.message || "All preview data cleared.", "success");
      } else {
        MySwal.fire("Error", res.data.message || "Failed to clear preview data.", "error");
      }
    } catch (err) {
      console.error("Clear error:", err);
      MySwal.fire("Error", "Something went wrong while clearing preview data.", "error");
    }
  };

  // === Fetch rows for given page ===
  const fetchRowsWithFilters = async (pageNumber = 1) => {
    if (!jobId) return;
  
    // Build dynamic query params
    const params = new URLSearchParams();
    params.append("page", pageNumber);
  
    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }
  
    let statusFilter = null;
    if (showValid && !showInvalid) {
      statusFilter = "valid";
    } else if (!showValid && showInvalid) {
      statusFilter = "invalid";
    }
    if (statusFilter) {
      params.append("status", statusFilter);
    }
  
    if (filterType) {
      params.append("ticket_type", filterType);
    }
  
    const url = `${API_URL}/api/invitations/bulk/${jobId}/rows/?${params.toString()}`;
  
    try {
      const res = await axios.get(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      console.log("FILTERED PREVIEW", res.data);
      if (res.data.status === "success") {
        const { data: rows, stats, pagination, job_status } = res.data; // Correct destructuring
        setRows(rows || []); // Ensure rows is always an array
        setStats(stats || {});
        setPage(pagination?.current_page || 1);
        setPageSize(pagination?.per_page || 50);
        setTotalPages(pagination?.total_pages || 1);
        if (job_status === "done") setValidating(false);
      }
    } catch (err) {
      console.error("Error fetching filtered rows:", err);
      MySwal.fire("Error", "Failed to load filtered data", "error");
      setRows([]); // Fallback to empty array to prevent undefined
    }
  };
  // Poll validation status
  const pollValidation = (newJobId) => {
    setValidating(true);
    pollValidationRef.current = setInterval(async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/invitations/bulk/${newJobId}/rows/?page=1`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        console.log("POLLING RESPONSE:", res.data);
        if (res.data.status === "success") {
          const { data: rows, stats, pagination, job_status } = res.data;
          setRows(rows || []);
          setStats(stats || {});
          setPage(pagination?.current_page || 1);
          setPageSize(pagination?.per_page || 50);
          setTotalPages(pagination?.total_pages || 1);
          if (job_status === "done") {
            clearInterval(pollValidationRef.current);
            pollValidationRef.current = null;
            setValidating(false);
            MySwal.fire("Validation Complete", "Data ready to review", "success");
            fetchRowsWithFilters(1); // Apply filters after validation
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };


  // === Handle pagination click ===
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchRowsWithFilters(newPage); // Now includes current filters
  };

  // === Expiry date ===
  const handleExpireDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate < today) {
      MySwal.fire("Invalid Date", "Please choose a future date", "warning");
      setExpireDate("");
    } else {
      setExpireDate(selectedDate);
    }
  };

  // === Render Ticket Type Select ===
  // Render ticket type cell
  const renderTicketTypeCell = (r) => {
    const errorMsg = r.errors?.ticket_type;
    const currentValue = (() => {
      const backendVal = (r.ticket_type || "").toLowerCase();
      const matched = ticketTypes.find((t) => t.name.toLowerCase() === backendVal);
      return matched ? matched.name : "";
    })();
    return (
      <td>
        <select
          className={`form-select form-select-sm ${errorMsg ? "is-invalid" : ""}`}
          value={currentValue}
          onChange={(e) => handleCellChange(r.id, "ticket_type", e.target.value)}
        >
          <option value="">Select...</option>
          {ticketTypes.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
        {errorMsg && <div className="invalid-feedback small">{errorMsg}</div>}
      </td>
    );
  };

  const handleDeleteRow = async (jobId, rowId) => {
    const confirm = await Swal.fire({
      title: "Delete Row?",
      text: `Remove row #${rowId}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.delete(
        `${API_URL}/api/invitations/bulk/${jobId}/delete/row/${rowId}/`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      if (res.data.status === "success") {
        setRows((prev) => prev.filter((r) => r.id !== rowId));
        setStats(res.data.stats || {});
        Swal.fire("Deleted!", res.data.message, "success");
        fetchRowsWithFilters(page);
      } else {
        Swal.fire("Error", res.data.message || "Failed to delete row.", "error");
      }
    } catch (err) {
      console.error("Delete row error:", err);
      Swal.fire("Error", "Something went wrong while deleting.", "error");
    }
  };
  // === Upload CSV ===
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return MySwal.fire("Error", "File too large (max 5MB)", "error");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("default_personal_message", defaultMessage);
    fd.append("expire_date", expireDate);

    try {
      setUploading(true);
      const res = await axios.post(
        `${API_URL}/api/invitations/bulk/upload/`,
        fd,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data.status === "success") {
        const newJobId = res.data.data.job_id;
        setJobId(newJobId);
        pollValidation(newJobId);
        MySwal.fire("Upload Successful", "Validation started", "info");
      } else {
        MySwal.fire("Error", res.data.message || "Upload failed", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      MySwal.fire("Error", "Failed to upload CSV file", "error");
    } finally {
      setUploading(false);
    }
  };

  // === Edit cell inline ===
  const handleCellChange = (rowId, field, value) => {
    const updatedRows = rows.map((r) =>
      r.id === rowId ? { ...r, [field]: value } : r
    );
    setRows(updatedRows);
    if (editTimeouts[rowId]) clearTimeout(editTimeouts[rowId]);
    const timeout = setTimeout(async () => {
      try {
        console.log("Sending Patch Data:", { field, value, jobId, rowId });
        const res = await axios.patch(
          `${API_URL}/api/invitations/bulk/${jobId}/row/${rowId}/`,
          { [field]: value },
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        console.log("PREVIEW", res.data);
        if (res.data.status === "success") {
          const updated = res.data.data;
          const newStats = res.data.stats;
          setRows((prev) =>
            prev.map((r) => (r.id === rowId ? updated : r))
          );
          if (newStats) setStats(newStats);
        }
      } catch (err) {
        console.error("Edit error:", err);
        const apiError = err.response?.data || {};
        const errorMessage = apiError.message || "Validation failed.";
        const errors = apiError.errors || {};
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                ...r,
                status: "invalid",
                error_found: true,
                errors,
                duplicate: !!errors.duplicate,
                file_level_duplicate: !!errors.file_level_duplicate,
              }
              : r
          )
        );
        console.warn(`Row ${rowId}: ${errorMessage}`);
      }
    }, 500);
    setEditTimeouts((prev) => ({ ...prev, [rowId]: timeout }));
  };


  // === Confirm upload ===
  const handleSubmit = async () => {
    const validRows = rows.filter((r) => !r.error_found);
    const validCount = validRows.length;

    if (!rows.length)
      return MySwal.fire("Error", "No data to process", "error");

    if (!expireDate)
      return MySwal.fire("Error", "Please select an expiry date", "error");

    // 🟨 Show confirmation alert before proceeding
    const result = await MySwal.fire({
      title: validCount > 0 ? "Confirm Bulk Invitations?" : "Proceed with Bulk Invitations?",
      html:
        validCount > 0
          ? `<p class="text-danger small mb-0">
                ⚠️ All invalid or duplicate rows will be skipped automatically.  
              </p>`
          : `<p>No valid rows detected, but you can still proceed to finalize the job.</p>`,
      icon: validCount > 0 ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Send Now",
      cancelButtonText: "Cancel",
      focusCancel: true,
      customClass: {
        htmlContainer: "text-start", // left align text
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.post(
        `${API_URL}/api/invitations/bulk/${jobId}/confirm/`,
        {
          expire_date: expireDate,
          default_personal_message: defaultMessage || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      console.log("CONFIRM DATA", res.data)
      if (res.data.code === "INSUFFICIENT_QUOTA") {
        Swal.fire({
          icon: "warning",
          title: "Low Quota",
          text: res.data.message,
        });
      }
      if (res.data.status === "success") {
        MySwal.fire("Success", "Invitations sent successfully!", "success");
        onClose();
      } else {
        MySwal.fire(
          "Error",
          res.data.message || "Failed to send invitations",
          "error"
        );
      }
    } catch (err) {
      console.error("Confirm error:", err);

      if (err.response && err.response.data?.code === "INSUFFICIENT_QUOTA") {
        const msg = err.response.data.message || "You’ve exceeded your invitation limit.";
        MySwal.fire({
          icon: "warning",
          title: "Low Quota",
          text: msg,
        });
      } else {
        const msg = err.response?.data?.message || "Something went wrong while sending.";
        MySwal.fire("Error", msg, "error");
      }
    }

  };
  const handleClose = () => {
    if (pollValidation.current) {
      clearInterval(pollValidation.current);
      pollValidation.current = null;
    }
    setValidating(false);
    onClose(); // Call original
  };
  // === Download template ===
  const downloadTemplate = () => {
    const csv = Papa.unparse([
      {
        "Full Name": "John Doe",
        Email: "john@example.com",
        "Ticket Type": "Visitor",
        Company: "ABC Corp",
        "Personal Message": "See you there!",
      },
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-users text-success me-2"></i>
              Send Bulk Personalized Invitations
            </h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          <div className="modal-body">
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Instructions:</strong> Upload a CSV with Full Name, Email,
              Ticket Type, Company, Personal Message.
            </div>

            {/* === Inputs === */}
            <div className="mb-3">
              <label className="form-label">
                Upload CSV File <span className="text-danger">*</span>
              </label>
              <input
                type="file"
                className="form-control"
                accept=".csv"
                onChange={handleFileUpload}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Expire Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={expireDate}
                onChange={handleExpireDateChange}
                min={today}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Default Personal Message</label>
              <textarea
                className="form-control"
                rows="3"
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
                placeholder="This message will be added to all invitations..."
              ></textarea>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary mb-3"
              onClick={downloadTemplate}
            >
              <i className="fas fa-download me-1"></i> Download CSV Template
            </button>

            {/* {rows.length > 0 && ( */}
            <>
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h6 className="mb-0">
                  <i className="fas fa-eye me-2"></i>CSV Preview
                </h6>

                {validating ? (
                  // 🟡 Show spinner when validating
                  <div className="d-flex align-items-center text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Validating CSV data...
                  </div>
                ) : (
                  // ✅ Show filters only after validation completes
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {/* 🔍 Search box */}
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control form-control-sm"
                      style={{ width: "180px" }}
                    />

                    {/* ✅ Valid checkbox */}
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="validOnly"
                        checked={showValid}
                        onChange={(e) => setShowValid(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="validOnly">
                        Valid
                      </label>
                    </div>

                    {/* ❌ Invalid checkbox */}
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="invalidOnly"
                        checked={showInvalid}
                        onChange={(e) => setShowInvalid(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="invalidOnly">
                        Invalid
                      </label>
                    </div>

                    {/* ⬇️ Dropdown filter */}
                    <select
                      className="form-select form-select-sm"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ width: "150px" }}
                    >
                      <option value="">All Types</option>
                      {ticketTypes.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    {/* ➕ Add Row */}
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="bg-green-600 text-white px-2 py-2 rounded flex items-center"
                    >
                      <MdAdd className="mr-1" /> Add Row
                    </button>

                    {/* 🗑️ Clear All */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleClearAll}
                    >
                      <i className="fas fa-minus me-1"></i>Clear All
                    </button>
                  </div>
                )}
              </div>




              <div
                className="table-responsive"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Ticket Type</th>
                      {/* <th>Company</th> */}
                      <th>Personal Message</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  {rows.length > 0 && (

<tbody>
{rows.map((r) => (
  <tr key={r.id} className={r.error_found ? "table-danger" : ""}>
    <td className="text-center">
      {r.file_level_duplicate ? (
        <small className="text-danger fw-semibold">
          <i className="fas fa-exclamation-circle me-1"></i>
          Duplicate row in file!
        </small>
      ) : r.duplicate ? (
        <small className="text-danger fw-semibold">
          <i className="fas fa-exclamation-triangle me-1"></i>
          Invite already exists!
        </small>
      ) : (
        r.row_number
      )}
    </td>
    <td>
      <input
        type="text"
        className={`form-control form-control-sm ${r.errors?.guest_name ? "is-invalid" : ""}`}
        value={r.guest_name || ""}
        onChange={(e) => handleCellChange(r.id, "guest_name", e.target.value)}
      />
      {r.errors?.guest_name && (
        <div className="invalid-feedback small">{r.errors.guest_name}</div>
      )}
    </td>
    <td>
      <input
        type="text"
        className={`form-control form-control-sm ${r.errors?.guest_email ? "is-invalid" : ""}`}
        value={r.guest_email || ""}
        onChange={(e) => handleCellChange(r.id, "guest_email", e.target.value)}
      />
      {r.errors?.guest_email && (
        <div className="invalid-feedback small">{r.errors.guest_email}</div>
      )}
    </td>
    {renderTicketTypeCell(r)}
    <td>
      <input
        type="text"
        className="form-control form-control-sm"
        value={r.personal_message || ""}
        onChange={(e) => handleCellChange(r.id, "personal_message", e.target.value)}
      />
    </td>
    <td className="text-center">
      {r.error_found ? (
        <span className="badge bg-danger">Invalid</span>
      ) : (
        <span className="badge bg-success">Valid</span>
      )}
    </td>
    <td className="text-center">
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => handleDeleteRow(jobId, r.id)}
      >
        <i className="fas fa-trash"></i>
      </button>
    </td>
  </tr>
))}
</tbody>
                  )}
                </table>

                <AddRowModal
                  isOpen={isAddOpen}
                  onClose={() => setIsAddOpen(false)}
                  jobId={jobId}
                  onRowAdded={handleRowAdded}
                />
                {/* ✅ Summary + Pagination Section */}

              </div>


            </>

          </div>

          <div className="modal-footer flex-column">
            {/* Stats + Pagination Row */}
            <div className="d-flex justify-content-between align-items-center w-100 mb-2 flex-wrap">
              {/* 🟢 Stats */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2 mb-sm-0">
                <span className="badge bg-success">Valid: {stats?.valid_count || 0}</span>
                <span className="badge bg-danger">Invalid: {stats?.invalid_count || 0}</span>
                <span className="badge bg-info">
                  Total: {validating ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-1" role="status" style={{ width: "1em", height: "1em" }}></div>
                      Validating...
                    </>
                  ) : (
                    stats?.total_count || 0
                  )}
                </span>
              </div>

              {/* 📄 Pagination */}
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(page - 1)}>Prev</button>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link">Page {page} of {totalPages}</span>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => handlePageChange(page + 1)}>Next</button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Buttons Row */}
            <div className="d-flex justify-content-end w-100 gap-2 mt-2">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={!rows.length || validating}
              >
                <i className="fas fa-paper-plane me-2"></i> Send Invitations
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BulkPersonalizedModal;





