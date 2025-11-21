import { useState } from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { RecipeForm } from '../components/RecipeForm';
import { RecipeCard } from '../components/RecipeCard';
import styles from '../styles/Home.module.css';
import { RecipeSuggestion } from '@/server/types/recipe.types';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeSuggestion | null>(null);
  const [error, setError] = useState('');
  
  const [diet, setDiet] = useState('omnivore');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [minCalories, setMinCalories] = useState(600);
  const [maxCalories, setMaxCalories] = useState(1200);
  const [cookingTime, setCookingTime] = useState(30);
  const [difficulty, setDifficulty] = useState('medium');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecipe(null);

    try {
      const themes = ingredients.map(t => t.trim()).filter(Boolean);
      
      const res = await fetch(`${apiUrl}/recipes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            diet,
            ingredientThemes: themes,
            cookingTime,
            difficulty
          },
          nutritionalGoals: {
            minCalories: Number(minCalories),
            maxCalories: Number(maxCalories)
          }
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.errors) {
           throw new Error(`Datos inválidos: ${JSON.stringify(data.errors)}`);
        }
        throw new Error(data.message || 'Error generando receta');
      }

      setRecipe(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await fetch(`${apiUrl}/products/sync`, { method: 'POST' });
      const data = await res.json();
      
      if (res.status === 202) {
         alert(`${data.message}`); 
      } else if (res.status === 429) {
         alert(`Límite alcanzado: ${data.message}`);
      } else {
         alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert(`Error de conexión con el servidor: ${err}`);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>RecetAI Mercadona</title>
        <meta name="description" content="Generador de recetas con IA y productos de Mercadona" />
      </Head>

      <Header onSync={handleSync} />

      <main>
        <RecipeForm 
          onSubmit={handleSubmit}
          loading={loading}
          diet={diet}
          setDiet={setDiet}
          ingredients={ingredients}
          setIngredients={setIngredients}
          minCalories={minCalories}
          setMinCalories={setMinCalories}
          maxCalories={maxCalories}
          setMaxCalories={setMaxCalories}
          cookingTime={cookingTime}
          setCookingTime={setCookingTime}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />

        {error && (
          <div className={styles.errorBox}>
            <strong>Ha ocurrido un error:</strong> {error}
          </div>
        )}

        {recipe && (
          <RecipeCard recipe={recipe} dietLabel={diet} />
        )}
      </main>
    </div>
  );
}