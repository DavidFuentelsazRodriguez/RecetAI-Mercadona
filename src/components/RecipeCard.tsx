import React from 'react';
import { Clock, Users, Flame, ShoppingCart, ChefHat, CheckCircle2, Utensils } from 'lucide-react';
import { Ingredient, RecipeSuggestion } from '../server/types/recipe.types';
import styles from '../styles/RecipeCard.module.css';

interface RecipeCardProps {
  recipe: RecipeSuggestion;
  dietLabel: string;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, dietLabel }) => {
  const renderIngredient = (ing: Ingredient) => {
    const unitLower = ing.unit.toLowerCase();
    const isCountable = ['unidad', 'unidades', 'pieza', 'piezas', 'unit', 'units'].includes(
      unitLower
    );

    if (isCountable) {
      return (
        <>
          <span className={styles.ingQty}>{ing.quantity}</span> {ing.name}
        </>
      );
    }

    return (
      <>
        <span className={styles.ingQty}>
          {ing.quantity} {ing.unit}
        </span>{' '}
        de {ing.name}
      </>
    );
  };

  const { protein, carbs, fat, sugar, fiber, saturatedFat, sodium } = recipe.nutritionalInfo;

  return (
    <article className={styles.card}>
      {renderHeader(recipe, dietLabel)}

      <div className={styles.content}>
        {renderShoppingCart(recipe, renderIngredient)}

        {renderSteps(recipe)}

        <div className={styles.nutritionLabel}>
          {renderProtein(protein)}

          {renderCarbs(carbs, sugar, fiber)}

          {renderFat(fat, saturatedFat)}

          {sodium !== undefined && renderSodium(sodium)}
        </div>
      </div>
    </article>
  );
};

function renderHeader(recipe: RecipeSuggestion, dietLabel: string) {
  return <header className={styles.header}>
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
  </header>;
}

function renderShoppingCart(
  recipe: RecipeSuggestion,
  renderIngredient: (ing: Ingredient) => React.JSX.Element
) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <ShoppingCart className="text-blue-500" size={24} color="#0070f3" />
        Lista de la Compra
      </h3>

      <div className={styles.ingredientsGrid}>
        {recipe.ingredients.map((ing: Ingredient, i: number) => (
          <div key={i} className={styles.ingredientItem}>
            <CheckCircle2 size={20} className={styles.checkIcon} />
            <span className={styles.ingText}>{renderIngredient(ing)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSteps(recipe: RecipeSuggestion) {
  return (
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
  );
}

function renderProtein(protein: number) {
  return (
    <div className={styles.macroGroup}>
      <div className={styles.macroHeader}>
        <span className={styles.macroTitle}>Proteína</span>
        <span className={styles.macroMainValue} style={{ color: '#e91e63' }}>
          {protein}g
        </span>
      </div>
    </div>
  );
}

function renderCarbs(carbs: number, sugar: number | undefined, fiber: number | undefined) {
  return (
    <div className={styles.macroGroup}>
      <div className={styles.macroHeader}>
        <span className={styles.macroTitle}>Carbohidratos</span>
        <span className={styles.macroMainValue} style={{ color: '#f59e0b' }}>
          {carbs}g
        </span>
      </div>
      <div className={styles.macroDetails}>
        {sugar !== undefined && (
          <div className={styles.microRow}>
            <span>de los cuales azúcares</span>
            <span>{sugar}g</span>
          </div>
        )}
        {fiber !== undefined && (
          <div className={styles.microRow}>
            <span>Fibra alimentaria</span>
            <span>{fiber}g</span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderSodium(sodium: number): React.ReactNode {
  return (
    <div className={styles.macroGroup} style={{ borderBottom: 'none' }}>
      <div className={styles.macroHeader}>
        <span className={styles.macroTitle}>Sal (Sodio)</span>
        <span className={styles.macroMainValue} style={{ color: '#64748b' }}>
          {sodium}g
        </span>
      </div>
    </div>
  );
}

function renderFat(fat: number, saturatedFat: number | undefined) {
  return (
    <div className={styles.macroGroup}>
      <div className={styles.macroHeader}>
        <span className={styles.macroTitle}>Grasas</span>
        <span className={styles.macroMainValue} style={{ color: '#10b981' }}>
          {fat}g
        </span>
      </div>
      <div className={styles.macroDetails}>
        {saturatedFat !== undefined && (
          <div className={styles.microRow}>
            <span>de las cuales saturadas</span>
            <span>{saturatedFat}g</span>
          </div>
        )}
      </div>
    </div>
  );
}
