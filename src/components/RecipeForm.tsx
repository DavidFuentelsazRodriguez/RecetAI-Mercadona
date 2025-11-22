import React from 'react';
import styles from '../styles/RecipeForm.module.css';
import { CustomSelect, Option } from './CustomSelect';
import { ShoppingCart, Flame, AlarmClock, Leaf, BarChart3 } from 'lucide-react';
import { TagInput } from './TagInput';


const DIET_OPTIONS: Option[] = [
  { value: "omnivore", label: "🍖 Omnívora" },
  { value: "vegetarian", label: "🥦 Vegetariana" },
  { value: "vegan", label: "🌱 Vegana" },
  { value: "keto", label: "🥑 Keto" },
  { value: "low-carb", label: "📉 Baja en Carbohidratos" },
  { value: "high-protein", label: "💪 Alta en Proteína" },
  { value: "low-fat", label: "❤️ Baja en Grasas" },
  { value: "gluten-free", label: "🌾 Sin Gluten" },
  { value: "lactose-free", label: "🥛 Sin Lactosa" },
  { value: "high-fiber", label: "🌽 Alta en Fibra" },
];

const DIFFICULTY_OPTIONS: Option[] = [
  { value: "easy", label: "🟢 Fácil" },
  { value: "medium", label: "🟡 Media" },
  { value: "hard", label: "🔴 Difícil" },
];

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
            
            <CustomSelect 
                label="Tipo de Dieta"
                icon={<Leaf size={16} color='#0070f3'/>}
                value={diet}
                onChange={setDiet}
                options={DIET_OPTIONS}
            />

            <CustomSelect 
                label="Dificultad"
                icon={<BarChart3 size={16} color='#0070f3'/>}
                value={difficulty}
                onChange={setDifficulty}
                options={DIFFICULTY_OPTIONS}
            />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <ShoppingCart
              size={16}
              style={{ display: 'inline', marginRight: '8px', verticalAlign: '-2px' }}
              color="#0070f3"
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
                color="#0070f3"
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
                color="#0070f3"
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
          {loading ? 'Cocinando...' : 'Generar Receta'}
        </button>
      </form>
    </section>
  );
};
