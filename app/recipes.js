const BASE_URL = "http://localhost:8001";
let recipeName = document.getElementById("recipeName");
let recipeFormTitle = document.getElementById("recipeFormTitle");
let submitButton = document.getElementById("submitButton");
let popupDeleteConfirmDiv = document.getElementById("popUpDeleteConfirmation");
let deleteMessage = document.getElementById("deleteMessage");
let deleteAllButton = document.getElementById("deleteAll");
let deleteOneButton = document.getElementById("deleteOne");
let container = document.getElementById("container");
let recipeId = document.getElementById("recipeId");
let statusMessage = document.getElementById("statusMessage");
let searchMessageDiv = document.getElementById("searchResult");

/**
 * Check user input errors for recipe name, ingredienst and steps
 */
const checkError = (newRecipe) => {
	let nameError = document.getElementById("nameError");
	let ingredientsError = document.getElementById("ingredientsError");
	let stepsError = document.getElementById("stepsError");

	let errorCount = 0;
	if (!newRecipe.name) {
		nameError.innerText = "Name cannot be empty.";
		errorCount++;
	} else {
		nameError.innerText = "";
	}
	if (!newRecipe.ingredients) {
		ingredientsError.innerText = "Ingredients cannot be empty.";
		errorCount++;
	} else if (!newRecipe.ingredients.includes(",")) {
		ingredientsError.innerText = "Ingredients must be comma separated.";
		errorCount++;
	} else {
		ingredientsError.innerText = "";
	}
	if (!newRecipe.steps) {
		stepsError.innerText = "Steps cannot be empty.";
		errorCount++;
	} else {
		stepsError.innerText = "";
	}

	return errorCount > 0;
};

/**
 * Clear all the input fields
 * and focus on recipe name input box
 */
const emptyFields = () => {
	recipeName.value = "";
	ingredients.value = "";
	steps.value = "";
	imageUrl.value = "";
	recipeName.focus();
};

/**
 * Display a new or updated recipe
 * to recipe card and container
 */
const displayRecipe = (recipe) => {
	let recipeDiv = document.createElement("div");
	recipeDiv.classList.add("recipe");

	recipeDiv.id = `recipe${recipe.id}`;

	recipeDiv.innerHTML = `
			<div class="header">
				<h2 id="recipeTitle${recipe.id}">${recipe.name}</h2>
				<div class="editDeletebuttons">
					<button id="commentIcon" class="material-symbols-outlined" onclick="commentRecipe('${
						recipe.id
					}')">comment</button>
					<button class="material-symbols-outlined" onclick="editRecipe('${
						recipe.id
					}')">edit</button>
					<button class="material-symbols-outlined" onclick="deleteOneRecipe('${
						recipe.id
					}', '${recipe.name}')">delete</button>
				</div>
			</div>
				
				<img id="recipeImage${recipe.id}" src="${recipe.imageUrl}" alt="recipe image" />
				
				<div class="content">
				<h3>Ingredients: </h3><span id="recipeIngredients${recipe.id}">${
		recipe.ingredients
	}</span>
				<br><h3>Steps: </h3><span id="recipeSteps${recipe.id}">${recipe.steps.replace(
		/\n/g,
		"<br>"
	)}</span>

				</div>
				<div class="comments">
				<div class="commentsContainer" id="commentsContainer${recipe.id}">
					${recipe.comments
						.map(
							(comment) =>
								`<div class="comment" id="comment${comment.id}">
								<div class="displayComment">${comment.value}</div>
								<span class="material-symbols-outlined deleteCommentIcon" onclick="deleteComment(${recipe.id},${comment.id})">delete</span>
								</div>`
						)
						.join("")}

				</div>
					<input id="commentInput${
						recipe.id
					}" class="commentInput" onkeydown="addComment(event,'${
		recipe.id
	}')" type="text" placeholder="Write a comment..." />
				</div>
			<br />
        `;

	// add the new recipe to the top of container
	container.insertBefore(recipeDiv, container.firstChild);
};

/**
 * Display or hide side (home, deleteAll, scroll top) icons
 * based on recipes availability
 */
const toggleSideButtons = (hasRecipe) => {
	iconDisplay = hasRecipe ? "inline-block" : "none";
	removeAllRecipesIcon.style.display = iconDisplay;
	scrollTopIcon.style.display = iconDisplay;
	homeIcon.style.display = iconDisplay;
};

/**
 * Enable or disable filter, recipes container and side icons
 * when updating a recipe
 */
const toggleUpdateSetup = (isDisabled) => {
	const filter = document.getElementById("filter");
	const disabled = "disabled";
	if (isDisabled) {
		container.classList.add(disabled);
		filter.classList.add(disabled);
		removeAllRecipesIcon.classList.add(disabled);
		homeIcon.classList.add(disabled);
	} else {
		container.classList.remove(disabled);
		filter.classList.remove(disabled);
		removeAllRecipesIcon.classList.remove(disabled);
		homeIcon.classList.remove(disabled);
	}
};

/**
 * Display Add or Update message on
 * add recipe form accordingly
 */
const toggleAddUpdateForm = (actionMessage) => {
	recipeFormTitle.innerText = actionMessage;
	submitButton.value = actionMessage;
};

/**
 * Clear add or update status message
 * after 5 seconds
 */
const clearStatusMessage = () => {
	setTimeout(function () {
		statusMessage.innerText = "";
	}, 5000);
};

/**
 * Remove all child nodes of the container
 */
const clearContainer = () => {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
};

/**
 * Populate the updated recipe to recipe card
 */
const updateRecipeCard = (updatedRecipe) => {
	document.getElementById(`recipeTitle${updatedRecipe.id}`).innerText =
		updatedRecipe.name;
	document.getElementById(`recipeIngredients${updatedRecipe.id}`).innerText =
		updatedRecipe.ingredients;
	document.getElementById(`recipeSteps${updatedRecipe.id}`).innerText =
		updatedRecipe.steps;
	document.getElementById(`recipeImage${updatedRecipe.id}`).src =
		updatedRecipe.imageUrl;

	let commentsContainerDiv = document.getElementById(
		`commentsContainer${updatedRecipe.id}`
	);
	commentsContainerDiv.classList.add("commentsContainer");

	while (commentsContainerDiv.firstChild) {
		commentsContainerDiv.removeChild(commentsContainerDiv.firstChild);
	}

	if (updatedRecipe.comments.length > 0) {
		updatedRecipe.comments.map((comment) => {
			let commentDiv = document.createElement("div");
			let displayCommentDiv = document.createElement("div");
			let deleteSpan = document.createElement("span");
			commentDiv.classList.add("comment");
			displayCommentDiv.classList.add("displayComment");
			deleteSpan.classList.add("material-symbols-outlined");
			deleteSpan.classList.add("deleteCommentIcon");
			deleteSpan.innerText = "delete";
			deleteSpan.onclick = () =>
				deleteComment(updatedRecipe.id, comment.id);

			displayCommentDiv.innerHTML = comment.value;

			commentDiv.appendChild(displayCommentDiv);
			commentDiv.appendChild(deleteSpan);
			commentsContainerDiv.appendChild(commentDiv);
		});
	}
};

/**
 * Setting up add recipe form
 * for edit recipe by id
 */
const editRecipe = (id) => {
	recipeName.focus();
	toggleAddUpdateForm("Update Recipe");

	recipeName.value = document.getElementById(`recipeTitle${id}`).innerText;
	ingredients.value = document.getElementById(
		`recipeIngredients${id}`
	).innerText;
	steps.value = document.getElementById(`recipeSteps${id}`).innerText;
	imageUrl.value = document.getElementById(`recipeImage${id}`).src;

	statusMessage.innerText = "";

	recipeId.value = id;
	toggleUpdateSetup(true);
};

/**
 * Display one or delete all recipes
 * confirmation popup form
 */
const toggleDeleteConfirmPopup = (
	display,
	message = "",
	buttonId = "",
	id = ""
) => {
	popupDeleteConfirmDiv.style.display = display;
	deleteMessage.innerText = message;

	if (buttonId === "deleteAll") {
		deleteAllButton.style.display = "block";
		deleteOneButton.style.display = "none";
	} else if (buttonId === "deleteOne") {
		deleteAllButton.style.display = "none";
		deleteOneButton.style.display = "block";
		deleteOneButton.value = id;
	}
};

/**
 * Focus and clear search input box
 */
const clearSearchBar = () => {
	searchCriteria.focus();
	searchCriteria.value = "";
};

/**
 * Setting up post body before
 * sending recipe data to backend
 */
const postBody = (recipe, method) => {
	if (["GET", "DELETE"].includes(method)) {
		return { method };
	} else {
		// for POST and PUT
		return {
			method,
			body: JSON.stringify(recipe),
			headers: {
				"Content-Type":
					typeof recipe !== "string"
						? "application/json"
						: "text/plain",
			},
		};
	}
};

/**
 * Use fetch API to
 * fetch recipe (CRUD operations)
 * from backend
 */
const manageRecipes = async (urlEndpoint, recipe, method) => {
	const response = await fetch(
		`${BASE_URL}${urlEndpoint}`,
		postBody(recipe, method)
	);

	if (!response.ok) {
		throw new Error(response.error.message);
	}
	const updatedResponse = await response.json(); // already parse to json object

	return updatedResponse; // return a promise
};

/**
 * Remove a recipe by id
 */
const removeRecipe = async (id) => {
	const deleteMessage = await manageRecipes(
		`/recipes/${id}`,
		{},
		"DELETE"
	).catch((error) => {
		throw new Error(error);
	});

	if (deleteMessage) {
		statusMessage.innerText = deleteMessage.message;
		clearStatusMessage();
		fetchRecipes();
	}
};

/**
 * Display delete confirmation popup form
 * before deleting a recipe
 */
const deleteOneRecipe = (id, name) => {
	toggleDeleteConfirmPopup(
		"block",
		`Are you sure you want to delete recipe \n"${name}"?`,
		"deleteOne",
		id
	);
};

/**
 * Scroll the last comment
 * to the top of comments container
 */
const commentsScrollTop = (id) => {
	let commentsContainer = document.getElementById(`commentsContainer${id}`);

	const contentDivs = container.querySelectorAll(".comment");

	if (contentDivs.length > 0) {
		const lastContentDiv = contentDivs[contentDivs.length - 1];
		commentsContainer.scrollTop = lastContentDiv.offsetTop;
	}
};

/**
 * Get a recipe by id
 */
const getRecipe = async (id) => {
	const recipe = await manageRecipes(`/recipes/${id}`, {}, "GET").catch(
		(error) => {
			throw new Error(error);
		}
	);
	return recipe;
};

/**
 * Update a recipe by id
 */
const updateRecipe = async (recipe) => {
	const updatedRecipe = await manageRecipes(
		`/recipes/${recipe.id}`,
		recipe,
		"PUT"
	).catch((error) => {
		throw new Error(error);
	});

	return updatedRecipe;
};

/***
 * Add a comment for a specific recipe
 */
const addComment = async (event, id) => {
	if (event.keyCode === 13) {
		let commentInput = document.getElementById(`commentInput${id}`);

		// get the recipe by id
		const recipe = await getRecipe(id).catch((error) =>
			console.log(error.message)
		);

		if (recipe) {
			recipe.comments.push({
				id: recipe.comments.length + 1,
				value: commentInput.value,
			});

			const updatedRecipe = await updateRecipe(recipe).catch((error) =>
				console.log(error.message)
			);

			updateRecipeCard(updatedRecipe);
			commentsScrollTop(updatedRecipe.id);
			commentInput.value = "";
			commentInput.focus();
		}
	}
};

/**
 * Focus on the comment input box for writing a comment
 */
const commentRecipe = (id) => {
	let commentInput = document.getElementById(`commentInput${id}`);
	commentInput.focus();
};

/**
 * Delete a comment for a specific recipe
 */
const deleteComment = async (id, commentId) => {
	const recipe = await getRecipe(id).catch((error) =>
		console.log(error.message)
	);

	if (recipe) {
		recipe.comments.splice(
			recipe.comments.indexOf(
				recipe.comments.find((comment) => comment.id === commentId)
			),
			1
		);

		const updatedRecipe = await updateRecipe(recipe).catch((error) =>
			console.log(error.message)
		);

		updateRecipeCard(updatedRecipe);
	}
};

/**
 * Search recipes by user input criteria
 * (name or ingredients or steps)
 * display the matched results in recipe card
 */
const handleSearch = async () => {
	searchQuery = searchCriteria.value;

	if (searchQuery) {
		const matchedRecipes = await manageRecipes(
			`/recipes/search?query=${searchQuery}`,
			{},
			"POST"
		).catch((error) => {
			throw new Error(error);
		});

		if (matchedRecipes && matchedRecipes.length > 0) {
			clearContainer();
			searchMessageDiv.innerText = `Search results for "${searchQuery}" :`;
			matchedRecipes.forEach((recipe) => {
				// display the matched recipes
				displayRecipe(recipe);
			});
			toggleSideButtons(true);
		} else {
			// if there is no matched recipes
			clearSearchBar();
			searchMessageDiv.innerText = "Recipe not found.";
			clearContainer();
			toggleSideButtons(false);
		}
		container.style.width = "600px";
		container.prepend(searchMessageDiv);
	} else {
		// if search criteria is empty,
		// fetch and display all the recipes
		clearSearchBar();
		fetchRecipes();
	}
};

/**
 * Setting up after update a recipe
 */
const setupAfterUpdateRecipe = () => {
	statusMessage.innerText = `Recipe updated successfully.`;
	recipeId.value = "";
	clearStatusMessage();
	toggleAddUpdateForm("Add Recipe");
	emptyFields();
	toggleUpdateSetup(false);
};

/**
 * Handle update a recipe by id
 * in the add/update recipe form
 */
const handleUpdateRecipe = async (recipe) => {
	const updatedRecipe = await updateRecipe(recipe).catch((error) => {
		throw new Error(error);
	});

	updateRecipeCard(updatedRecipe);
	setupAfterUpdateRecipe();
};

/**
 * Handle add a new recipe
 * in the add/update recipe form
 */
const handleAddNewRecipe = async (userUpdatedRecipe) => {
	const newRecipe = await manageRecipes(
		"/recipes",
		userUpdatedRecipe,
		"POST"
	).catch((error) => {
		throw new Error(error);
	});

	if (newRecipe) {
		fetchRecipes();
		statusMessage.innerText = `Recipe added successfully.`;
		clearStatusMessage();
		toggleSideButtons(true);
		emptyFields();
	}
};

/**
 * Fetch all the recipes and
 * display them on the recipe card
 */
const fetchRecipes = async () => {
	clearContainer();

	const recipes = await manageRecipes("/recipes", {}, "GET").catch(
		(error) => {
			statusMessage.innerText = "Cannot load recipes.";
			console.log(error.message);
		}
	);
	const hasRecipes = recipes && recipes.length > 0;
	toggleSideButtons(hasRecipes);

	if (hasRecipes) {
		recipes.forEach((recipe) => {
			displayRecipe(recipe);
		});
	}
};

// web application first loaded
window.onload = () => {
	let ingredients = document.getElementById("ingredients");
	let steps = document.getElementById("steps");
	let imageUrl = document.getElementById("imageUrl");

	let scrollTopIcon = document.getElementById("scrollTopIcon");
	let removeAllRecipesIcon = document.getElementById("removeAllRecipesIcon");

	let closePopup = document.getElementById("closePopup");
	let deleteAll = document.getElementById("deleteAll");
	let cancelDelete = document.getElementById("cancelDelete");
	const searchRecipeIcon = document.getElementById("searchRecipeIcon");
	const searchCriteria = document.getElementById("searchCriteria");
	const homeIcon = document.getElementById("homeIcon");
	const sortRecipesDropdown = document.getElementById("sortRecipes");
	const commentIcon = document.getElementById("commentIcon");

	// fetch and load all the recipes upon webpage load
	fetchRecipes();

	/**
	 * Get user input for Add or Update recipe
	 */
	const getUserUpdatedRecipe = () => {
		return {
			id: 0,
			name: recipeName.value,
			ingredients: ingredients.value,
			steps: steps.value,
			imageUrl: imageUrl.value,
			dateAdded: "2023-09-01 14:30:45.123456",
			comments: [],
		};
	};

	// Handle submit button for Add or Update recipe
	recipeForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const userUpdatedRecipe = getUserUpdatedRecipe();

		// check user input error
		if (checkError(userUpdatedRecipe)) {
			return;
		}

		userUpdatedRecipe.ingredients = userUpdatedRecipe.ingredients
			.split(",")
			.map((item) => item.trim());

		// Update a recipe
		if (recipeId.value) {
			userUpdatedRecipe.id = recipeId.value;

			// fetch the recipe by id
			const recipe = await getRecipe(userUpdatedRecipe.id).catch(
				(error) => console.log(error.message)
			);

			if (recipe) {
				// populate comments from backend to userUpdatedRecipe
				// because user is not allowed to update comments here
				userUpdatedRecipe.comments = recipe.comments;

				handleUpdateRecipe(userUpdatedRecipe).catch((error) =>
					console.log(error.message)
				);
			}
		} else {
			// add a new recipe
			handleAddNewRecipe(userUpdatedRecipe).catch((error) =>
				console.log(error.message)
			);
		}
	});

	// delete all the recipes
	deleteAll.addEventListener("click", () => {
		manageRecipes("/recipes", {}, "DELETE")
			.then((deleteAllMessage) => {
				localRecipes = [];
				statusMessage.innerText = deleteAllMessage.message;
				clearStatusMessage();
				toggleSideButtons(false);
				clearContainer();
				toggleDeleteConfirmPopup("none");
			})
			.catch((error) => console.log(error.message));
	});

	// delete one recipe by id
	deleteOneButton.addEventListener("click", () => {
		removeRecipe(deleteOneButton.value).catch((error) =>
			console.log(error.message)
		);
		toggleDeleteConfirmPopup("none");
	});

	// display confirmation pop up form for delete all recipes
	removeAllRecipesIcon.addEventListener("click", () => {
		toggleDeleteConfirmPopup(
			"block",
			"Are you sure you want to delete all the recipes?",
			"deleteAll"
		);
	});

	// search a recipe based on user input search criteria
	// by search icon
	searchRecipeIcon.addEventListener("click", () => {
		handleSearch().catch((error) => console.log(error.message));
	});

	// search a recipe based on user input search criteria
	// by input box Enter key
	searchCriteria.addEventListener("keydown", (event) => {
		// Check if the key pressed is Enter (key code 13)
		if (event.keyCode === 13) {
			handleSearch().catch((error) => console.log(error.message));
		}
	});

	// sort recipes based on sort criteria
	// sort by dateAdded, recipe name or number of ingredients
	// ascending or descending
	sortRecipesDropdown.addEventListener("change", async () => {
		[sortCriteria, order] = sortRecipesDropdown.value.split("_");

		const sortedRecipes = await manageRecipes(
			`/recipes/?sort_criteria=${sortCriteria}&order=${order === "asc"}`,
			{},
			"GET"
		).catch((error) => console.log(error.message));

		if (sortedRecipes && sortedRecipes.length > 0) {
			clearContainer();
			sortedRecipes.forEach((recipe) => {
				// display the sorted recipes
				displayRecipe(recipe);
			});
			toggleSideButtons(true);
		} else {
			statusMessage.innerText = "Recipe not found.";
			clearStatusMessage();
		}
	});

	// fetch and display all the recipes
	// sorted by dateAdded descending
	homeIcon.addEventListener("click", () => {
		clearSearchBar();
		clearContainer();
		fetchRecipes();
	});

	// smoothly scroll to the top of the webpage
	scrollTopIcon.addEventListener("click", () => {
		const scrollDuration = 300; // duration in milliseconds
		const scrollStep = -window.scrollY / (scrollDuration / 15);

		scrollToTopAnimation = () => {
			if (window.scrollY > 0) {
				window.scrollBy(0, scrollStep);
				requestAnimationFrame(scrollToTopAnimation);
			}
		};

		requestAnimationFrame(scrollToTopAnimation);
	});

	// close delete confirmation popup form
	closePopup.addEventListener("click", () => {
		toggleDeleteConfirmPopup("none");
	});

	// close delete confirmation popup form
	cancelDelete.addEventListener("click", () => {
		toggleDeleteConfirmPopup("none");
	});
};
