import { HiOutlineShoppingBag } from "react-icons/hi2";
import { RiSearchLine } from "react-icons/ri";
import { IoMdHeartEmpty } from "react-icons/io";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from "firebase/firestore";
import { db } from "@/Database/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/Database/firebase";
import { DropdownMenuComp } from "@/pages/Other/DropdownMenu";
import { Close } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { selectTotalCartItems } from "@/redux/cartSlice";
// import logo from "/public/nexura-logo.png";
import logo1 from "/public/nexura-logo-1.png";
// import logo2 from "/public/nexura-logo-2.png";

const menuList = [
  { name: "Home", path: "/" },
  { name: "Woman", path: "/woman" },
  { name: "Man", path: "/man" },
  { name: "Kids", path: "/kids" },
  { name: "Sports", path: "/sports" },
  { name: "Sale", path: "/sale" },
];

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const totalCartItems = useSelector(selectTotalCartItems);

  const [data, setData] = useState<
    { name: string; id: string; defaultImage: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [productNames, setProductNames] = useState<
    { name: string; id: string; defaultImage: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [user] = useAuthState(auth);
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfilePicUrl(user?.photoURL || "");
  }, [user]);

  useEffect(() => {
    const fetchProfilePicUrl = async () => {
      if (user) {
        try {
          const db = getFirestore();
          const userRef = doc(db, `users/${user.uid}`);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profilePic) {
              setProfilePicUrl(data.profilePic);
            }
          }
        } catch (error) {
          console.error("Error fetching profile picture URL:", error);
        }
      }
    };

    fetchProfilePicUrl();
  }, [user]);

  useEffect(() => {
    const fetchProductNames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const products = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name as string,
          defaultImage: doc.data().defaultImage as string,
        }));
        setProductNames(products);
      } catch (error) {
        setError("Error fetching product names");
        console.error("Error fetching product names: ", error);
      }
    };

    fetchProductNames();
  }, []);

  const handleChange = (value: string) => {
    setInput(value);
    getData(value);
  };

  const getData = (value: string) => {
    if (!value) {
      setData([]);
      return;
    }

    const filteredData = productNames.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    setData(filteredData);
  };

  // Handle click outside of search input and dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setData([]); // Hide the search dropdown
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (error) return <div>{error}</div>;
  if (productNames.length === 0) return <></>;

  return (
    <nav
      className={`px-5 pb-5 sm:pb-0 pt-5 fixed top-0 w-screen z-50 ${isHome ? "bg-transparent" : "bg-white shadow-md"}`}
    >
      {/* UpperNav */}
      <div className="flex flex-row sm:justify-between gap-3 items-center px-3">
        <div className="flex flex-row items-center gap-3">
        <Link to={"/"} className="flex felx-row text-xl cursor-pointer">
          <img src={logo1} alt="Logo" className="w-16" />
          {/* <img src={logo2} alt="Logo" className="w-24 ml-10" /> */}
        </Link>
        <div className="sm:flex mt-2 text-gray-600 hidden shadow-gray-400 text-[13px] border border-gray-400 rounded-xl p-2 bg-white/30">
        {menuList.map((menu, index) => (
          <NavLink
            key={index}
            to={menu.path}
            className={({ isActive }) =>
              isActive ? "text-red-600 px-3" : "px-3"
            }
          >
            <h2 className="cs-underline">{menu.name}</h2>
          </NavLink>
        ))}
      </div>
      </div>
        <div className="w-[22rem]" ref={searchRef}>
          <div className="bg-white/60 px-4 py-2 flex border border-gray-400 items-center font-light gap-3 rounded-xl w-full shadow-sm">
            <RiSearchLine size={"20px"} color="#a4a4a4" />
            <input
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Type to search.."
              className="w-full text-sm bg-transparent  focus:outline-none"
            />
          </div>

          {data.length > 0 && (
            <div className="absolute mt-2 bg-white/60 border border-gray-200 rounded-xl shadow-lg z-50">
              <ul className="flex flex-col ml-1 p-1 max-h-48 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {data.map((product, index) => (
                  <li
                    key={index}
                    className="hover:bg-gray-100 rounded-xl p-1 flex items-center"
                  >
                    <img
                      src={product.defaultImage}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-lg "
                    />
                    <Link
                      to={`/product/${product.id}`}
                      className="block px-4 text-sm text-gray-700 flex-1  "
                      onClick={() => {
                        setData([]);
                        setInput("");
                      }}
                    >
                      {product.name}
                    </Link>
                    {index < data.length - 1 && (
                      <hr className="border-gray-200" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-6 kanit-semibold items-center">
          <Link
            to={"/cart"}
            className="hidden sm:flex relative flex-col gap-1 items-center cursor-pointer"
          >
            <HiOutlineShoppingBag size={"20px"} />
            <div className="bg-cs_yellow absolute left-3 bottom-6 text-sm text-center rounded-full px-1.5 w-auto h-5">
              {totalCartItems}
            </div>
            <h2 className="text-[9px]">Cart</h2>
          </Link>
          <Link
            to={"/favorites"}
            className="hidden sm:flex flex-col gap-1 items-center cursor-pointer"
          >
            <IoMdHeartEmpty size={"20px"} />
            <h2 className="text-[9px] ">Favorites</h2>
          </Link>

          <Link to={"/profile"} className="w-9 h-9">
            <DropdownMenuComp profilePicUrl={profilePicUrl} />
          </Link>
          <div className="sm:hidden flex items-center" ref={mobileMenuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? (
                <Close />
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  ></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BottomNav */}


      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-50">
          <ul className="flex flex-col">
            <Link
              to={"/cart"}
              className="hidden sm:flex relative flex-col gap-1 items-center cursor-pointer"
            >
              <HiOutlineShoppingBag size={"20px"} />
              <div className="bg-cs_yellow absolute left-3 bottom-6 text-sm text-center rounded-full px-1.5 w-auto h-5">
                {totalCartItems}
              </div>
              <h2 className="text-[9px]">Cart</h2>
            </Link>
            <Link
              to={"/favorites"}
              className="hidden sm:flex flex-col gap-1 items-center cursor-pointer"
            >
              <IoMdHeartEmpty size={"20px"} />
              <h2 className="text-[9px] ">Favorites</h2>
            </Link>

            {menuList.map((menu, index) => (
              <li key={index} className="border-b border-gray-200">
                <NavLink
                  to={menu.path}
                  className={({ isActive }) =>
                    isActive
                      ? "block py-2 px-4 text-red-600"
                      : "block py-2 px-4"
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {menu.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
