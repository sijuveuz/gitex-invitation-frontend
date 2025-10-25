import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const API_URL = process.env.REACT_APP_API_URL;

export default function UploadHistory() {
  const [jobs, setJobs] = useState([]);
  const [latestStatus, setLatestStatus] = useState(null); // ✅ Track status separately
  const navigate = useNavigate();

  const loadJobs = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_URL}/api/invitations/jobs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data?.data || res.data || [];

      // ✅ Sort by latest
      const sorted = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setJobs(sorted);

      // ✅ Track only latest job status
      if (sorted.length > 0) {
        setLatestStatus(sorted[0].status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadJobs(); // Initial fetch

    const interval = setInterval(() => {
      // ✅ Poll ONLY if latest job still running
      if (["pending", "processing", "sending"].includes(latestStatus)) {
        loadJobs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [latestStatus]); // ✅ Only track latest status

  const activeStatus = ["pending", "processing", "sending"];

  const statusColor = {
    pending: "bg-gray-400",
    processing: "bg-blue-500",
    sending: "bg-purple-500",
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "pending": return "25%";
      case "processing": return "55%";
      case "sending": return "85%";
      default: return "100%";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100" style={{ paddingTop: 48 }}>
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
              {jobs.map((job) => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{job.file_name}</td>
                  <td className="p-2">{job.total_count}</td>
                  <td className="p-2 text-green-600">{job.valid_count}</td>
                  <td className="p-2 text-red-600">{job.invalid_count}</td>

                  <td className="p-2">
                    {activeStatus.includes(job.status) ? (
                      <>
                        <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
                          <div
                            className={`h-3 rounded transition-all duration-700 ${statusColor[job.status]}`}
                            style={{ width: getProgressWidth(job.status) }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {job.status.replace("_", " ")}
                        </span>
                      </>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          job.status === "completed"
                            ? "bg-green-600 text-white"
                            : job.status === "failed"
                            ? "bg-red-600 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    )}
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
