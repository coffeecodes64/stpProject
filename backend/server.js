import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Spoonacular API configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com/recipes";

// Search recipes by ingredients
app.get("/api/recipes/search", async (req, res) => {
  try {
    const { ingredients, number = 12 } = req.query;

    if (!ingredients) {
      return res
        .status(400)
        .json({ error: "Ingredients parameter is required" });
    }

    if (!SPOONACULAR_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const response = await fetch(
      `${SPOONACULAR_BASE_URL}/findByIngredients?ingredients=${encodeURIComponent(
        ingredients
      )}&number=${number}&apiKey=${SPOONACULAR_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    res.json({ results: data });
  } catch (error) {
    console.error("Error searching recipes:", error);
    res.status(500).json({ error: "Failed to search recipes" });
  }
});

// Get recipe details
app.get("/api/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!SPOONACULAR_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const response = await fetch(
      `${SPOONACULAR_BASE_URL}/${id}/information?apiKey=${SPOONACULAR_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});

// Generate grocery list from recipes
app.post("/api/grocery-list", async (req, res) => {
  try {
    const { recipeIds } = req.body;

    if (!recipeIds || !Array.isArray(recipeIds)) {
      return res.status(400).json({ error: "Recipe IDs array is required" });
    }

    if (!SPOONACULAR_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Fetch ingredients for all recipes
    const ingredientPromises = recipeIds.map(async (id) => {
      const response = await fetch(
        `${SPOONACULAR_BASE_URL}/${id}/information?apiKey=${SPOONACULAR_API_KEY}`
      );
      if (response.ok) {
        const recipe = await response.json();
        return recipe.extendedIngredients || [];
      }
      return [];
    });

    const allIngredients = await Promise.all(ingredientPromises);
    const flatIngredients = allIngredients.flat();

    // Group similar ingredients
    const groupedIngredients = {};
    flatIngredients.forEach((ingredient) => {
      const name = ingredient.name.toLowerCase();
      if (groupedIngredients[name]) {
        groupedIngredients[name].amount += ingredient.amount;
      } else {
        groupedIngredients[name] = {
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          original: ingredient.original,
        };
      }
    });

    const groceryList = Object.values(groupedIngredients);
    res.json({ groceryList });
  } catch (error) {
    console.error("Error generating grocery list:", error);
    res.status(500).json({ error: "Failed to generate grocery list" });
  }
});

// In-memory ratings store (for demo; use DB in production)
const recipeRatings = {};

// Set a recipe rating
app.post("/api/recipes/:id/rate", (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  recipeRatings[id] = rating;
  res.json({ success: true, rating });
});

// Get a recipe rating
app.get("/api/recipes/:id/rating", (req, res) => {
  const { id } = req.params;
  const rating = recipeRatings[id] || null;
  res.json({ rating });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Recipe Generator API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!SPOONACULAR_API_KEY) {
    console.warn(
      "Warning: SPOONACULAR_API_KEY not set. Please add it to your .env file."
    );
  }
});
