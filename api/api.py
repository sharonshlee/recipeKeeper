"""
API for Recipe Keeper Application.

This module provides endpoints for CRUD operations on recipes.
It uses a JSON file for storage, and FastAPI for the web server.
"""

import os.path
import json
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RECIPES_FILE = "recipes.json"


def load_recipes():
    """
    Load recipes from JSON file into memory.

    If the JSON file does not exist, it initializes an empty list.

    Returns:
        list: A list of recipes.
    """
    if not os.path.exists(RECIPES_FILE):
        save_recipes([])

    with open(RECIPES_FILE, "r") as file:
        return json.load(file)


def save_recipes(recipes):
    """
    Save the current state of recipes into JSON file.

    Args:
        recipes (list): List of recipes to save.
    """
    with open(RECIPES_FILE, "w") as file:
        json.dump(recipes, file)


class Recipe(BaseModel):
    """Recipe Model.

    Attributes:
        id (int): Recipe identifier.
        name (str): Name of the recipe.
        ingredients (list[str]): List of ingredients for the recipe.
        steps (str): Steps for preparation.
        imageUrl (str): Image url for the recipe.
        dateAdded (str): Date added for the recipe.
        comments (str): Comments for the recipe.
    """
    id: int = None
    name: str
    ingredients: list[str]
    steps: str
    imageUrl: str
    dateAdded: str
    comments: list[dict]


def sort_recipes(recipes: list, criteria: str, order: bool):
    """Sort recipes

    Args:
        recipes (list): Recipes to be sorted.
        sort_criteria (str): The sort criteria.
        order (bool): The sort order, asc or desc.

    Returns:
        list: The sorted recipes.
    """
    if criteria == "ingredients":
        return sorted(recipes, key=lambda x: len(x[criteria]), reverse=order)

    return sorted(recipes, key=lambda x: x[criteria], reverse=order)


@app.get("/recipes")
def read_recipes(sort_criteria: str = "dateAdded", order: bool = False):
    """Retrieve all recipes.

    Args:
        sort_criteria (str): The sort criteria.
        order (bool): The sort order, asc or desc.

    Returns:
        list: The sorted recipes.
    """
    recipes = load_recipes()
    sorted_recipes = sort_recipes(recipes, sort_criteria, order)
    return sorted_recipes


@app.post("/recipes")
def create_recipe(recipe: Recipe):
    """Create a new recipe.

    Args:
        recipe (Recipe): The recipe details to create.

    Returns:
        dict: The created recipe.
    """
    recipes = load_recipes()
    recipe_id = max((recipe["id"] for recipe in recipes), default=0) + 1
    recipe.id = recipe_id
    recipe.dateAdded = str(datetime.now())
    recipes.append(recipe.model_dump())
    save_recipes(recipes)
    return recipe


@app.get("/recipes/{recipe_id}")
def read_recipe(recipe_id: int):
    """Retrieve a single recipe by its ID.

    Args:
        recipe_id (int): ID of the recipe to retrieve.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        dict: The requested recipe.
    """
    recipes = load_recipes()
    recipe = next(
        (recipe for recipe in recipes if recipe["id"] == recipe_id), None)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@app.put("/recipes/{recipe_id}")
def update_recipe(recipe_id: int, updated_recipe: Recipe):
    """Update a recipe by its ID.

    Args:
        recipe_id (int): ID of the recipe to update.
        updated_recipe (Recipe): New details for the recipe.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        dict: The updated recipe.
    """
    recipes = load_recipes()
    recipe_index = next((index for index, r in enumerate(
        recipes) if r["id"] == recipe_id), None)

    if recipe_index is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    updated_recipe.id = recipe_id
    recipes[recipe_index] = updated_recipe.model_dump()
    save_recipes(recipes)
    return updated_recipe


@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int):
    """Delete a recipe by its ID.

    Args:
        recipe_id (int): ID of the recipe to delete.

    Raises:
        HTTPException: If the recipe with the specified ID is not found.

    Returns:
        dict: A status message indicating successful deletion.
    """
    recipes = load_recipes()
    recipe_index = next((index for index, r in enumerate(
        recipes) if r["id"] == recipe_id), None)

    if recipe_index is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    del recipes[recipe_index]
    save_recipes(recipes)
    return {"status": "success", "message": "Recipe deleted successfully."}


@app.delete("/recipes")
def delete_all_recipes():
    """Delete all recipes.

    Returns:
        dict: A status message indicating successful deletion.
    """
    recipes = []
    save_recipes(recipes)
    return {"status": "success", "message": "All recipes deleted successfully."}


@app.post("/recipes/search")
def search_recipes(query: str):
    """Search recipes by query.
    Args:
        query (str): Recipe search field.

    Raises:
        HTTPException: If the recipe is not found.

    Returns:
        list: The matched recipes.
    """
    recipes = load_recipes()

    keyword = query.lower()

    matched_recipes = [recipe for recipe in recipes
                       if keyword
                       in recipe["name"].lower()
                       or (keyword
                           in ', '.join([ingredient.lower()
                                         for ingredient in recipe["ingredients"]
                                         if keyword in ingredient.lower()]))
                       or keyword in recipe['steps'].lower()
                       ]

    if matched_recipes is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return matched_recipes


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
