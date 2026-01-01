import { Link, useLocation } from "react-router-dom";
// import Images from "@/assets";
import logo1 from "/public/nexura-logo-1.png";
// Footer Data

const footerMarketPlace = [
  {
    name: "All NFTs",
    link: "/nfts",
  },
  {
    name: "Products",
    link: "/collections",
  },
];

const footerResource = [
  {
    name: "Documentation",
    link: "https://github.com/raxitsanghani",
  },
  {
    name: "Help Center",
    link: "https://github.com/raxitsanghani",
  },
  {
    name: "Blog",
    link: "https://github.com/raxitsanghani",
  },
  {
    name: "Support Center",
    link: "https://github.com/raxitsanghani",
  },
];

const footerCompany = [
  {
    name: "Home",
    link: "/",
  },
  {
    name: "About us",
    link: "https://github.com/raxitsanghani",
  },
  {
    name: "Privacy Policy",
    link: "https://github.com/raxitsanghani",
  },
];

const footerSocial = [
  {
    path: "M24 11.5c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.4-1.8-.6.4-1.3.6-2.1.8-.6-.6-1.5-1-2.4-1-1.7 0-3.2 1.5-3.2 3.3 0 .3 0 .5.1.7-2.7-.1-5.2-1.4-6.8-3.4-.3.5-.4 1-.4 1.7 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.5 1.4-4.1 1.4H8c1.5.9 3.2 1.5 5 1.5 6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.3-1.1 1.7-1.8z",
    link: "https://twitter.com/?lang=en",
    name: "Twitter",
  },
  {
    path: "M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z",
    link: "https://github.com/raxitsanghani",
    name: "Github",
  },
  {
    path: "M14.023 24L14 17h-3v-3h3v-2c0-2.7 1.672-4 4.08-4 1.153 0 2.144.086 2.433.124v2.821h-1.67c-1.31 0-1.563.623-1.563 1.536V14H21l-1 3h-2.72v7h-3.257z",
    link: "https://facebook.com",
    name: "Facebook",
  },
];
export default function Footer() {
  const navigation = useLocation();

  return (
    <footer
      className={`mt-auto border-t border-gray-200 ${navigation.pathname === "/login" || navigation.pathname === "/register"
          ? "hidden"
          : "block"
        }`}
    >
      <div className="mx-auto flex flex-col items-center ">
        {/* Top area: Blocks */}
        <div className="grid w-full max-w-7xl gap-8 py-8 px-4 sm:grid-cols-12 sm:px-6 md:py-12">
          {/* 1st block */}
          <div className="sm:col-span-12 lg:col-span-6">
            <div className="mb-2">
              {/* Logo */}
              <Link to="/" className="inline-block" aria-label="Cruip">
                <img src={logo1} alt="" className="w-32" />
              </Link>
            </div>
          </div>

          {/* 2nd block */}
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-2 lg:ml-auto">
            <h6 className="mb-2 font-medium text-gray-800">Marketplace</h6>
            <ul className="text-sm">
              {footerMarketPlace.map(({ name, link }) => (
                <li className="mb-2" key={name}>
                  <Link
                    to={link}
                    className="text-gray-600 transition duration-150 ease-in-out hover:text-gray-900"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3rd block */}
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-2 lg:ml-auto">
            <h6 className="mb-2 font-medium text-gray-800">Resources</h6>
            <ul className="text-sm">
              {footerResource.map(({ name, link }) => (
                <li className="mb-2" key={name}>
                  <Link
                    target="_blank"
                    to={link}
                    className="text-gray-600 transition duration-150 ease-in-out hover:text-gray-900"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4th block */}
          <div className="sm:col-span-6 md:col-span-3 lg:col-span-2 lg:ml-auto">
            <h6 className="mb-2 font-medium text-gray-800">Company</h6>
            <ul className="text-sm">
              {footerCompany.map(({ name, link }) => (
                <li className="mb-2" key={name}>
                  <Link
                    to={link}
                    target="_blank"
                    className="text-gray-600 transition duration-150 ease-in-out hover:text-gray-900"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom area */}
        <div className="flex w-full justify-center border-t border-gray-200  p-4 sm:px-6 md:py-8">
          <div className="w-full max-w-7xl px-4 sm:px-6 md:flex md:items-center md:justify-between">
            {/* Social links */}
            <ul className="mb-4 flex md:order-1 md:ml-4 md:mb-0">
              {footerSocial.map(({ path, link, name }, i) => (
                <li key={name} className={`${i === 0 ? "" : "ml-4"}`}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(link, "_blank");
                    }}
                    className="hover:bg-white-100 flex items-center justify-center rounded-full bg-white text-gray-600 shadow transition duration-150 ease-in-out hover:text-gray-900"
                    aria-label={name}
                  >
                    <svg
                      className="h-8 w-8 fill-current"
                      viewBox="0 0 32 32"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d={path} />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            {/* Copyrights note */}
            <div className="mr-4 text-sm text-gray-600">
              Made by{" "}
              <Link
                className="text-blue-600 hover:underline"
                target="_blank"
                to="https://github.com/raxitsanghani"
              >
                Raxit Sanghani
              </Link>
              . All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
