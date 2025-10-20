// Reusable action card: Click opens modal.

import React from 'react';
import * as Icons from 'react-icons/md'; // Dynamic icon import

const ActionCard = ({ icon, title, description, buttonText, onClick }) => {
  const IconComponent = Icons[icon];

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded shadow hover:shadow-lg cursor-pointer border border-gray-200 hover:border-primary transition-all duration-300 hover:-translate-y-1 action-card"
      style={{ borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center">
        <div className="action-card-icon mr-3" style={{ fontSize: '28px', color: '#e74c3c' }}>
          <IconComponent />
        </div>
        <div className="flex-grow-1">
          <h5 className="font-semibold text-base mb-2" style={{ fontSize: '16px', fontWeight: '600' }}>
            {title}
          </h5>
          <p className="text-xs text-gray-500 mb-2" style={{ fontSize: '12px' }}>
            {description}
          </p>
          <button 
            className="bg-primary text-white px-4 py-1 rounded text-sm"
            style={{ fontSize: '13px', padding: '6px 16px' }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionCard;