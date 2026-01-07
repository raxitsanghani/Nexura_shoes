import HomeFeatured from "@/components/custom/Featured/HomeFeatured";
import ProductList from "@/components/custom/ProductList/ProductList";
import SEO from "@/components/custom/SEO";

const Home = () => {
  return (
    <>
      <SEO
        title="Home"
        description="Discover the best sports apparel and shoes at Nexura Sports. Shop exclusive collections for men, women, and kids."
      />
      <HomeFeatured />
      <ProductList />
    </>
  );
};

export default Home;
