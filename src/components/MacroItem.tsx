import React from 'react';

interface MacroItemProps {
  label: string;
  value: string;
  color: string;
}

export const MacroItem: React.FC<MacroItemProps> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: '0.8rem',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color }}>{value}</div>
  </div>
);
