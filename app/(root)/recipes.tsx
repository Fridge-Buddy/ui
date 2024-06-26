import { View, Pressable, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { useUser } from "../../contexts/UserContext";
import { useGraphQLClient } from "../../contexts/GraphQLClientContext";
import { useRefresh } from "../../contexts/RefreshContext";
import { getUserRecipes, searchRecipes } from "../../src/graphql/queries";
import { Redirect, useRouter } from "expo-router";
import { Recipe, ingredient, storedRecipe } from '../../src/API';
import { useState, useEffect } from "react";
import RecipeWidget from "../../components/RecipeWidget";
import { addUserRecipe, removeRecipe } from "../../src/graphql/mutations";
import Spinner from "../../components/Spinner";

export default function Recipes() {
    const client = useGraphQLClient();
    const {user, setUser} = useUser();
    const [search, setSearch] = useState('');
    const router = useRouter();
    const {refresh, setRefresh, expRefresh, setExpRefresh} = useRefresh();
    const [loading, setLoading] = useState(false);

    // Get saved recipes using GraphQL
    const fetchRecipes = async() => {
        setLoading(true);
        try {
            const result2 = await client.graphql({
                query: getUserRecipes,
                variables: {
                    pk: user.userId
                },
            })
            // Map the gathered recipe information to the Recipe datatype
            if (result2.data && result2.data.getUserRecipes) {
                const saved_recipes : storedRecipe[] = result2.data.getUserRecipes.filter((recipe: storedRecipe) => recipe.recipe_name !== null)
                const saved_recipes_parsed : Recipe[] = saved_recipes.map(recipe => ({
                    sk: recipe.sk,
                    recipe_name: recipe.recipe_name,
                    ingredients: recipe.ingredient_amts.map((amt, index) : ingredient => ({
                        amt: amt,
                        name: recipe.ingredient_names[index]
                    })),
                    img: recipe.img,
                    steps: recipe.steps,
                    calories: recipe.calories,
                    saved: true
                }));
                // Update current user's recipes
                setUser({
                    isLoggedIn: user.isLoggedIn,
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    recipes: saved_recipes_parsed
                });
                // console.log(saved_recipes_parsed)
            }
        }
        catch (error) {
            console.log("Failed to fetch user recipes:", error);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user.recipes === undefined || user.recipes.length == 0) {
            fetchRecipes();
        }
    }, [user.recipes, refresh, loading])

    // Get saved recipes using GraphQL
    const searchRecipesHandler = async() => {
        
        // console.log("here");
        if (search && search != '') {
            setLoading(true);
            try {
                // Get user recipes
                const result = await client.graphql({
                    query: getUserRecipes,
                    variables: {
                        pk: user.userId
                    },
                })
                // Map the gathered recipe information to the Recipe datatype
                if (result.data && result.data.getUserRecipes) {
                    const saved_recipes : storedRecipe[] = result.data.getUserRecipes.filter((recipe: storedRecipe) => recipe.recipe_name !== null)
                    const saved_recipes_parsed : Recipe[] = saved_recipes.map(recipe => ({
                        sk: recipe.sk,
                        recipe_name: recipe.recipe_name,
                        ingredients: recipe.ingredient_amts.map((amt, index) : ingredient => ({
                            amt: amt,
                            name: recipe.ingredient_names[index]
                        })),
                        img: recipe.img,
                        steps: recipe.steps,
                        calories: recipe.calories,
                        saved: true
                    }));
                    // Update current user's recipes
                    user.recipes = saved_recipes_parsed;
                    // console.log(saved_recipes_parsed)
                }
                else {
                    user.recipes = [];
                }
            }
            catch (error) {
                console.log("Failed to fetch user recipes");
                setLoading(false);
            }
            console.log(user.recipes);

            try {
                const result2 = await client.graphql({
                    query: searchRecipes,
                    variables: {
                        name: search
                    },
                })
                // console.log(result2);
                // Map the gathered recipe information to the Recipe datatype
                if (result2.data && result2.data.searchRecipes) {
                    const searched_recipes : Recipe[] = result2.data.searchRecipes
                    console.log(searched_recipes)
                    // Update current user's recipes
                    user.recipes = user.recipes? [...searched_recipes, ...user.recipes] : searched_recipes
                    // console.log(user.recipes);
                    // console.log(saved_recipes_parsed)
                    setRefresh(!refresh);
                }
            }
            catch(error) {
                console.log("Failed to search for user recipe", error);
            }
            finally {
                setLoading(false);
                setSearch('');
            }
        }
    }


    // Handler for saving / deleting an item based on whether or not the current item is saved or not
    const recipeButtonHandler = async (index: number) => {
        if (user.isLoggedIn) {
            const recipe = user.recipes[index];
            if (!recipe) return;
            
            // If the recipe is saved, then delete it
            if (recipe.saved) {
                // Check that the recipe has the required keys
                if (!user.userId || !recipe.sk) {
                    console.log('Error: No Primary or secondary key');
                    return;
                }

                try {
                    // Run deleteItem GraphQL mutation
                    const deleteResult = await client.graphql({
                        query: removeRecipe,
                        variables: {
                            input: {
                                pk: user.userId,
                                sk: recipe.sk,
                            }
                        },
                    });
            
                    console.log('Recipe deleted successfully', deleteResult);
                    // Set the recipe to not saved
                    user.recipes[index].saved = false;
                    
        
                } catch (error) {
                    console.error('Error deleting recipe', error);
                }
            }
            // If the recipe is not saved, then save it
            else {
                const amts = recipe.ingredients.map((ingredient : ingredient) => ingredient.amt);
                const names = recipe.ingredients.map((ingredient : ingredient) => ingredient.name);

                try {
                    const addResult = await client.graphql({
                        query: addUserRecipe,
                        variables: {
                            input: {
                                pk: user.userId,
                                sk: recipe.sk,
                                recipe_name: recipe.recipe_name,
                                img: recipe.img,
                                steps: recipe.steps,
                                ingredient_names: amts,
                                ingredient_amts: names,
                                calories: recipe.calories
                            }
                        },
                    })
                    user.recipes[index].saved = true;
                    console.log('Recipe saved successfully', addResult);
                } catch (error) {
                    console.error('Error saving recipe', error);
                }
            }
        }
        else {
            console.log("No user logged in")
        }
    }

    return (
        user.isLoggedIn ?
        <>
            <View style={styles.search}>
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={searchRecipesHandler}
                /> 
            </View>
            {!loading? (
                <>

                {(user.recipes === undefined || user.recipes.length == 0)? (
                    <View style={styles.container}>
                        <Pressable onPress={() => router.push('/home')} style={({pressed}) => [{backgroundColor: pressed ? 'lightgray' : 'white', }, styles.homeButton,]}><Text>Generate from Ingredients</Text></Pressable>
                    </View>
                ):(
                    <ScrollView style={styles.recipeList}>
                        {user.recipes.map((recipe: Recipe, i: any) => (
                            <View key={i} style={styles.wrapper}>
                                <RecipeWidget recipe={recipe} recipeButtonHandler={() => recipeButtonHandler(i)}/>
                            </View>
                        ))}
                        <View style={{height: 10,}}></View>
                    </ScrollView>
                )}
                </>
            ) : (
                <Spinner/>
            )}
            
        </>
        :
        <Redirect href="/" />
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        height: '100%',
        paddingBottom: 128,
    },
    homeButton: {
        padding: 10,
        borderRadius: 10,
        elevation: 2,
    },
    recipeList: {
        backgroundColor: 'paleturquoise', 
        width: '100%', 
        flexGrow: 1,
        padding: 10,
    },
    search: {
        backgroundColor: 'white',
        padding: 10,
        width: '100%',
        zIndex: 40,
        shadowColor: 'black',
    },
    searchInput: {
        backgroundColor: 'paleturquoise',
        padding: 10,
        paddingLeft: 20,
        borderRadius: 25,
        color: 'gray',
    },
    wrapper: {
        marginBottom: 10,
    },
    recipeContiner: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        marginTop: 5,
        marginHorizontal: 10,
        elevation: 2,
    },
    buttonsContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 20,
        marginLeft: 10,
        // height: '100%',
        // backgroundColor: 'red',
    },
    button: {
        // backgroundColor: 'lightblue',
        borderRadius: 10,
        height: 20,
        padding: 0,
        // backgroundColor: 'red'
    },
});