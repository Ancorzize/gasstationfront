import React from 'react';

export const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false }) => {
  const baseStyles = "w-full py-3 px-6 rounded-lg font-bold uppercase tracking-widest transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]",
    outline: "border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {children}
    </button>
  );
};