// Reusable stat card: Animates value count-up on mount.

import React, { useState, useEffect } from 'react';
import * as Icons from 'react-icons/md';

const StatCard = ({ icon, value, label, color }) => {
  const IconComponent = Icons[icon];
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += Math.ceil(value / 50);
      if (start >= value) {
        setCount(value);
        clearInterval(interval);
      } else setCount(start);
    }, 20);
    return () => clearInterval(interval);
  }, [value]);

  const colors = {
    primary: 'bg-red-100 text-red-500',
    success: 'bg-green-100 text-green-500',
    info: 'bg-blue-100 text-blue-500',
    warning: 'bg-yellow-100 text-yellow-500',
  };

  return (
    <div className="bg-white p-4 rounded shadow flex items-center gap-3 stat-card hover:-translate-y-1 transition-all duration-300" 
         style={{ borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '15px' }}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center stat-icon ${color}`} 
           style={{ width: '40px', height: '40px', borderRadius: '8px', fontSize: '18px', flexShrink: 0 }}>
        <IconComponent />
      </div>
      <div className="flex-1 stat-content">
        <div className="stat-value text-2xl font-semibold" style={{ fontSize: '24px', fontWeight: '600', color: '#333', lineHeight: 1 }}>
          {count}
        </div>
        <div className="stat-label text-xs text-gray-500" style={{ fontSize: '12px', marginTop: '2px' }}>
          {label}
        </div>
      </div>
    </div>
  );
};

export default StatCard;