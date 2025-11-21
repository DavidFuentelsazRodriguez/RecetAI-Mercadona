import React from 'react';
import styles from '../styles/RecipeForm.module.css';
import { Utensils, ShoppingCart, Flame, ChartLine, AlarmClock } from 'lucide-react';
import { TagInput } from './TagInput';

interface RecipeFormProps {
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  diet: string;
  setDiet: (value: string) => void;
  ingredients: string[];
  setIngredients: (value: string[]) => void;
  minCalories: number;
  setMinCalories: (value: number) => void;
  maxCalories: number;
  setMaxCalories: (value: number) => void;
  cookingTime: number;
  setCookingTime: (value: number) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  onSubmit,
  loading,
  diet,
  setDiet,
  ingredients,
  setIngredients,
  minCalories,
  setMinCalories,
  maxCalories,
  setMaxCalories,
  cookingTime,
  setCookingTime,
  difficulty,
  setDifficulty,
}) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val < maxCalories) setMinCalories(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val > minCalories) setMaxCalories(val);
  };

  return (
    <section className={styles.formCard}>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className={styles.formGroup}>
            <label htmlFor="diet" className={styles.label}>
              <Utensils
                size={16}
                style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }}
              />{' '}
              Dieta
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="diet"
                value={diet}
                onChange={e => setDiet(e.target.value)}
                className={styles.select}
              >
                <option value="omnivore">Omnívora</option>
                <option value="vegetarian">Vegetariana</option>
                <option value="vegan">Vegana</option>
                <option value="keto">Keto</option>
                <option value="low-carb">Low Carb</option>
                <option value="high-protein">Alta Proteína</option>
                <option value="low-fat">Baja Grasa</option>
                <option value="gluten-free">Sin Gluten</option>
                <option value="lactose-free">Sin Lactosa</option>
                <option value="high-fiber">Alta Fibra</option>
              </select>
              <span className={styles.selectArrow}>▼</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="difficulty" className={styles.label}>
              <ChartLine
                size={16}
                style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }}
              />{' '}
              Dificultad
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className={styles.select}
              >
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil</option>
              </select>
              <span className={styles.selectArrow}>▼</span>
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <ShoppingCart
              size={16}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }}
            />{' '}
            Ingredientes
          </label>

          <TagInput
            tags={ingredients}
            onChange={setIngredients}
            placeholder="Introduce ingredientes a incluir"
          />

          <p className={styles.helperText}>Pulsa Enter o Coma para añadir</p>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.sliderHeader}>
            <label htmlFor="time" className={styles.label}>
              <AlarmClock
                size={16}
                style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }}
              />{' '}
              Tiempo Disponible
            </label>
            <span className={styles.caloriesBadge}>{cookingTime} min</span>
          </div>
          <input
            id="time"
            type="range"
            min="10"
            max="120"
            step="5"
            value={cookingTime}
            onChange={e => setCookingTime(Number(e.target.value))}
            className={styles.rangeSlider}
          />
          <div className={styles.sliderLabels}>
            <span>Rápido (10m)</span>
            <span>Lento (2h)</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.sliderHeader}>
            <label className={styles.label}>
              <Flame
                size={16}
                style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }}
              />{' '}
              Rango Calórico
            </label>
            <span className={styles.caloriesBadge}>
              {minCalories} - {maxCalories} kcal
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', width: '40px' }}>Mín</span>
              <input
                type="range"
                min="0"
                max="1500"
                step="50"
                value={minCalories}
                onChange={handleMinChange}
                className={styles.rangeSlider}
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#666', width: '40px' }}>Máx</span>
              <input
                type="range"
                min="0"
                max="1500"
                step="50"
                value={maxCalories}
                onChange={handleMaxChange}
                className={styles.rangeSlider}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${styles.submitBtn} ${loading ? styles.loading : ''}`}
        >
          {loading ? '🔄 Cocinando...' : 'Generar Receta'}
        </button>
      </form>
    </section>
  );
};
