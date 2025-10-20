// Sidebar: Fixed, with countdown timer and nav links.
// Use useEffect for countdown interval.

import React, { useState, useEffect } from 'react';
import { FaHome, FaCheckCircle, FaBuilding, FaIdBadge, FaChartLine, FaUserTie, FaVideo, FaStar, FaTrophy, FaEnvelope, FaMailBulk, FaUserGraduate, FaUserPlus, FaBullhorn, FaBook, FaFileAlt, FaUserCog, FaUsersCog } from 'react-icons/fa';

const Sidebar = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 16, hours: 17, mins: 45, secs: 19 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, mins, secs } = prev;
        secs--;
        if (secs < 0) { secs = 59; mins--; }
        if (mins < 0) { mins = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { icon: FaHome, label: 'HOME' },
    { icon: FaCheckCircle, label: 'CHECKLIST' },
    { icon: FaBuilding, label: 'COMPANY PROFILE' },
    { icon: FaIdBadge, label: 'BADGE REGISTRATION' },
    { icon: FaChartLine, label: 'OVERVIEW' },
    { icon: FaUserTie, label: 'EXHIBITOR BADGE' },
    { icon: FaVideo, label: 'EXHIBITOR MEDIA BADGE' },
    { icon: FaStar, label: 'VIP' },
    { icon: FaTrophy, label: 'VIP NOMINATION' },
    { icon: FaEnvelope, label: 'MAILS' },
    { icon: FaMailBulk, label: 'MAILS NOMINATION' },
    { icon: FaUserGraduate, label: 'STUDENT' },
    { icon: FaUserPlus, label: 'VISITOR INVITATION', active: true },
    { icon: FaBullhorn, label: 'MARKETING ASSETS' },
    { icon: FaBook, label: 'MANUALS & GUIDES' },
    { icon: FaFileAlt, label: 'FORMS & SERVICES' },
    { icon: FaUserCog, label: 'ADD CONTRACTOR USER' },
    { icon: FaUsersCog, label: 'ADD ADDITIONAL USER' },
  ];

  return (
    <nav className="fixed left-0 top-12 bottom-0 w-56 bg-sidebar text-gray-300 overflow-y-auto sidebar" 
         style={{ width: '220px', background: '#2b2b2b', transition: 'all 0.3s', position: 'fixed', left: 0, top: '48px', bottom: 0, overflowY: 'auto', overflowX: 'hidden', zIndex: 999 }}>
      
      {/* Countdown Section */}
      <div className="p-3 bg-red-500/10 border-b border-white/10 sticky top-0 z-10 countdown-section" 
           style={{ padding: '12px 15px', background: 'rgba(231, 76, 60, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 10, background: '#2b2b2b' }}>
        <div className="countdown-title" style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Time Remaining
        </div>
        <div className="flex justify-around text-primary font-bold text-lg countdown-display"
             style={{ display: 'flex', justifyContent: 'space-around', color: '#e74c3c', fontSize: '18px', fontWeight: 'bold' }}> 
          <span className="text-center">
            {timeLeft.days}
            <small className="block text-xs text-gray-500 font-normal mt-1" 
                   style={{ display: 'block', fontSize: '8px', color: '#999', fontWeight: 'normal', marginTop: '2px' }}>
              Days
            </small>
          </span>
          <span className="text-center">
            {timeLeft.hours}
            <small className="block text-xs text-gray-500 font-normal mt-1"
                   style={{ display: 'block', fontSize: '8px', color: '#999', fontWeight: 'normal', marginTop: '2px' }}>
              Hours
            </small>
          </span>
          <span className="text-center">
            {timeLeft.mins}
            <small className="block text-xs text-gray-500 font-normal mt-1"
                   style={{ display: 'block', fontSize: '8px', color: '#999', fontWeight: 'normal', marginTop: '2px' }}>
              Mins
            </small>
          </span>
          <span className="text-center">
            {timeLeft.secs}
            <small className="block text-xs text-gray-500 font-normal mt-1"
                   style={{ display: 'block', fontSize: '8px', color: '#999', fontWeight: 'normal', marginTop: '2px' }}>
              Secs
            </small>
          </span>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <div className="p-2 nav-menu" style={{ padding: '10px 0' }}>
        {navItems.map((item, i) => (
          <a
            key={i}
            href="#"
            className={`flex items-center p-2 hover:bg-white/5 transition-all duration-300 text-sm nav-item ${
              item.active 
                ? 'bg-primary text-white relative' 
                : 'text-gray-300 hover:text-white'
            } rounded`}
            style={{ 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              color: item.active ? 'white' : '#d0d0d0',
              textDecoration: 'none',
              transition: 'all 0.3s',
              position: 'relative',
              cursor: 'pointer',
              fontSize: '13px',
              background: item.active ? 'var(--primary-color)' : 'transparent'

            }}
          >
            {item.active && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"
                   style={{ content: "''", position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'white' }}></div>
            )}
            <item.icon className="mr-2" 
                      style={{ width: '18px', marginRight: '10px', fontSize: '14px' }} />
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;