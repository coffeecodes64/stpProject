import React, { useState } from 'react';
import { Plus, Check, X, ShoppingCart, Trash2 } from 'lucide-react';

const GroceryList = ({ groceryList, setGroceryList }) => {
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = async () => {
    if (!newItem.trim()) return;
    setError('');
    setLoading(true);
    try {
      // Search for recipes by name
      const searchRes = await fetch(`/api/recipes/search?ingredients=${encodeURIComponent(newItem.trim())}&number=1`);
      const searchData = await searchRes.json();
      const firstRecipe = searchData.results && searchData.results[0];
      if (!firstRecipe) {
        setError('No recipe found for that name.');
        setLoading(false);
        return;
      }
      // Fetch recipe details to get ingredients
      const detailsRes = await fetch(`/api/recipes/${firstRecipe.id}`);
      const detailsData = await detailsRes.json();
      const ingredients = detailsData.extendedIngredients || [];
      if (ingredients.length === 0) {
        setError('No ingredients found for this recipe.');
        setLoading(false);
        return;
      }
      // Add each ingredient to the grocery list
      const newItems = ingredients.map(ing => ({
        id: Date.now() + Math.random(),
        name: ing.original,
        checked: false
      }));
      const updatedList = [...groceryList, ...newItems];
      setGroceryList(updatedList);
      localStorage.setItem('groceryList', JSON.stringify(updatedList));
      setNewItem('');
    } catch (err) {
      setError('Failed to fetch recipe ingredients.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id) => {
    const updatedList = groceryList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setGroceryList(updatedList);
    localStorage.setItem('groceryList', JSON.stringify(updatedList));
  };

  const removeItem = (id) => {
    const updatedList = groceryList.filter(item => item.id !== id);
    setGroceryList(updatedList);
    localStorage.setItem('groceryList', JSON.stringify(updatedList));
  };

  const clearCompleted = () => {
    const updatedList = groceryList.filter(item => !item.checked);
    setGroceryList(updatedList);
    localStorage.setItem('groceryList', JSON.stringify(updatedList));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  const checkedItems = groceryList.filter(item => item.checked).length;
  const totalItems = groceryList.length;

  return (
    <div className="glass-morphism rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Grocery List
        </h2>
        {totalItems > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {checkedItems} of {totalItems} completed
            </span>
            {checkedItems > 0 && (
              <button
                onClick={clearCompleted}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Clear Completed
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add New Item */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => { if (e.key === 'Enter') addItem(); }}
          placeholder="Enter the recipe name to get grocery list..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          disabled={loading}
        />
        <button
          onClick={addItem}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-md"
          disabled={loading}
        >
          {loading ? <span className="animate-spin">⏳</span> : <Plus className="w-5 h-5" />}
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-secondary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(checkedItems / totalItems) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Grocery Items */}
      {groceryList.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Your grocery list is empty
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Add items manually or from your favorite recipes!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groceryList.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                item.checked
                  ? 'bg-secondary-50 dark:bg-secondary-900/20 border-secondary-200 dark:border-secondary-800'
                  : 'bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${
                  item.checked
                    ? 'bg-secondary-500 border-secondary-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-secondary-500'
                }`}
              >
                {item.checked && <Check className="w-4 h-4" />}
              </button>
              
              <span
                className={`flex-1 transition-all ${
                  item.checked
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-800 dark:text-white'
                }`}
              >
                {item.name}
              </span>
              
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceryList;