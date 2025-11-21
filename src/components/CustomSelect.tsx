import React, { useState } from 'react';
import styles from '../styles/CustomSelect.module.css';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  label, 
  icon, 
  value, 
  onChange, 
  options 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find(opt => opt.value === value)?.label || 'Seleccionar...';

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {icon}
        {label}
      </label>

      <button 
        type="button" 
        className={`${styles.trigger} ${isOpen ? styles.isOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={18} className={styles.arrow} />
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          
          <div className={styles.dropdown}>
            {options.map((option) => (
              <div 
                key={option.value}
                className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {option.value === value && <Check size={16} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};