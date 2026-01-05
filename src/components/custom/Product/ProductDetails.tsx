import { useState, useEffect } from "react";
import { findMatchingKey } from "@/utils/productUtils";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import RatingProvider from "@/components/ui/Rating";
import VerticalTable from "@/components/ui/VerticalTable";
import { FaHeart, FaRegHeart, FaRulerHorizontal } from "react-icons/fa";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import { FiTruck, FiAlertCircle } from "react-icons/fi";
import useAverageRating from "@/hooks/useAvarageRating";
import { RootState, AppDispatch } from "@/redux/store/store";
import { addToCart } from "@/redux/cartSlice";
import { handleToggleFavorite } from "@/utils/favorites";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { fetchUserFavorites } from "@/utils/fetchUserFavorites";
import { handleAddToCart } from "@/utils/handleToggleCart";
import ReactLoading from "react-loading";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";

const ProductDetails = ({
  handleColorChange,
}: {
  handleColorChange: (color: string) => void;
}) => {
  const { id } = useParams<{ id: string }>();
  const dispatch: AppDispatch = useDispatch();
  // @ts-ignore
  const product = useSelector((state: RootState) => state.products.products[id]);

  const [sizeState, setSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [sizeError, setSizeError] = useState<boolean>(false);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    setSize(null);
    setSelectedColor(null);
    setSizeError(false);
  }, [id]);

  useEffect(() => {
    if (userId && product) {
      const checkFavoriteStatus = async () => {
        try {
          const userFavorites = await fetchUserFavorites(userId);
          // @ts-ignore
          setIsFavorite(userFavorites.includes(id));
        } catch (error) {
          console.error("Error fetching user favorites: ", error);
        }
      };
      checkFavoriteStatus();
    }
  }, [userId, id, product]);

  const rawSizes = product?.sizes || [];
  const sizes = Array.isArray(rawSizes)
    ? rawSizes
    : typeof rawSizes === "string"
      ? rawSizes.split(",").map(s => s.trim()).filter(s => s !== "")
      : [];

  const { averageRating, totalPeople } = useAverageRating(product?.rating || {});

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    handleColorChange(color);
  };

  const handleToggleFavoriteClick = async () => {
    if (userId) {
      try {
        // @ts-ignore
        await handleToggleFavorite(userId, id);
        setIsFavorite((prev) => !prev);
        toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
      } catch (error) {
        console.error("Error toggling favorite: ", error);
        toast.error("Failed to update favorites");
      }
    } else {
      toast.error("Please login to save favorites");
    }
  };

  const funcAddToCart = async () => {
    setSizeError(false);

    if (!sizeState) {
      setSizeError(true);
      toast.error("Please select a size", {
        icon: '👟',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      return;
    }

    const colorToUse = selectedColor || product.defaultColorName || "Default";

    if (userId) {
      try {
        // @ts-ignore
        await handleAddToCart(userId, id, 1, colorToUse, sizeState);
        dispatch(
          addToCart({
            // @ts-ignore
            productId: id,
            quantity: 1,
            color: colorToUse,
            size: sizeState,
          })
        );
        toast.success("Added to cart successfully!");
        // TODO: Trigger Mini Cart Open here
      } catch (error) {
        console.error("Error adding item to cart:", error);
        toast.error("Failed to add to cart");
      }
    } else {
      toast.error("Please login to add items to cart");
    }
  };

  if (!product)
    return (
      <div className="w-full flex items-center justify-center h-96">
        <ReactLoading type={"spin"} height={30} width={30} color="black" />
      </div>
    );

  // Discount Calculation
  const originalPrice = Number(product.price);
  const discountValue = parseFloat(product.discount || "0");
  const hasDiscount = !isNaN(discountValue) && discountValue > 0;
  const discountedPrice = hasDiscount ? originalPrice - (originalPrice * discountValue / 100) : originalPrice;

  return (
    <div className="md:px-8 py-8 md:ml-0 max-w-2xl">

      {/* Brand & Title */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium tracking-wide uppercase">
          <span>{product.brand || "ASICS"}</span>
          <span>•</span>
          <span>{product.categories?.[0] || "Men's Shoes"}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              ₹{discountedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">
                ₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          {hasDiscount && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded uppercase">
              {discountValue}% OFF
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex text-yellow-500">
            <RatingProvider size="18px" rating={averageRating || 0} />
          </div>
          <span className="text-sm text-gray-500 underline decoration-gray-300 underline-offset-4 cursor-pointer hover:text-gray-800 transition-colors">
            {totalPeople || 0} Reviews
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-gray-100 mb-8" />

      {/* Color Selection */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Color: <span className="text-gray-500 font-normal capitalize">{selectedColor || product.defaultColorName || "Default"}</span>
        </h3>
        <div className="flex flex-wrap gap-3">
          {/* Color logic similar to before but styled better */}
          {product.defaultImage && (
            <button
              onClick={() => { setSelectedColor(null); handleColorChange(""); }}
              className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${!selectedColor ? 'border-black ring-1 ring-black ring-offset-1' : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <img src={product.defaultImage} alt="Default" className="w-full h-full object-cover" />
            </button>
          )}
          {/* @ts-ignore */}
          {product.colors?.map((color) => {
            const matchedKey = findMatchingKey(product.imageUrls, color);
            const imageUrl = matchedKey ? product.imageUrls?.[matchedKey]?.[0] : null;
            if (!imageUrl) return null;
            return (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedColor === color ? 'border-black ring-1 ring-black ring-offset-1' : 'border-gray-200 hover:border-gray-400'
                  }`}
                title={color}
              >
                <img src={imageUrl} alt={color} className="w-full h-full object-cover" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${sizeError ? 'text-red-600' : 'text-gray-900'}`}>
            Select Size {sizeError && <span className="normal-case font-normal">- Required</span>}
          </h3>
          <button className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black transition-colors underline underline-offset-2">
            <FaRulerHorizontal /> Size Guide
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {/* @ts-ignore */}
          {sizes.length > 0 ? sizes.map((size) => (
            <button
              key={size}
              onClick={() => { setSize(String(size)); setSizeError(false); }}
              className={`h-12 flex items-center justify-center border rounded transition-all duration-200 text-sm font-medium
                        ${String(size) === sizeState
                  ? 'bg-black text-white border-black shadow-md transform scale-105'
                  : 'bg-white text-gray-900 border-gray-200 hover:border-black'
                }
                        ${sizeError ? 'border-red-200 bg-red-50' : ''}
                    `}
            >
              {size}
            </button>
          )) : <p className="text-sm text-gray-500 col-span-5">No sizes available.</p>}
        </div>
        <AnimatePresence>
          {sizeError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-2 text-red-600 text-sm"
            >
              <FiAlertCircle /> Please select a size to proceed.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 h-12">
          <button
            onClick={funcAddToCart}
            disabled={!sizeState && !product.oneSize}
            className={`flex-1 font-bold uppercase tracking-widest text-sm rounded transition-all shadow-lg flex items-center justify-center gap-2 group ${(!sizeState && !product.oneSize)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-900'
              }`}
          >
            <HiOutlineShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Add to Cart
          </button>
          <button
            onClick={handleToggleFavoriteClick}
            className="w-12 flex items-center justify-center border border-gray-300 rounded hover:border-black hover:bg-gray-50 transition-colors"
            title="Add to Favorites"
          >
            {isFavorite ? <FaHeart className="w-5 h-5 text-red-500" /> : <FaRegHeart className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3 mt-2">
          <FiTruck className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-gray-900">Free Standard Delivery</h4>
            <p className="text-xs text-gray-500 mt-1">Free standard delivery on orders over ₹3000. Estimated delivery 3-5 working days.</p>
          </div>
        </div>
      </div>

      {/* Description Preview (Short) */}
      <div className="mt-8 pt-8 border-t border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2">Description</h3>
        {typeof product.description === 'string' ? (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
            {product.description || "Experience premium comfort and performance with our latest collection. Designed for athletes and enthusiasts alike."}
          </p>
        ) : (
          // @ts-ignore
          <div className="text-sm text-gray-600">
            {/* @ts-ignore */}
            <VerticalTable product={{ description: product.description || {} }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
