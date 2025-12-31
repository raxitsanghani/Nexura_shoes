import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store/store";
import { closeCart, removeFromCart, updateQuantity } from "@/redux/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import { FaMinus, FaPlus, FaTimes } from "react-icons/fa";
import { getAuth } from "firebase/auth";

const MiniCart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, isOpen } = useSelector((state: RootState) => state.cart);
    // @ts-ignore
    const products = useSelector((state: RootState) => state.products.products);
    const cartRef = useRef<HTMLDivElement>(null);
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") dispatch(closeCart());
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [dispatch]);

    const cartItems = Object.values(items);

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => {
            // @ts-ignore
            const product = products[item.productId];
            if (!product) return total;
            return total + (Number(product.price) * item.quantity);
        }, 0);
    };

    const handleUpdateQuantity = async (productId: string, newQty: number) => {
        if (newQty < 1) return;

        dispatch(updateQuantity({ productId, quantity: newQty }));

        if (userId) {
            // Sync with backend if needed, logic might be complex as handleAddToCart usually adds
            // Ideally we should have a dedicated updateQuantity API or similar logic
            // providing logic to update existing backend quantity is out of immediate scope, 
            // assuming handleAddToCart handles increments, but for decrements we might need specific API.
            // For now, we update local state which is reflected.
        }
    };

    const handleRemove = async (productId: string) => {
        dispatch(removeFromCart(productId));
        // Need backend sync logic here ideally
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => dispatch(closeCart())}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
                        ref={cartRef}
                    >
                        {/* Header */}
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold uppercase tracking-tight">Your Bag ({cartItems.length})</h2>
                            <button
                                onClick={() => dispatch(closeCart())}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <FaTimes className="text-gray-600" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                                    <p className="mb-4">Your bag is empty.</p>
                                    <button
                                        onClick={() => dispatch(closeCart())}
                                        className="text-black underline font-bold"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                cartItems.map((item) => {
                                    // @ts-ignore
                                    const product = products[item.productId];
                                    if (!product) return null;

                                    // Find correct image based on color
                                    let image = product.defaultImage;
                                    if (item.color && product.imageUrls && product.imageUrls[item.color]) {
                                        image = product.imageUrls[item.color][0];
                                    }

                                    return (
                                        <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4">
                                            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                                                <img
                                                    src={image}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain mix-blend-multiply p-2"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-sm line-clamp-2 pr-2 leading-tight">
                                                            <Link to={`/product/${item.productId}`} onClick={() => dispatch(closeCart())}>
                                                                {product.name}
                                                            </Link>
                                                        </h3>
                                                        <span className="font-bold text-sm">₹{product.price}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 capitalize">{product.categories?.[0]}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                                        {item.size && <span className="bg-gray-100 px-2 py-0.5 rounded">Size: {item.size}</span>}
                                                        {item.color && <span className="bg-gray-100 px-2 py-0.5 rounded">Color: {item.color}</span>}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end mt-2">
                                                    <div className="flex items-center border rounded-sm">
                                                        <button
                                                            disabled={item.quantity <= 1}
                                                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                                        >
                                                            <FaMinus size={10} />
                                                        </button>
                                                        <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                                            className="px-2 py-1 hover:bg-gray-100 transition-colors"
                                                        >
                                                            <FaPlus size={10} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemove(item.productId)}
                                                        className="text-xs text-gray-400 hover:text-red-600 underline transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="p-5 border-t bg-gray-50">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-gray-600">Subtotal</span>
                                    <span className="text-xl font-bold">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        to="/cart"
                                        onClick={() => dispatch(closeCart())}
                                        className="flex items-center justify-center h-12 border border-black text-black font-bold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors bg-white rounded-sm"
                                    >
                                        View Cart
                                    </Link>
                                    <button
                                        onClick={() => {
                                            dispatch(closeCart());
                                            navigate('/checkout');
                                        }}
                                        className="flex items-center justify-center h-12 bg-black text-white font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors rounded-sm"
                                    >
                                        Checkout
                                    </button>
                                </div>
                                <p className="text-center text-[10px] text-gray-400 mt-3">
                                    Shipping & taxes calculated at checkout.
                                </p>
                            </div>
                        )}

                        {/* Recommendations */}
                        {cartItems.length > 0 && (
                            <div className="p-5 border-t bg-white">
                                <h3 className="font-bold text-sm uppercase mb-3">You May Also Like</h3>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                    {Object.values(products)
                                        // @ts-ignore
                                        .filter((p: any) => !(items as Record<string, any>)[p.id] && p.categories?.some((c: string) =>
                                            // @ts-ignore
                                            cartItems.some(item => products[item.productId]?.categories?.includes(c))
                                        ))
                                        .slice(0, 4)
                                        // @ts-ignore
                                        .map((p: any) => (
                                            <Link key={p.id} to={`/product/${p.id}`} onClick={() => dispatch(closeCart())} className="min-w-[120px] w-[120px] group">
                                                <div className="aspect-square bg-gray-50 rounded-md overflow-hidden mb-2">
                                                    <img src={p.defaultImage || (Object.values(p.imageUrls || {}) as any)[0]?.[0]} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                                                </div>
                                                <p className="text-xs font-medium truncate">{p.name}</p>
                                                <p className="text-xs text-gray-500">₹{p.price}</p>
                                            </Link>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MiniCart;
