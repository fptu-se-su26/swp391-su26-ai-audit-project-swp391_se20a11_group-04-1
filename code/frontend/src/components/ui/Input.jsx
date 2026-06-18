import React from 'react';

const Input = ({ icon, className = '', containerClassName = '', ...props }) => {
  return (
    <div className={`relative ${containerClassName}`}>
      {icon && (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>
          {icon}
        </span>
      )}
      <input 
        className={`w-full border border-outline-variant rounded-lg py-2 ${icon ? 'pl-10' : 'pl-4'} pr-4 text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
