import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "flex items-center gap-2 px-4 py-2 h-[44px] rounded-lg transition-colors shadow-sm font-body-md text-body-md font-medium";
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary/90",
    outline: "bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-low",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button className={`${baseClasses} ${selectedVariant} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
