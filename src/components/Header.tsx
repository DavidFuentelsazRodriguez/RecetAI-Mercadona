import React from 'react';

interface HeaderProps {
  onSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSync }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
    <h1 style={{ margin: 0 }}>🍳 RecetAI Mercadona</h1>
    <button 
      onClick={onSync} 
      style={{ 
        padding: '0.6rem 1.2rem', 
        background: 'white', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        fontWeight: 600, 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}
    >
      🔄 Sync Productos
    </button>
  </header>
);