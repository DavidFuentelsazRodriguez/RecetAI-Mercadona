import React from 'react';
import { Clock, Users, Flame, ShoppingCart, ChefHat, CheckCircle2, Utensils } from 'lucide-react';
import { Ingredient, RecipeSuggestion } from '../server/types/recipe.types';
import styles from '../styles/RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeSuggestion;
  dietLabel: string;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, dietLabel }) => {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{recipe.name}</h2>
        <p className={styles.description}>{recipe.description}</p>
        
        <div className={styles.badgesGrid}>
          <div className={styles.badge}>
            <Clock size={18} /> {recipe.preparationTime} min
          </div>
          <div className={styles.badge}>
            <Users size={18} /> {recipe.servings} pers
          </div>
          <div className={styles.badge}>
            <Flame size={18} /> {recipe.nutritionalInfo.calories} kcal
          </div>
          <div className={styles.badge}>
            <Utensils size={18} /> {dietLabel.toUpperCase()}
          </div>
        </div>
      </header>

      <div className={styles.content}>
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <ShoppingCart className="text-blue-500" size={24} color="#0070f3" /> 
            Lista de la Compra
          </h3>
          
          <div className={styles.ingredientsGrid}>
            {recipe.ingredients.map((ing: Ingredient, i: number) => (
              <div key={i} className={styles.ingredientItem}>
                <CheckCircle2 size={20} className={styles.checkIcon} />
                <span className={styles.ingText}>
                  <span className={styles.ingQty}>{ing.quantity} {ing.unit}</span> de {ing.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <ChefHat size={24} color="#0070f3" /> 
            Pasos de Preparación
          </h3>
          
          <ol className={styles.stepsList}>
            {recipe.steps.map((step: string, i: number) => (
              <li key={i} className={styles.stepItem}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <p className={styles.stepText}>{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.macrosContainer}>
          <div className={styles.macroCard}>
            <div className={styles.macroLabel}>Proteína</div>
            <div className={styles.macroValue} style={{ color: '#e91e63' }}>
              {recipe.nutritionalInfo.protein}g
            </div>
          </div>
          
          <div className={styles.macroCard}>
            <div className={styles.macroLabel}>Carbos</div>
            <div className={styles.macroValue} style={{ color: '#f59e0b' }}>
              {recipe.nutritionalInfo.carbs}g
            </div>
          </div>
          
          <div className={styles.macroCard}>
            <div className={styles.macroLabel}>Grasas</div>
            <div className={styles.macroValue} style={{ color: '#10b981' }}>
              {recipe.nutritionalInfo.fat}g
            </div>
          </div>
        </div>

      </div>
    </article>
  );
};