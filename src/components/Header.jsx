import React, { useState } from 'react';
import { MdSearch, MdLogout } from 'react-icons/md';
import { FiMoreVertical } from "react-icons/fi";
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* RIGHT SIDE */}
      <div className="ml-auto flex items-center gap-3 relative">

        {/* 3 DOT MENU */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 hover:bg-white/20 rounded"
        >
          <FiMoreVertical size={20} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 bg-white text-black shadow-lg border rounded w-44 z-50">
            <Link
              to="/upload-history"
              className="block px-3 py-2 hover:bg-gray-100 text-sm"
              onClick={() => setMenuOpen(false)}
            >
              Upload History
            </Link>

            <button
              onClick={handleLogoutClick}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
            >
              <MdLogout size={18} /> Sign Out
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;



// // Add logout button if authenticated.

// import React from 'react';
// import { MdSearch, MdLogout } from 'react-icons/md';
// import { useNavigate } from 'react-router-dom';

// const Header = ({ onLogout }) => {
//   const navigate = useNavigate();

//   const handleLogoutClick = () => {
//     onLogout();
//     navigate('/login');
//   };

//   return (
//     <header className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-purple-900 via-pink-700 to-red-500 text-white flex items-center px-4 z-50">
//       <div className="flex items-center gap-3">
//         <div className="relative">
//           <MdSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/80" />
//           <input
//             type="text"
//             placeholder="Search..."
//             className="bg-white/15 border border-white/30 pl-8 h-8 text-white placeholder-white/80 rounded"
//             style={{ width: '200px' }}
//           />
//         </div>
//         <select className="bg-white/15 border border-white/30 h-8 text-white rounded" style={{ width: '200px' }}>
//           <option>GITEX Universe Stand</option>
//           <option>Tech Summit 2025</option>
//           <option>Innovation Expo</option>
//         </select>
//       </div>
//       <div className="ml-auto flex items-center gap-3">
//         {/* <span className="me-3">Welcome, Mohamed Belson</span> */}
//         <button onClick={handleLogoutClick} className="flex items-center gap-1 bg-transparent border border-white px-2 py-1 rounded text-sm h-8">
//           <MdLogout /> Sign Out
//         </button>
//       </div>
//     </header>
//   );
// };

// export default Header;