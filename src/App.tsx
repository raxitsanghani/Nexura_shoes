import React, { useEffect, Suspense } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Layout from "./layout/Layout";
// Lazy load pages
const Home = React.lazy(() => import("./pages/Home"));
const Woman = React.lazy(() => import("./pages/Woman"));
const Man = React.lazy(() => import("./pages/Man"));
const Kids = React.lazy(() => import("./pages/Kids"));
const Sports = React.lazy(() => import("./pages/Sports"));
const Sale = React.lazy(() => import("./pages/Sale"));
const Product = React.lazy(() => import("./pages/Other/Product"));
const Cart = React.lazy(() => import("./pages/Other/Cart"));
const Checkout = React.lazy(() => import("./pages/Other/Checkout"));
const Favorites = React.lazy(() => import("./pages/Other/Favorites"));
const Orders = React.lazy(() => import("./pages/Other/Orders"));
const Profile = React.lazy(() => import("./pages/Other/Profile"));
const OrderConfirmation = React.lazy(() => import("./pages/Other/OrderConfirm"));

const OrderTracking = React.lazy(() => import("./pages/Other/OrderTracking"));
import Signup from "./Auth/Signup";
import Login from "./Auth/Login";
import ProtectedRoute from "./pages/Protected/ProtectedRoute";
import AdminRoutes from "./Admin/AdminRoutes";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, onSnapshot, getDoc } from "firebase/firestore";
import { Toaster, toast } from 'react-hot-toast';
import ReactLoading from "react-loading";

const capitalizePath = (path: string) => {
  const capitalized = path.slice(1).replace(/^\w/, (c) => c.toUpperCase());
  return capitalized;
};

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const titleElement = document.getElementById("title");
    if (titleElement) {
      if (location.pathname === "/") {
        document.title = "Nexura Sports - Home";
      } else {
        const pathName = capitalizePath(location.pathname);
        document.title = "Nexura Sports - " + pathName;
      }
    }
  }, [location]);

  // Real-time Authentication Monitoring
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // SKIP CHECKS ON SIGNUP PAGE or if explicitly navigating there
      if (location.pathname === "/signup") {
        return;
      }

      if (currentUser) {
        // 1. Check if user is in 'deleted_users' blacklist (Historical check/Login check)
        const deletedRef = doc(db, "deleted_users", currentUser.email || "unknown");

        try {
          const deletedSnap = await getDoc(deletedRef);
          if (deletedSnap.exists()) {
            await signOut(auth);
            toast.error("Your account has been permanently deleted.", {
              id: 'auth-error', // Prevent duplicate toasts
              duration: 5000,
              style: { background: '#fff', color: '#F44336' }
            });
            navigate("/login");
            return;
          }
        } catch (e) {
          console.error("Auth check error", e);
        }

        // 2. Real-time User Document Listener
        const userRef = doc(db, "users", currentUser.uid);

        const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
          // SKIP IF ON SIGNUP
          if (location.pathname === '/signup') return;

          // Case A: User Document Deleted (or Not Created Yet)
          if (!docSnap.exists()) {
            // GRACE PERIOD: If user was created < 15 seconds ago, ignore missing doc logic.
            const creationTime = currentUser.metadata.creationTime;
            if (creationTime) {
              const createdMs = new Date(creationTime).getTime();
              const nowMs = new Date().getTime();
              // 15 seconds grace period for doc creation
              if (nowMs - createdMs < 15000) {
                return;
              }
            }

            if (auth.currentUser) {
              await signOut(auth);
              toast.error("Your account has been permanently deleted.", {
                id: 'auth-error-deleted',
                duration: 5000
              });
              navigate("/login");
            }
          }
          // Case B: User Blocked
          else if (docSnap.data().isBlocked) {
            if (auth.currentUser) {
              await signOut(auth);
              toast.error("Your account has been blocked by the administrator.", {
                id: 'auth-error-blocked',
                duration: 5000
              });
              navigate("/login");
            }
          }
        }, (error) => {
          console.log("Auth snapshot error (likely permission or doc missing):", error);
          if (location.pathname === '/signup') return;

          if (auth.currentUser) {
            const creationTime = currentUser.metadata.creationTime;
            if (creationTime && (new Date().getTime() - new Date(creationTime).getTime() < 15000)) {
              return;
            }
            signOut(auth);
            navigate("/login");
          }
        });

        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, [navigate, location.pathname]);

  // Network & Ad-Blocker Detection
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        // Simple fetch to a google resource to check if blocked
        await fetch("https://firestore.googleapis.com", { mode: 'no-cors' });
      } catch (e) {
        console.log("Potential Ad-Blocker blocking Firestore", e);
        // Verify if it's just offline
        if (navigator.onLine) {
          toast("It looks like an Ad Blocker is blocking the database connection. Please disable it for this site to function correctly.", {
            duration: 8000,
            id: "adblock-warning",
            icon: '⚠️',
            style: {
              background: '#333',
              color: '#fff',
            }
          });
        }
      }
    };

    // Run once on mount
    checkConnectivity();

    const handleOffline = () => toast.error("You are offline. Some features may not work.", { id: "offline-toast" });
    const handleOnline = () => {
      toast.success("You are back online!", { id: "online-toast" }); // Connection recovery
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    }
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={
        <div className="w-screen h-screen flex items-center justify-center">
          <ReactLoading type={"bars"} height={30} width={30} color="black" />
        </div>
      }>
        <Routes>
          {/* Public routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/*" element={<AdminRoutes />} /> {/* Admin routes */}
          {/* Main website routes with layout */}
          <Route element={<Layout />}>
            <Route path="/" index element={<ProtectedRoute element={<Home />} />} />
            <Route path="/woman" element={<ProtectedRoute element={<Woman />} />} />
            <Route
              path="/product/:id"
              element={<ProtectedRoute element={<Product />} />}
            />
            <Route path="/man" element={<ProtectedRoute element={<Man />} />} />
            <Route path="/kids" element={<ProtectedRoute element={<Kids />} />} />
            <Route
              path="/sports"
              element={<ProtectedRoute element={<Sports />} />}
            />

            <Route
              path="/profile"
              element={<ProtectedRoute element={<Profile />} />}
            />
            <Route path="/sale" element={<ProtectedRoute element={<Sale />} />} />
            <Route path="/cart" element={<ProtectedRoute element={<Cart />} />} />
            <Route
              path="/checkout"
              element={<Checkout />}
            />
            <Route
              path="/favorites"
              element={<ProtectedRoute element={<Favorites />} />}
            />
            <Route
              path="/order-confirmation"
              element={<ProtectedRoute element={<OrderConfirmation />} />}
            />
            <Route
              path="/orders"
              element={<ProtectedRoute element={<Orders />} />}
            />
            <Route path="/track-order" element={<OrderTracking />} />
          </Route>
          {/* Admin routes */}
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
