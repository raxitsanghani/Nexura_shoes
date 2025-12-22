import RatingProvider from "@/components/ui/Rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VerticalTable from "@/components/ui/VerticalTable";
import { Progress } from "@/components/ui/progress";
import React, { useState } from "react";
import useAverageRating from "@/hooks/useAvarageRating";
// Define types for the user and product
interface Product {
  details?: string;
  reviews?: any[];
  rating?: { [key: number]: number };
}

interface ProductDescriptionProps {
  product: Product;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ product }) => {
  const [visibleCount, setVisibleCount] = useState(2);
  const handleSeeMore = () => {
    setVisibleCount((prevCount) => prevCount + 2);
  };

  // Ensure reviewData is an array
  const reviewData = Array.isArray(product.reviews)
    ? product.reviews
    : Array(product.reviews);
  // Ensure ratingDistribution is an object
  const ratingDistribution = product.rating || {};
  const { averageRating, totalPeople } = useAverageRating(ratingDistribution);

  console.log(product.reviews);
  return (
    <Tabs defaultValue="review" className="w-full mt-10">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="review">Review</TabsTrigger>
      </TabsList>

      {product.details ? (
        <TabsContent value="details">
          <div>
            <h2 className="text-lg font-bold mb-2">Product details</h2>
            <p className="whitespace-pre-wrap text-gray-700">{product.details}</p>
          </div>
        </TabsContent>
      ) : null}

      {Object.keys(ratingDistribution).length > 0 ? (
        <TabsContent value="review">
          <div className="flex md:flex-row w-full flex-col gap-10 md:justify-between">
            <div className="md:w-1/2 flex flex-col gap-4">
              {reviewData.slice(0, visibleCount).map((review, index) => (
                <React.Fragment key={index}>
                  <div className="flex gap-2 p-1">
                    <img
                      src={review.reviewerPhoto || "/default-profile.png"}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex flex-col gap-1 mt-[2px]">
                      <div className="flex text-xs gap-2">
                        <h2 className="font-bold">
                          {review.reviewerName || "Anonymous"}
                        </h2>
                        <p className="text-cs_gray">
                          {review.date}
                        </p>
                      </div>
                      <RatingProvider size={"16px"} rating={review.rating || 0} />
                      <h2 className="text-sm font-semibold mt-3">
                        {review.reviewText || "No comment"}
                      </h2>
                    </div>
                  </div>
                  <hr />
                </React.Fragment>
              ))}

              {visibleCount < reviewData.length && (
                <button
                  onClick={handleSeeMore}
                  className="mt-4 text-cs_yellow hover:text-yellow-500"
                >
                  See More
                </button>
              )}
            </div>

            <div className="mt-10 md:-mt-10 md:w-1/2 flex flex-col items-center">
              <div className="md:w-[50%]">
                <div className="flex items-center justify-between">
                  <h2>
                    <RatingProvider
                      size={"2rem"}
                      // @ts-ignore
                      rating={averageRating.toFixed(2) || 0}
                    />
                  </h2>
                  <p>{averageRating.toFixed(1)}</p>
                </div>
                <hr className="my-4" />
                <div className="flex flex-col gap-2">
                  {Object.keys(ratingDistribution).map((star) => (
                    <div key={star} className="flex items-center gap-2">
                      <p>{star}</p>
                      <Progress
                        // @ts-ignore

                        value={(ratingDistribution[star] * 100) / totalPeople}
                      />

                      {/*@ts-ignore  */}
                      <p>{ratingDistribution[star]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      ) : null}
    </Tabs>
  );
};

export default ProductDescription;
