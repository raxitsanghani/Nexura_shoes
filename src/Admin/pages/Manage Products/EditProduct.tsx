import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "@/Database/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { RxCross1 } from "react-icons/rx";

// Define types for product properties
import { Product } from "@/types";
import { Rating } from "react-simple-star-rating";

const EditProduct: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [categories, setCategories] = useState<string>("");
  const [colorInput, setColorInput] = useState<string>("");
  const [colors, setColors] = useState<string[]>([]);
  const [discount, setDiscount] = useState<string>("");
  const [features, setFeatures] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [sizes, setSizes] = useState<string>("");
  const [defaultImage, setDefaultImage] = useState<File | null>(null);
  const [defaultImageUrl, setDefaultImageUrl] = useState<string>("");
  const [defaultColorName, setDefaultColorName] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<Record<string, string[]>>({});
  // @ts-ignore
  const [productReviews, setProductReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      const productDoc = await getDoc(doc(db, "products", productId));
      if (productDoc.exists()) {
        const productData = productDoc.data() as Product;
        setName(productData.name);
        setPrice(productData.price.toString());
        setCategories(productData.categories.join(", "));
        setColors(productData.colors);
        setDiscount(productData.discount);
        setFeatures(productData.features.join(", "));
        setSizes(productData.sizes.join(", "));
        setDetails(productData.details || "");
        setDefaultColorName(productData.defaultColorName || "");
        setDefaultImageUrl(productData.defaultImage);
        setImageUrls(productData.imageUrls || {});
        // @ts-ignore
        setProductReviews(productData.reviews || []);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddColor = () => {
    if (colorInput && !colors.includes(colorInput)) {
      setColors((prevColors) => [...prevColors, colorInput]);
      setImageFiles((prev) => ({ ...prev, [colorInput]: [] }));
      setColorInput("");
    }
  };

  const handleFileChange = (color: string, files: FileList) => {
    setImageFiles((prev) => ({ ...prev, [color]: Array.from(files) }));
  };

  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultImage(e.target.files![0]);
  };

  const handleDeleteImage = async (color: string, imageUrl: string) => {
    const imageRef = ref(storage, imageUrl);

    try {
      await deleteObject(imageRef);
      setImageUrls((prev) => ({
        ...prev,
        [color]: prev[color].filter((url) => url !== imageUrl),
      }));
    } catch (error) {
      console.error("Error deleting image: ", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const categoriesArray = categories.split(",").map((item) => item.trim()).filter(item => item !== "");
    const featuresArray = features.split(",").map((item) => item.trim()).filter(item => item !== "");
    const sizesArray = sizes.split(",").map((item) => item.trim()).filter(item => item !== "");

    const newImageUrls = { ...imageUrls };
    let newDefaultImageUrl = defaultImageUrl;

    // Upload default image if changed
    if (defaultImage) {
      const defaultImageRef = ref(
        storage,
        `shoes/${name}/default/${defaultImage.name}`
      );
      await uploadBytes(defaultImageRef, defaultImage);
      newDefaultImageUrl = await getDownloadURL(defaultImageRef);
    }

    // Upload new color images
    for (let color of colors) {
      if (imageFiles[color]) {
        newImageUrls[color] = newImageUrls[color] || [];
        for (let file of imageFiles[color]) {
          const imageRef = ref(storage, `shoes/${name}/${color}/${file.name}`);
          await uploadBytes(imageRef, file);
          const downloadURL = await getDownloadURL(imageRef);
          newImageUrls[color].push(downloadURL);
        }
      }
    }

    // Update product details in Firestore
    if (!productId) return;
    try {
      await updateDoc(doc(db, "products", productId), {
        name,
        price: parseFloat(price),
        categories: categoriesArray,
        colors,
        discount,
        features: featuresArray,
        imageUrls: newImageUrls,
        defaultImage: newDefaultImageUrl,
        sizes: sizesArray,
        details: details,
        defaultColorName: defaultColorName,
      });
      alert("Product updated successfully");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">
            Categories (comma separated)
          </label>
          <input
            type="text"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Add Color</label>
          <div className="flex items-center">
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="ml-2 px-4 py-2 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-800"
            >
              Add Color
            </button>
          </div>
        </div>
        {colors.map((color) => (
          <div key={color}>
            <label className="block text-gray-700 font-semibold">
              Upload Images for {color}
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileChange(color, e.target.files!)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            {imageUrls[color] &&
              imageUrls[color].map((url) => (
                <div key={url} className="relative mt-2">
                  <img
                    src={url}
                    alt={`Image of ${color}`}
                    className="w-16 h-16 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(color, url)}
                    className="absolute top-0 px-2 py-2 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <RxCross1 />
                  </button>
                </div>
              ))}
          </div>
        ))}
        <div>
          <label className="block text-gray-700 font-semibold">
            Default Image & Primary Color Name
          </label>
          <input
            type="text"
            placeholder="Primary Color Name (e.g. Green)"
            value={defaultColorName}
            onChange={(e) => setDefaultColorName(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300 w-full"
          />
          <input
            type="file"
            onChange={handleDefaultImageChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          {defaultImageUrl && (
            <img
              src={defaultImageUrl}
              alt="Default Preview"
              className="mt-2 w-32 h-32 object-cover"
            />
          )}
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Discount</label>
          <input
            type="text"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">
            Features (comma separated)
          </label>
          <input
            type="text"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">
            Sizes (comma separated)
          </label>
          <input
            type="text"
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">
            Product Details
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            rows={4}
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-black text-white font-bold rounded-md hover:bg-blue-600"
        >
          Update Product
        </button>
      </form>

      <div className="mt-10 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        {/* @ts-ignore */}
        {name && (!productReviews || productReviews.length === 0) ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          // @ts-ignore
          <div className="space-y-4">
            {/* @ts-ignore */}
            {productReviews?.map((review, index) => (
              <div key={index} className="border p-4 rounded-md bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  {review.reviewerPhoto ? (
                    <img
                      src={review.reviewerPhoto}
                      alt={review.reviewerName || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      {(review.reviewerName && review.reviewerName.length > 0) ? review.reviewerName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold block">{review.reviewerName}</span>
                    <span className="text-sm text-gray-500 block">{review.date}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <Rating
                    readonly
                    initialValue={review.rating}
                    size={20}
                    allowFraction={true}
                    SVGstyle={{ display: "inline-block" }}
                  />
                </div>
                <p className="text-gray-700">{review.reviewText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProduct;
