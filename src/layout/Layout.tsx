import Navbar from "@/components/custom/Navbar/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/custom/Footer/Footer";
import MiniCart from "@/components/custom/Cart/MiniCart";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div>
      <MiniCart />
      <Navbar />
      <div className={isHome ? "" : "mt-24"}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
