import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAuth } from "firebase/auth";
import { fetchProducts } from "@/redux/productSlice";
import { fetchCartItems } from "@/utils/fetchCartItems";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from "@/redux/cartSlice";
import {
  updateCartItem,
  removeCartItem,
  clearCartItems,
} from "@/utils/cartOperations";
import { RootState, AppDispatch } from "@/redux/store/store";
import { Link, useNavigate } from "react-router-dom";
import Images from "@/assets";
import ReactLoading from "react-loading";
import { toast } from 'react-hot-toast';

const Cart = () => {
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const products = useSelector((state: RootState) => state.products.products);
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    const fetchCart = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const cart = await fetchCartItems(user.uid);

          // First clear the existing cart in Redux
          dispatch(clearCart());

          // Then add each item from the fetched cart
          Object.entries(cart).forEach(
            ([productId, { quantity, color, size }]) => {
              dispatch(addToCart({ productId, quantity, color, size }));
            }
          );
        } catch (error) {
          console.error("Error fetching cart items: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCart();
  }, [auth.currentUser, dispatch]);
  const handleQuantityChange = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) return;

      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("User not authenticated");
        return;
      }

      try {
        await updateCartItem(userId, productId, quantity);
        dispatch(updateQuantity({ productId, quantity }));
      } catch (error) {
        console.error("Error updating cart item:", error);
      }
    },
    [auth.currentUser?.uid, dispatch]
  );

  const decrementQuantity = useCallback(
    (productId: string, currentQuantity: number) => {
      if (currentQuantity > 1) {
        handleQuantityChange(productId, currentQuantity - 1);
      }
    },
    [handleQuantityChange]
  );
  const incrementQuantity = useCallback(
    (productId: string, currentQuantity: number) => {
      handleQuantityChange(productId, currentQuantity + 1);
    },
    [handleQuantityChange]
  );

  // Handle remove item
  const handleRemove = useCallback(
    async (productId: string) => {
      try {
        await removeCartItem(auth.currentUser?.uid!, productId);
        dispatch(removeFromCart(productId));
      } catch (error) {
        console.error("Error removing cart item: ", error);
      }
    },
    [auth.currentUser?.uid, dispatch]
  );
  // Handle clear cart
  const handleClearCart = useCallback(async () => {
    try {
      await clearCartItems(auth.currentUser?.uid!);
      dispatch(clearCart());
    } catch (error) {
      console.error("Error clearing cart items: ", error);
    }
  }, [auth.currentUser?.uid, dispatch]);

  // Memoized total price calculation
  const getTotalPrice = useMemo(() => {
    return Object.entries(cartItems).reduce(
      (total, [productId, { quantity }]) => {
        // @ts-ignore
        const product = products[productId];
        return total + Number(product?.price || 0) * Number(quantity);
      },
      0
    );
  }, [cartItems, products]);

  // Calculate discount
  const parseDiscount = (discount: string) => {
    const match = discount.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Memoized discount calculation
  const getTotalDiscount = useMemo(() => {
    return Object.entries(cartItems).reduce(
      (total, [productId, { quantity }]) => {
        // @ts-ignore
        const product = products[productId];
        if (!product || !product.discount) return total;

        const discount = product.discount;
        const numericDiscount = parseDiscount(discount);

        if (discount.includes("%")) {
          return total + (Number(numericDiscount) / 100) * (Number(quantity) * Number(product.price));
        } else {
          return total + numericDiscount * quantity;
        }
      },
      0
    );
  }, [cartItems, products]);

  const getStorePickupFee = (totalOriginalPrice: number) => {
    return totalOriginalPrice > 50 ? 0 : totalOriginalPrice > 0 ? 99 : 0;
  };

  const getTax = (totalPrice: number) => totalPrice * 0.05;

  const totalOriginalPrice = getTotalPrice;
  const totalDiscount = getTotalDiscount;
  const storePickupFee = getStorePickupFee(totalOriginalPrice);
  const tax = getTax(totalOriginalPrice);
  const totalPrice = totalOriginalPrice - totalDiscount + storePickupFee + tax;
  // Coupon Logic
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherCode.trim().toUpperCase() === "WELCOME20") {
      setVoucherDiscount(20);
      toast.success("Coupon applied! ₹20 discount.");
    } else if (voucherCode.trim().toUpperCase() === "SALE10") {
      setVoucherDiscount(10);
      toast.success("Coupon applied! ₹10 discount.");
    } else {
      setVoucherDiscount(0);
      toast.error("Invalid coupon code.");
    }
  };

  const handleCheckout = () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      navigate("/checkout", {
        state: {
          totalPrice: totalPrice - voucherDiscount, // Apply the voucher discount here
          totalOriginalPrice: totalOriginalPrice || 0,
          totalDiscount: totalDiscount + voucherDiscount,
          storePickupFee: storePickupFee || 0,
          tax: tax || 0,
          cartItems: cartItems || 0,
          voucherDiscount: voucherDiscount,
        },
      });
    }
  };
  if (loading)
    return (
      <div className="w-screen  h-screen flex items-center justify-center  ">
        <ReactLoading type={"bars"} height={30} width={30} color="black" />
      </div>
    );
  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Shopping Cart
        </h2>

        {Object.keys(cartItems).length === 0 ? (
          <>
            <div className="text-center">
              <img
                src={Images.cart}
                alt="Empty Cart"
                className="mx-auto w-1/4 h-auto"
              />
              <p className="mt-4 text-lg">Your cart is empty</p>
            </div>
          </>
        ) : (
          <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
            <div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl">
              {Object.entries(cartItems).map(([productId, item]) => {
                // @ts-ignore
                const product = products[productId];
                // this is discount and we want total discount for below cide
                if (!product) return null;

                const totalPrice = (Number(product.price) * Number(item.quantity)).toFixed(2);
                return (
                  <div className="space-y-6" key={productId}>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-6">
                      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
                        <a href="#" className="shrink-0 md:order-1">
                          <img
                            className="h-20 w-20 rounded-md"
                            src={product.defaultImage}
                            alt={product.name}
                          />
                        </a>
                        <label htmlFor="counter-input" className="sr-only">
                          Choose quantity:
                        </label>
                        <div className="flex items-center justify-between md:order-3 md:justify-end">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                decrementQuantity(productId, item.quantity)
                              }
                              disabled={item.quantity <= 1}
                              type="button"
                              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                            >
                              <svg
                                className="h-2.5 w-2.5 text-gray-900 dark:text-white"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 18 2"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M1 1h16"
                                />
                              </svg>
                            </button>
                            <input
                              type="text"
                              id="counter-input"
                              data-input-counter=""
                              className="w-10 shrink-0 border-0 bg-transparent text-center text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                              value={item.quantity}
                              readOnly
                            />
                            <button
                              onClick={() =>
                                incrementQuantity(productId, item.quantity)
                              }
                              type="button"
                              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                            >
                              <svg
                                className="h-2.5 w-2.5 text-gray-900 dark:text-white"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 18 18"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 1v16M1 9h16"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-end md:order-4 md:w-32">
                            <p className="text-base font-bold text-gray-900 dark:text-white">
                              ₹{totalPrice}
                            </p>
                          </div>
                        </div>
                        <div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
                          <a
                            href="#"
                            className="text-base font-medium text-gray-900 hover:underline dark:text-white"
                          >
                            {product.name}
                          </a>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleRemove(productId)}
                              className="inline-flex items-center text-sm font-medium text-red-600 hover:underline dark:text-red-500"
                            >
                              <svg
                                className="me-1.5 h-5 w-5"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                width={24}
                                height={24}
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18 17.94 6M18 18 6.06 6"
                                />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* </>
            )} */}
            </div>
            <div className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full">
              <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order summary
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                        Original price
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        ₹{totalOriginalPrice.toFixed(2)}
                        {/* Display total price here */}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                        Savings
                      </dt>
                      <dd className="text-base font-medium text-green-600">
                        - ₹{totalDiscount.toFixed(2)}
                        {/* Display total Discount here */}
                      </dd>
                    </dl>
                    {voucherDiscount > 0 && (
                      <dl className="flex items-center justify-between gap-4">
                        <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                          Voucher
                        </dt>
                        <dd className="text-base font-medium text-green-600">
                          - ₹{voucherDiscount}
                        </dd>
                      </dl>
                    )}
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                        Store Pickup
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        + ₹{storePickupFee.toFixed(2)}
                        {/* if the item original price is more than 50₹ than pickup fees are free */}
                      </dd>
                    </dl>
                    <dl className="flex items-center justify-between gap-4">
                      <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                        Tax
                      </dt>
                      <dd className="text-base font-medium text-gray-900 dark:text-white">
                        + ₹{tax.toFixed(2)}
                        {/* Tax will be 5% on every product */}
                      </dd>
                    </dl>
                  </div>
                  <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <dt className="text-base font-bold text-gray-900 dark:text-white">
                      Total
                    </dt>
                    <dd className="text-base font-bold text-gray-900 dark:text-white">
                      ₹{(totalPrice - voucherDiscount).toFixed(2)}
                    </dd>
                  </dl>
                </div>
                <dd
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-center rounded-lg bg-orange-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 cursor-pointer"
                >
                  Proceed to Checkout
                </dd>
                {totalOriginalPrice !== 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleClearCart}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline hover:no-underline dark:text-primary-500"
                    >
                      Clear Cart
                    </button>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {" "}
                      or{" "}
                    </span>
                    <Link
                      to={"/"}
                      title=""
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline hover:no-underline dark:text-primary-500"
                    >
                      Continue Shopping
                      <svg
                        className="h-5 w-5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 12H5m14 0-4 4m4-4-4-4"
                        />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <Link to={"/"}>Add Product to cart</Link>
                )}
              </div>
              <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <form className="space-y-4" onSubmit={handleApplyVoucher}>
                  <div>
                    <label
                      htmlFor="voucher"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Do you have a voucher or gift card?{" "}
                    </label>
                    <input
                      type="text"
                      id="voucher"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-lg bg-blue-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                  >
                    Apply
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Cart;
