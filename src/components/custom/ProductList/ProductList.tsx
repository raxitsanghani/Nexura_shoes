import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/redux/productSlice";
import { RootState, AppDispatch } from "@/redux/store/store";
import { handleToggleFavorite } from "@/utils/favorites";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { fetchUserFavorites } from "@/utils/fetchUserFavorites";
import ReactLoading from "react-loading";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import FilterSidebar, { FilterState } from "./FilterSidebar";

interface ProductListProps {
  selectedCategory?: string;
}

const ProductList: React.FC<ProductListProps> = ({ selectedCategory }) => {
  const dispatch: AppDispatch = useDispatch();
  const products = useSelector((state: RootState) => state.products.products);
  const productsStatus = useSelector((state: RootState) => state.products.status);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const auth = getAuth();

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    priceRange: { min: "", max: "" },
    sort: "newest",
    colors: [],
  });

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (productsStatus === "succeeded") {
      const productEntries = Object.entries(products);
      let tempProducts = productEntries
        .map(([id, product]) => ({
          // @ts-ignore
          id,
          ...(product as Product),
        }));

      // 1. Category Filtering
      if (selectedCategory) {
        if (selectedCategory.toLowerCase() === 'sale') {
          tempProducts = tempProducts.filter(p => {
            const d = p.discount ? p.discount.trim() : "";
            return d !== "" && d !== "0" && d !== "0%";
          });
        } else {
          const normalizedCategory = selectedCategory.trim().toLowerCase();
          tempProducts = tempProducts.filter(product =>
            product.categories && product.categories
              .map((c) => c.trim().toLowerCase())
              .some(c => {
                if (normalizedCategory === 'woman' && (c === 'women' || c === 'woman')) return true;
                if (normalizedCategory === 'man' && (c === 'men' || c === 'man')) return true;
                return c === normalizedCategory;
              })
          );
        }
      }

      // 2. Advanced Filtering
      // Price
      if (filterState.priceRange.min) {
        tempProducts = tempProducts.filter(p => Number(p.price) >= Number(filterState.priceRange.min));
      }
      if (filterState.priceRange.max) {
        tempProducts = tempProducts.filter(p => Number(p.price) <= Number(filterState.priceRange.max));
      }

      // Colors
      if (filterState.colors.length > 0) {
        tempProducts = tempProducts.filter(p => {
          // Check if product explicit colors or image keys match any selected color
          const pColors = (p.colors || []).concat(Object.keys(p.imageUrls || {}));
          return pColors.some(pc =>
            filterState.colors.some(selected => pc.toLowerCase().includes(selected.toLowerCase()))
          );
        });
      }

      // 3. Sorting
      tempProducts.sort((a: any, b: any) => {
        switch (filterState.sort) {
          case 'price_asc':
            return Number(a.price) - Number(b.price);
          case 'price_desc':
            return Number(b.price) - Number(a.price);
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'newest':
          default:
            const dateA = a.createdAt || "";
            const dateB = b.createdAt || "";
            return dateB.localeCompare(dateA);
        }
      });

      setFilteredProducts(tempProducts);
    }
  }, [productsStatus, selectedCategory, products, filterState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
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
        await handleToggleFavorite(userId, productId);

        // Update local state immediately for UI responsiveness
        if (isCurrentlyFavorite) {
          setUserFavorites(prev => prev.filter(id => id !== productId));
        } else {
          setUserFavorites(prev => [...prev, productId]);
        }

      } catch (error) {
        console.error("Error toggling favorite: ", error);
      }
    } else {
      console.error("User is not authenticated.");
      // Ideally show a toast here
    }
  };

  if (productsStatus === "loading")
    return (
      <div className="w-screen flex items-center justify-center h-screen -mt-14">
        <ReactLoading type={"bars"} height={30} width={30} color="black" />
      </div>
    );
  if (productsStatus === "failed") return <div>Error fetching products</div>;
  if (filteredProducts.length === 0 && !filterState.priceRange.min && !filterState.priceRange.max && filterState.colors.length === 0) return <div>No products available.</div>;

  return (
    <section id="product_list" className="bg-white py-8 antialiased dark:bg-gray-900 mt-0 md:py-8">
      <div className="mx-auto max-w-[1440px] px-4">

        {/* Header / Breadcrumbs Style Title */}
        <div className="mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
            {selectedCategory || "All Products"}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <FilterSidebar filterState={filterState} setFilterState={setFilterState} />

          {/* Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No products match your filters.</div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={userFavorites.includes(product.id)}
                    onToggleFavorite={handleFavoriteClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductList;
