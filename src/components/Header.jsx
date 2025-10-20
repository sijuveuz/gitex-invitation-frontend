// Add logout button if authenticated.

import React from 'react';
import { MdSearch, MdLogout } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-purple-900 via-pink-700 to-red-500 text-white flex items-center px-4 z-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <MdSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/80" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-white/15 border border-white/30 pl-8 h-8 text-white placeholder-white/80 rounded"
            style={{ width: '200px' }}
          />
        </div>
        <select className="bg-white/15 border border-white/30 h-8 text-white rounded" style={{ width: '200px' }}>
          <option>GITEX Universe Stand</option>
          <option>Tech Summit 2025</option>
          <option>Innovation Expo</option>
        </select>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="me-3">Welcome, Mohamed Belson</span>
        <button onClick={handleLogoutClick} className="flex items-center gap-1 bg-transparent border border-white px-2 py-1 rounded text-sm h-8">
          <MdLogout /> Sign Out
        </button>
      </div>
    </header>
  );
};

export default Header;