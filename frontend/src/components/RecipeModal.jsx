import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Users,
  Star,
  Heart,
  ShoppingCart,
  ChefHat,
} from "lucide-react";

const RecipeModal = ({
  recipe,
  onClose,
  onSave,
  onUnsave,
  onRate,
  onAddToGroceryList,
  isSaved,
}) => {
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(recipe.userRating || 0);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const response = await fetch(`/api/recipes/${recipe.id}`);
        const data = await response.json();
        setRecipeDetails(data);
      } catch (error) {
        console.error("Error fetching recipe details:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/recipes/${recipe.id}/rating`);
        const data = await res.json();
        if (data.rating) setUserRating(data.rating);
      } catch (error) {
        // ignore
      }
    };
    fetchRecipeDetails();
    fetchRating();
  }, [recipe.id]);

  const handleSaveToggle = () => {
    if (isSaved) {
      onUnsave(recipe.id);
    } else {
      onSave(recipe);
    }
  };

  const handleRating = async (rating) => {
    setUserRating(rating);
    setRatingLoading(true);
    try {
      await fetch(`/api/recipes/${recipe.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      onRate(recipe.id, rating);
    } catch (error) {
      // Optionally show error
    } finally {
      setRatingLoading(false);
    }
  };

  const handleAddToGroceryList = () => {
    if (recipeDetails?.extendedIngredients) {
      const ingredients = recipeDetails.extendedIngredients.map(
        (ing) => ing.original
      );
      onAddToGroceryList(ingredients);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
        onClick={interactive ? () => handleRating(index + 1) : undefined}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {recipe.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">
                Loading recipe details...
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recipe Image and Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-6 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{recipeDetails?.readyInMinutes || 30} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>{recipeDetails?.servings || 4} servings</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 dark:text-gray-300">
                      Rate this recipe:
                    </span>
                    <div className="flex items-center gap-1">
                      {renderStars(userRating, !ratingLoading)}
                      {ratingLoading && (
                        <span className="ml-2 text-xs text-gray-400">
                          Saving...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveToggle}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isSaved
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
                      />
                      {isSaved ? "Saved" : "Save Recipe"}
                    </button>

                    <button
                      onClick={handleAddToGroceryList}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Grocery List
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipe Summary */}
              {recipeDetails?.summary && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                    About this recipe
                  </h3>
                  <div
                    className="text-gray-600 dark:text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: recipeDetails.summary }}
                  />
                </div>
              )}

              {/* Ingredients */}
              {recipeDetails?.extendedIngredients && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                    Ingredients
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recipeDetails.extendedIngredients.map(
                      (ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <ChefHat className="w-4 h-4 text-primary-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {ingredient.original}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {recipeDetails?.instructions && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                    Instructions
                  </h3>
                  <div
                    className="text-gray-600 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: recipeDetails.instructions,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
