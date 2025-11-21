import React from 'react';

interface BadgeProps {
  icon: string;
  text: string;
}

export const Badge: React.FC<BadgeProps> = ({ icon, text }) => (
  <span
    style={{
      background: 'rgba(255,255,255,0.2)',
      padding: '0.3rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
    }}
  >
    <span>{icon}</span> {text}
  </span>
);
