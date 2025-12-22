import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/redux/productSlice";
import { Link } from "react-router-dom";
import RatingProvider from "@/components/ui/Rating";
import calculateAverageRating from "@/utils/calculateAvarageRating";
import { RootState, AppDispatch } from "@/redux/store/store";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { handleToggleFavorite } from "@/utils/favorites";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { fetchUserFavorites } from "@/utils/fetchUserFavorites";
import ReactLoading from "react-loading";

// Define types for the product and props
import { Product } from "@/types";

interface ProductListProps {
  selectedCategory?: string;
}

const ProductList: React.FC<ProductListProps> = ({ selectedCategory }) => {
  const dispatch: AppDispatch = useDispatch();
  const products = useSelector((state: RootState) => state.products.products);
  const productsStatus = useSelector(
    (state: RootState) => state.products.status
  );
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const auth = getAuth();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (productsStatus === "succeeded") {
      const productEntries = Object.entries(products);
      const filtered = productEntries
        .map(([id, product]) => ({
          // @ts-ignore
          id,
          ...(product as Product),
          isFavorite: userFavorites.includes(id), // Set initial favorite status
        }))
        .filter((product) =>
          selectedCategory
            ? product.categories.includes(selectedCategory)
            : true
        );
      setFilteredProducts(filtered);
    }
  }, [productsStatus, selectedCategory, products, userFavorites]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set userId from Firebase Authentication
        fetchUserFavorites(user.uid).then((favorites) => {
          setUserFavorites(favorites);
        });
      } else {
        setUserId(null);
        setUserFavorites([]);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const handleFavoriteClick = async (productId: string) => {
    if (userId) {
      try {
        const isCurrentlyFavorite = userFavorites.includes(productId);

        // Toggle favorite status
        await handleToggleFavorite(userId, productId);

        // Re-fetch user favorites to ensure local state is up-to-date
        const updatedFavorites = await fetchUserFavorites(userId);
        setUserFavorites(updatedFavorites);

        // Update filteredProducts with the latest favorite status
        setFilteredProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === productId
              ? { ...product, isFavorite: !isCurrentlyFavorite }
              : product
          )
        );
      } catch (error) {
        console.error("Error toggling favorite: ", error);
      }
    } else {
      console.error("User is not authenticated.");
    }
  };

  // if (true)
  if (productsStatus === "loading")
    return (
      <div className="w-screen flex items-center justify-center h-screen -mt-24">
        <ReactLoading type={"bars"} height={30} width={30} color="black" />
      </div>
    );
  if (productsStatus === "failed") return <div>Error fetching products</div>;
  if (filteredProducts.length === 0) return <div>No products available.</div>;

  return (
    <section
      id="product_list"
      className="bg-gray-50 py-8 antialiased dark:bg-gray-900 mt-10 md:py-12"
    >
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
          <div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Products {selectedCategory ? `in ${selectedCategory}` : ""}
            </h2>
          </div>
        </div>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const { averageRating, totalPeople } = calculateAverageRating(
              product.rating
            );
            return (
              <div
                key={product.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="h-56 w-full">
                  <Link to={`/product/${product.id}`}>
                    <img
                      className="mx-auto h-48 w-full object-cover rounded-lg dark:hidden"
                      src={product.defaultImage}
                      alt={product.name}
                    />
                  </Link>
                </div>
                <div className="pt-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="me-2 rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                      {product.discount}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        onClick={() => handleFavoriteClick(product.id)}
                      >
                        <span className="sr-only">
                          {product.isFavorite
                            ? "Remove from Favorites"
                            : "Add to Favorites"}
                        </span>
                        {product.isFavorite ? (
                          <FaHeart className="h-5 w-5" />
                        ) : (
                          <FaRegHeart className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Link
                    to={`/product/${product.id}`}
                    className="text-lg font-semibold leading-tight text-gray-900 hover:underline dark:text-white line-clamp-3"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center">
                      <RatingProvider
                        size={"16px"}
                        rating={Number(averageRating.toFixed(2))}
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {averageRating.toFixed(2)}
                    </p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {totalPeople}
                    </p>
                  </div>
                  <ul className="mt-2 flex items-center gap-4">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="2"
                            d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {feature}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">
                      ₹ {product.price}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductList;
