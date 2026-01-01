import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store/store";
import { clearCart } from "@/redux/cartSlice";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { clearCartItems } from "@/utils/cartOperations";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaTruck, FaMapMarkerAlt, FaCreditCard, FaArrowLeft, FaArrowRight, FaCreditCard as FaCardIcon, FaMoneyBillWave, FaQrcode } from "react-icons/fa";
import { SiPhonepe } from "react-icons/si";

// Initialize Firestore
const db = getFirestore();

// Animation variants
const stepVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 }
};

const Checkout = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Data State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string>("standard");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // New Data State
  const [newAddress, setNewAddress] = useState({
    name: "",
    city: "",
    state: "",
    zipcode: "",
    mobile: "",
  });
  const [newCard, setNewCard] = useState({
    number: "",
    name: "",
    expiry: "",
  });
  const [upiId, setUpiId] = useState("");

  // Cart / Order State
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [prices, setPrices] = useState({
    total: 0,
    original: 0,
    discount: 0,
    tax: 0,
    pickup: 0
  });

  const { state } = location;
  const initialData = state || {};

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAddresses(userData?.addresses || []);
            setCards(userData?.cards || []);

            // Sync cart items if not passed via nav (though usually passed)
            if (!initialData.cartItems) {
              // Fallback or use cart slice logic if needed, but assuming passed for now or simple fetch
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  // Sync Prices & Cart
  useEffect(() => {
    if (initialData.cartItems) {
      setCartItems(initialData.cartItems);
      setPrices({
        total: initialData.totalPrice || 0,
        original: initialData.totalOriginalPrice || 0,
        discount: initialData.totalDiscount || 0,
        tax: initialData.tax || 0,
        pickup: initialData.storePickupFee || 0
      });
    }
  }, [initialData]);

  // Redux Integration for Cart & Products
  const dispatch = useDispatch();
  const { items: cartReduxItems } = useSelector((state: RootState) => state.cart);
  const products = useSelector((state: RootState) => state.products.products);

  useEffect(() => {
    if (Object.keys(cartReduxItems).length > 0 && products) {
      const items = Object.values(cartReduxItems).map((item: any) => {
        // @ts-ignore
        const product = products[item.productId];
        return { ...item, product };
      }).filter(i => i.product);

      // Calculate Totals within this simpler hook
      let subtotal = 0;
      let totalDiscount = 0;
      let tax = 0;

      items.forEach(item => {
        const price = Number(item.product.price);
        const qty = item.quantity;
        const itemTotal = price * qty;

        subtotal += itemTotal;

        // Calculate Discount
        let discountAmount = 0;
        if (item.product.discount) {
          const discountString = String(item.product.discount).replace(/[^0-9.]/g, '');
          const discountPercent = Number(discountString);
          if (!isNaN(discountPercent) && discountPercent > 0) {
            discountAmount = (itemTotal * (discountPercent / 100));
          }
        }
        totalDiscount += discountAmount;

        // GST Logic: Calculated on the discounted price
        // GST Slabs: Below 2500 -> 5%, Above 2500 -> 18%
        const discountedUnitPrice = price - (discountAmount / qty);
        const taxRate = discountedUnitPrice > 2500 ? 0.18 : 0.05;

        // Tax is calculated on the discounted total for this item
        tax += (itemTotal - discountAmount) * taxRate;
      });

      // Update state if cart items are present
      setCartItems(items);
      setPrices({
        total: subtotal - totalDiscount + tax,
        original: subtotal,
        discount: totalDiscount,
        tax: tax,
        pickup: 0
      });
    }
  }, [cartReduxItems, products]);

  const handleAddNewAddress = async (e: any) => {
    e.preventDefault();
    const { name, city, state, zipcode, mobile } = newAddress;
    if (!name || !city || !state || !zipcode || !mobile) return;

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          addresses: arrayUnion(newAddress),
        });
        setAddresses(prev => [...prev, newAddress]);
        setSelectedAddress(newAddress); // Auto select
        setNewAddress({ name: "", city: "", state: "", zipcode: "", mobile: "" });
      } catch (error) {
        console.error("Error adding address:", error);
      }
    }
  };

  const handleAddNewCard = async (e: any) => {
    e.preventDefault(); // Simplistic card add
    if (auth.currentUser && newCard.number) {
      // ... (Implement robust validation same as before)
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          cards: arrayUnion(newCard),
        });
        setCards(prev => [...prev, newCard]);
        setSelectedCard(newCard);
        setNewCard({ number: "", name: "", expiry: "" });
      } catch (err) { console.error(err); }
    }
  };

  const processOrder = async (finalPaymentMethod: string, extraDetails: any = {}) => {
    const user = auth.currentUser;
    if (user && selectedAddress) {
      try {
        const orderId = `#${Math.random().toString(36).toUpperCase().substr(2, 9)}`;
        const orderData = {
          orderId,
          userId: user.uid,
          price: prices.total,
          address: selectedAddress,
          shipping: selectedShipping,
          paymentMethod: finalPaymentMethod,
          card: finalPaymentMethod === 'card' ? selectedCard : null,
          ...extraDetails,
          products: cartItems,
          timestamp: Timestamp.now(),
          status: "Processing",
        };

        await setDoc(doc(db, "orders", orderId), orderData);
        await clearCartItems(user.uid);
        dispatch(clearCart());

        setTimeout(() => {
          navigate("/order-confirmation", { state: { order: orderData } });
        }, 1000);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    await processOrder(paymentMethod);
  };

  const handleUpiPayment = async () => {
    if (!upiId || !upiId.includes('@')) {
      alert("Please enter a valid UPI ID (e.g., user@upi)");
      return;
    }
    setLoading(true);
    // Simulate Payment Processing
    setTimeout(async () => {
      await processOrder('UPI', { upiId, status: 'success', transactionId: "TXN" + Date.now() });
    }, 3000);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 py-12 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Process Area */}
        <div className="lg:col-span-2">
          {/* Stepper */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center relative overflow-hidden">
            {[
              { id: 1, label: "Address", icon: FaMapMarkerAlt },
              { id: 2, label: "Shipping", icon: FaTruck },
              { id: 3, label: "Payment", icon: FaCreditCard },
              { id: 4, label: "Review", icon: FaCheck },
            ].map((s) => (
              <div key={s.id} className="z-10 flex flex-col items-center gap-2 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${step >= s.id ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}>
                  <s.icon size={14} />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wide ${step >= s.id ? 'text-black' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
            {/* Progress Bar */}
            <div className="absolute top-10 left-0 w-full h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Content Swapper */}
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm min-h-[500px]">
            <AnimatePresence mode="wait">

              {/* STEP 1: ADDRESS */}
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <h2 className="text-xl font-bold mb-6">Select Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAddress(addr)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${JSON.stringify(selectedAddress) === JSON.stringify(addr)
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-bold">{addr.name}</span>
                          {JSON.stringify(selectedAddress) === JSON.stringify(addr) && <FaCheck className="text-black" />}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {addr.city}, {addr.state} {addr.zipcode}<br />
                          {addr.mobile}
                        </p>
                      </div>
                    ))}
                    {/* Add Address Form (Simplified for brevity implies full inputs exist in real code) */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:border-black transition-colors min-h-[150px] cursor-pointer"
                      onClick={() => document.getElementById('new-address-form')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <span className="text-sm font-semibold">+ Add Address</span>
                    </div>
                  </div>

                  {/* Simple New Address Form */}
                  <div id="new-address-form" className="pt-6 border-t font-semibold">
                    <h3 className="mb-4">Or Add New Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Full Name" className="p-3 border rounded" value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} />
                      <input type="text" placeholder="Mobile" className="p-3 border rounded" value={newAddress.mobile} onChange={e => setNewAddress({ ...newAddress, mobile: e.target.value })} />
                      <input type="text" placeholder="City" className="p-3 border rounded" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                      <input type="text" placeholder="State" className="p-3 border rounded" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                      <input type="text" placeholder="Zipcode" className="p-3 border rounded" value={newAddress.zipcode} onChange={e => setNewAddress({ ...newAddress, zipcode: e.target.value })} />
                    </div>
                    <button onClick={handleAddNewAddress} className="mt-4 px-6 py-2 bg-black text-white rounded font-bold text-sm">Save Address</button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: SHIPPING */}
              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <h2 className="text-xl font-bold mb-6">Shipping Method</h2>
                  <div className="space-y-4">
                    <div
                      onClick={() => setSelectedShipping('standard')}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${selectedShipping === 'standard' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <FaTruck className="text-xl" />
                        <div>
                          <p className="font-bold">Standard Delivery</p>
                          <p className="text-sm text-gray-500">Estimated 5-7 Business Days</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">FREE</span>
                    </div>

                    <div
                      onClick={() => setSelectedShipping('express')}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${selectedShipping === 'express' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <FaTruck className="text-xl text-blue-600" />
                        <div>
                          <p className="font-bold">Express Delivery</p>
                          <p className="text-sm text-gray-500">Estimated 2-3 Business Days</p>
                        </div>
                      </div>
                      <span className="font-bold">₹250.00</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PAYMENT */}
              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                  {/* Payment Types */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div onClick={() => setPaymentMethod('card')} className={`p-4 border rounded-lg cursor-pointer flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                      <FaCardIcon /> <span>Card</span>
                    </div>
                    <div onClick={() => setPaymentMethod('upi')} className={`p-4 border rounded-lg cursor-pointer flex items-center justify-center gap-2 ${paymentMethod === 'upi' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                      <SiPhonepe /> <span>UPI</span>
                    </div>
                    <div onClick={() => setPaymentMethod('cod')} className={`p-4 border rounded-lg cursor-pointer flex items-center justify-center gap-2 ${paymentMethod === 'cod' ? 'border-black bg-black text-white' : 'border-gray-200'}`}>
                      <FaMoneyBillWave /> <span>COD</span>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="border p-6 rounded-lg bg-gray-50">
                      <h3 className="font-bold mb-4">Saved Cards</h3>
                      <div className="space-y-2 mb-6">
                        {cards.map((c, i) => (
                          <div key={i} onClick={() => setSelectedCard(c)} className={`p-3 bg-white border rounded flex justify-between cursor-pointer ${JSON.stringify(selectedCard) === JSON.stringify(c) ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
                            <span>{c.number}</span>
                            <span className="uppercase text-xs font-bold pt-1">{c.name}</span>
                          </div>
                        ))}
                      </div>

                      <h3 className="font-bold mb-4">Or Add New Card</h3>
                      <div className="space-y-3">
                        <input type="text" placeholder="Card Number" className="w-full p-3 border rounded" value={newCard.number} onChange={e => setNewCard({ ...newCard, number: e.target.value })} />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="MM/YY" className="p-3 border rounded" value={newCard.expiry} onChange={e => setNewCard({ ...newCard, expiry: e.target.value })} />
                          <input type="text" placeholder="Holder Name" className="p-3 border rounded" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} />
                        </div>
                        <button onClick={handleAddNewCard} className="w-full bg-gray-900 text-white p-3 rounded font-bold text-sm">Add Card</button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="border p-8 rounded-lg bg-gray-50 flex flex-col items-center text-center space-y-4">
                      <div className="bg-white p-4 rounded-full shadow text-green-600"><SiPhonepe size={40} /></div>
                      <h3 className="font-bold text-lg">Pay via UPI</h3>
                      <p className="text-gray-500 text-sm">Scan QR code or enter your UPI ID</p>

                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <FaQrcode size={100} className="mx-auto text-gray-800" />
                      </div>

                      <div className="w-full max-w-sm space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase self-start">UPI ID / VPA</label>
                        <input
                          type="text"
                          placeholder="username@bank"
                          className="w-full p-3 border rounded-lg font-medium focus:ring-2 focus:ring-black focus:outline-none"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={handleUpiPayment}
                        disabled={loading}
                        className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all w-full max-w-xs flex items-center justify-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {loading ? 'Processing...' : 'Connect UPI & Pay'}
                      </button>
                      {loading && <p className="text-xs text-gray-500 animate-pulse">Completing secure payment...</p>}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4: REVIEW */}
              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                  <h2 className="text-xl font-bold mb-6">Order Review</h2>

                  <div className="space-y-4 mb-8">
                    {cartItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 border-b pb-4">
                        <div className="w-16 h-16 bg-gray-100 rounded">
                          {/* Simplified display, ideally fetch product details */}
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">IMG</div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm line-clamp-1">Product ID: {item.productId}</h4>
                          <p className="text-xs text-gray-500">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{prices.original.toFixed(2)}</span></div>
                    <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{prices.discount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>GST (5% / 18%)</span><span>₹{prices.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>{selectedShipping === 'express' ? '₹250.00' : 'Free'}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2"><span>Total</span><span>₹{(prices.total + (selectedShipping === 'express' ? 250 : 0)).toFixed(2)}</span></div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 px-6 py-3 rounded bg-white border border-gray-300 font-bold hover:bg-gray-50">
                <FaArrowLeft /> Back
              </button>
            ) : <div />}

            {step < 4 && !(step === 3 && paymentMethod === 'upi') ? (
              <button
                onClick={() => {
                  if (step === 1 && !selectedAddress) return alert("Select Address");
                  nextStep();
                }}
                className="flex items-center gap-2 px-8 py-3 rounded bg-black text-white font-bold hover:bg-gray-900 shadow-lg"
              >
                Next Step <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'} <FaCheck />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Summary (Visible on large screens) */}
        <div className="hidden lg:block">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between"><span>Items</span><span>{cartItems.length}</span></div>
              <div className="flex justify-between"><span>GST</span><span>₹{prices.tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="capitalize">{selectedShipping}</span></div>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>₹{(prices.total + (selectedShipping === 'express' ? 250 : 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
