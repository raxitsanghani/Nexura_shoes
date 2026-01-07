
import { useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { FaSearch, FaBox, FaCheck, FaTruck, FaHome } from "react-icons/fa";
import ReactLoading from "react-loading";

const OrderTracking = () => {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const db = getFirestore();

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError("");
        setOrder(null);

        try {
            // Handle potential # prefix
            const searchId = orderId.trim().startsWith("#") ? orderId.trim() : `#${orderId.trim()}`;

            const docRef = doc(db, "orders", searchId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setOrder(docSnap.data());
            } else {
                setError("Order not found. Please check the Order ID.");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while fetching the order.");
        } finally {
            setLoading(false);
        }
    };

    const getStepStatus = (status: string, step: number) => {
        // 1: Processing, 2: Confirmed, 3: Shipped, 4: Delivered
        const statusMap: Record<string, number> = {
            "Processing": 1,
            "Confirmed": 2,
            "In transit": 3,
            "Delivered": 4,
            "Cancelled": 0
        };

        const currentStep = statusMap[status] || 1;
        if (status === "Cancelled") return "error";

        if (currentStep >= step) return "completed";
        return "pending";
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
                    <p className="mt-2 text-gray-600">Enter your Order ID to see the current status.</p>
                </div>

                {/* Search Form */}
                <div className="bg-white p-6 rounded-lg shadow-sm max-w-xl mx-auto mb-10">
                    <form onSubmit={handleTrack} className="flex gap-4">
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="#12345ABC"
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            {loading ? <ReactLoading type="spin" height={20} width={20} color="white" /> : <FaSearch />}
                            Track
                        </button>
                    </form>
                    {error && <p className="mt-3 text-red-500 text-sm text-center">{error}</p>}
                </div>

                {/* Order Details */}
                {order && (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order {order.orderId}</h2>
                                <p className="text-sm text-gray-500">Placed on {order.timestamp?.toDate().toLocaleDateString()}</p>
                            </div>
                            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                {order.status}
                            </span>
                        </div>

                        <div className="p-8">
                            {/* Stepper */}
                            {order.status !== 'Cancelled' ? (
                                <div className="relative flex justify-between mb-12">
                                    {/* Line */}
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 -translate-y-1/2" />

                                    {/* Steps */}
                                    {[
                                        { id: 1, label: "Processing", icon: FaBox },
                                        { id: 2, label: "Confirmed", icon: FaCheck },
                                        { id: 3, label: "Shipped", icon: FaTruck },
                                        { id: 4, label: "Delivered", icon: FaHome }
                                    ].map((step) => {
                                        const status = getStepStatus(order.status, step.id);
                                        let colorClass = "bg-gray-200 text-gray-400";
                                        if (status === "completed") colorClass = "bg-green-500 text-white";

                                        return (
                                            <div key={step.id} className="relative z-10 flex flex-col items-center bg-white px-2">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${colorClass}`}>
                                                    <step.icon size={16} />
                                                </div>
                                                <p className={`mt-2 text-xs font-bold uppercase ${status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-6 bg-red-50 rounded mb-8">
                                    <p className="text-red-600 font-bold">This order has been cancelled.</p>
                                </div>
                            )}

                            {/* Items */}
                            <h3 className="font-bold text-gray-900 mb-4">Items Ordered</h3>
                            <div className="space-y-4">
                                {order.products?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 py-2 border-b last:border-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                                            <img
                                                src={item.product?.defaultImage || Object.values(item.product?.imageUrls || {})[0]}
                                                alt={item.product?.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{item.product?.name}</p>
                                            <p className="text-xs text-gray-500">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-bold">₹{item.product?.price}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Shipping Info */}
                            <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Shipping Address</h4>
                                    <p className="text-gray-600">
                                        {order.address.name}<br />
                                        {order.address.city}, {order.address.state} {order.address.zipcode}<br />
                                        Phone: {order.address.mobile}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h4 className="font-bold text-gray-900 mb-2">Order Summary</h4>
                                    <p className="text-gray-600">Total: <span className="font-bold text-black">₹{order.price.toFixed(2)}</span></p>
                                    <p className="text-gray-600">Payment: <span className="uppercase">{order.paymentMethod}</span></p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
