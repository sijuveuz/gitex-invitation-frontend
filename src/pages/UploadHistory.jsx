import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const API_URL = process.env.REACT_APP_API_URL;

export default function UploadHistory() {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  const loadJobs = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/api/invitations/jobs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadJobs(); // Initial load

    const interval = setInterval(() => {
      // Check if any job is still running
      const hasActive = jobs.some(j =>
        ["pending", "processing", "sending"].includes(j.status)
      );

      if (hasActive) loadJobs(); // Continue polling
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs]);

  const statusColor = {
    pending: "bg-gray-400",
    processing: "bg-blue-500",
    sending: "bg-purple-500",
    completed: "bg-green-600",
    failed: "bg-red-600",
  };

  return (
    <div className="flex min-h-screen bg-gray-100" style={{ paddingTop: 48 }}>
      {/* ✅ Add Back Button */}
      <Header
        onBack={() => navigate("/invitation")}
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
      />

      <Sidebar />

      <main className="p-6 w-full ml-56">
        <h2 className="text-2xl font-semibold mb-4">Upload History</h2>

        <div className="bg-white shadow rounded p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">File Name</th>
                <th className="p-2">Total</th>
                <th className="p-2">Valid</th>
                <th className="p-2">Invalid</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{job.file_name}</td>
                  <td className="p-2">{job.total_count}</td>
                  <td className="p-2 text-green-600">{job.valid_count}</td>
                  <td className="p-2 text-red-600">{job.invalid_count}</td>
                  <td className="p-2">
                    <div className="w-full bg-gray-200 h-3 rounded">
                      <div
                        className={`h-3 rounded ${statusColor[job.status] || "bg-gray-400"}`}
                        style={{
                          width:
                            job.status === "completed"
                              ? "100%"
                              : job.status === "sending"
                              ? "75%"
                              : job.status === "processing"
                              ? "45%"
                              : "25%",
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
