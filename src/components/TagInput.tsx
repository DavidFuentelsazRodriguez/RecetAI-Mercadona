import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import styles from '../styles/RecipeForm.module.css';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={styles.tagInputContainer}>
      <div className={styles.tagsWrapper}>
        {tags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(index)}
              className={styles.removeTagBtn}
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.tagInputField}
          placeholder={tags.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
        />
      </div>
    </div>
  );
};