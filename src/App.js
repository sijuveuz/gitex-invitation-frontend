import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Components
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ActionCard from './components/ActionCard';
import StatCard from './components/StatCard';
import FilterSection from './components/FilterSection';
import TableSection from './components/TableSection';
import GenerateLinkModal from './components/Modals/GenerateLinkModal';
import PersonalizedModal from './components/Modals/PersonalizedModal';
import BulkUploadModal from './components/Modals/BulkUploadModal';
import InviteConfirm from './pages/InviteConfirm';
import InviteRegister from './pages/InviteRegister';

const MySwal = withReactContent(Swal); 
const API_URL = process.env.REACT_APP_API_URL;
// ✅ Extract MainContent outside to prevent re-mounting
const MainContent = ({
  stats,
  filteredInvitations,
  currentPage,
  totalPages,
  currentFilters,
  isGenerateModalOpen,
  setIsGenerateModalOpen,
  isPersonalizedModalOpen,
  setIsPersonalizedModalOpen,
  isBulkModalOpen,
  setIsBulkModalOpen,
  handleFilter,
  handleReset,
  handleExport,
  handleNext,
  handlePrev,
  handleRefresh,
  fetchInvitations,
  fetchStats,
}) => (
  <div
    className="flex flex-col min-h-screen bg-gray-100 app-wrapper"
    style={{ marginTop: '48px', minHeight: 'calc(100vh - 48px)' }}
  >
    <Header onLogout={() => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }} />
    <div className="flex flex-1">
      <Sidebar />
      <main
        className="flex-1 p-5 ml-56 main-content"
        style={{
          padding: '20px',
          marginLeft: '220px',
          overflowX: 'hidden',
          backgroundColor: '#f8f9fa',
          minHeight: 'calc(100vh - 48px)',
          transition: 'margin-left 0.3s',
        }}
      >
        {/* Page Header */}
        <div className="page-header mb-5">
          <h1 className="text-2xl font-light text-gray-800">Visitor Invitation</h1>
          <p className="text-sm text-gray-500">
            Send complimentary Visitor Pass invitations for GITEX GLOBAL 2025 and Expand North
            Star 2025.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <ActionCard
            icon="MdEmail"
            title="Send Personalized Invitation"
            description="Send a personalized invitation to a guest"
            buttonText="Send"
            onClick={() => setIsPersonalizedModalOpen(true)}
          />
          <ActionCard
            icon="MdPeople"
            title="Send Bulk Personalized Invitation"
            description="Upload CSV and send to multiple guests"
            buttonText="Upload"
            onClick={() => setIsBulkModalOpen(true)}
          />
          <ActionCard
            icon="MdLink"
            title="Generate Invitation Link"
            description="Generate and share generic link"
            buttonText="Generate"
            onClick={() => setIsGenerateModalOpen(true)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <StatCard icon="MdConfirmationNumber" value={stats.allocated} label="Allocated" color="primary" />
          <StatCard icon="MdShare" value={stats.generated} label="Generated" color="success" />
          <StatCard icon="MdHourglassEmpty" value={stats.remaining} label="Remaining" color="info" />
          <StatCard icon="MdPeople" value={stats.registered} label="Registered" color="warning" />
        </div>

        {/* Filter + Table */}
        <FilterSection onFilter={handleFilter} onReset={handleReset} onExport={handleExport} />

        <TableSection
          data={filteredInvitations}
          onRefresh={handleRefresh}
          onNext={handleNext}
          onPrev={handlePrev}
          currentPage={currentPage}
          totalPages={totalPages}
        />

        {/* Modals */}
        <GenerateLinkModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          onSubmit={(responseData) => {
            MySwal.fire('Generated!', 'Link created successfully.', 'success');
            // Refresh table and stats after successful generation
            fetchInvitations(currentPage, currentFilters);
            fetchStats();
          }}
        />

        <PersonalizedModal
          isOpen={isPersonalizedModalOpen}
          onClose={() => setIsPersonalizedModalOpen(false)}
          onSubmit={async (formData) => {
            const token = localStorage.getItem('token');
            try {
              const res = await axios.post(
                '${API_URL}/api/invitations/send/',
                {
                  guest_name: formData.name,
                  guest_email: formData.guest_email,
                  ticket_type: formData.ticketType,
                  expire_date: formData.expireDate,
                  company_name: formData.company,
                  personal_message: formData.message,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log("RES" , res.data)
              if (res.data?.status === 'success') {
                MySwal.fire('✅ Success', res.data.message, 'success');
                // Refresh list after success
                fetchInvitations(currentPage, currentFilters);
                fetchStats();
              }
              return res.data;
            } catch (err) {
              const backendData = err.response?.data;
              return {
                status: 'error',
                message: backendData?.message || 'Something went wrong.',
              };
            }
          }}
        />

        <BulkUploadModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSubmit={(data) => {
            MySwal.fire('Sent!', `${data.length} invitations sent.`, 'success');
            // Refresh list after bulk send
            fetchInvitations(currentPage, currentFilters);
            fetchStats();
          }}
        />
      </main>
    </div>
  </div>
);

function App() {
  // ---------- STATE ----------
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [stats, setStats] = useState({
    allocated: 0,
    generated: 0,
    remaining: 0,
    registered: 0,
  });

  const [currentFilters, setCurrentFilters] = useState({});

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPersonalizedModalOpen, setIsPersonalizedModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ---------- FETCH INVITATIONS ----------
  const fetchInvitations = useCallback(async (page = 1, filters = {}) => {
    const token = localStorage.getItem('token');
    // Build params from filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") params.append(key, value);
    });
    params.append('page', page.toString());
  
    try {
      const res = await axios.get(`${API_URL}/api/invitations/list/?${params.toString() || 'page=1'}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("INVITE _ LIST", res.data)
      const result = res.data.results || res.data;
      if (result.status === 'success' && Array.isArray(result.data)) {
        const apiData = result.data.map((item) => ({
          id: item.id,
          name: item.guest_name,
          email: item.guest_email,
          type: item.invite_type,
          expiry: new Date(item.expire_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          ticket_type: item.ticket_type.name,
          limit: item.link_limit,
          registered: item.usage_count,
          invitation_url: item.invitation_url,
          status:
          item.status === 'active'
            ? 'Active'
            : item.status === 'expired'
            ? 'Expired'
            : item.status === 'pending'
            ? 'Pending'
            : 'Active',
        }));

        setFilteredInvitations(apiData);
        setCurrentPage(page);
        setTotalPages(Math.ceil((res.data.count || 0) / 10));
      } else {
        MySwal.fire('Error', 'Unexpected response from server.', 'error');
      }
    } catch (err) {
      console.error('❌ Error fetching invitations:', err.response?.data || err.message);
      MySwal.fire('Error', 'Failed to load invitations list.', 'error');
    }
  }, []); // Empty deps since it uses external state

  // ---------- FETCH STATS ----------
  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('${API_URL}/api/invitations/stats/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.status === 'success' && res.data?.data) {
        const apiStats = res.data.data;
        setStats({
          allocated: apiStats.allocated_invitations,
          generated: apiStats.generated_invitations,
          remaining: apiStats.remaining_invitations,
          registered: apiStats.registered_visitors,
        });
      }
    } catch (err) {
      console.error('❌ Error fetching stats:', err.response?.data || err.message);
      MySwal.fire('Error', 'Failed to load dashboard stats.', 'error');
    }
  }, []);

  // ---------- EFFECTS ----------
  useEffect(() => {
    if (isAuthenticated) {
      fetchInvitations(1, {});
      fetchStats();
    }
  }, [isAuthenticated, fetchInvitations, fetchStats]);

  // ---------- FILTER HANDLERS ----------
  const handleFilter = useCallback(async (filters) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    await fetchInvitations(1, filters);
  }, [fetchInvitations]);

  const handleReset = useCallback(() => {
    setCurrentFilters({});
    setCurrentPage(1);
    fetchInvitations(1, {});
  }, [fetchInvitations]);

  const handleExport = useCallback(() => MySwal.fire('Exported!', 'Data exported successfully.', 'success'), []);

  // Pagination handlers
  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      fetchInvitations(nextPage, currentFilters);
    }
  }, [currentPage, totalPages, currentFilters, fetchInvitations]);

  const handlePrev = useCallback(() => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      fetchInvitations(prevPage, currentFilters);
    }
  }, [currentPage, currentFilters, fetchInvitations]);

  const handleRefresh = useCallback(() => {
    fetchInvitations(currentPage, currentFilters);
  }, [currentPage, currentFilters, fetchInvitations]);

  // ---------- ROUTES ----------
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/invitation" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/invitation"
          element={isAuthenticated ? (
            <MainContent
              stats={stats}
              filteredInvitations={filteredInvitations}
              currentPage={currentPage}
              totalPages={totalPages}
              currentFilters={currentFilters}
              isGenerateModalOpen={isGenerateModalOpen}
              setIsGenerateModalOpen={setIsGenerateModalOpen}
              isPersonalizedModalOpen={isPersonalizedModalOpen}
              setIsPersonalizedModalOpen={setIsPersonalizedModalOpen}
              isBulkModalOpen={isBulkModalOpen}
              setIsBulkModalOpen={setIsBulkModalOpen}
              handleFilter={handleFilter}
              handleReset={handleReset}
              handleExport={handleExport}
              handleNext={handleNext}
              handlePrev={handlePrev}
              handleRefresh={handleRefresh}
              fetchInvitations={fetchInvitations}
              fetchStats={fetchStats}
            />
          ) : <Navigate to="/login" replace />}
        />
        <Route path="/invite/:uuid" element={<InviteConfirm />} />
        <Route path="/invite/register/:uuid" element={<InviteRegister />} />
      </Routes>
    </Router>
  );
}

export default App;