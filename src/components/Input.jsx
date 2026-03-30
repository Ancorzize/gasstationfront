import React from 'react';

export const Input = ({ label, type = "text", placeholder, onChange, value, name }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-zinc-400 text-sm font-semibold tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white 
                   placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 
                   focus:border-yellow-500 transition-all duration-200"
      />
    </div>
  );
};