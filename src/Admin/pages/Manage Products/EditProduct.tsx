import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  // const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [categories, setCategories] = useState<string>("");
  const [colorInput, setColorInput] = useState<string>("");
  const [colors, setColors] = useState<string[]>([]);
  const [discount, setDiscount] = useState<string>("");
  const [features, setFeatures] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [sizes, setSizes] = useState<string>("");
  // State for multiple default images
  const [defaultImageFiles, setDefaultImageFiles] = useState<File[]>([]);
  // Store default images as string array for consistency with backend
  const [defaultImageUrls, setDefaultImageUrls] = useState<string[]>([]);

  const [defaultColorName, setDefaultColorName] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<Record<string, string[]>>({});
  // @ts-ignore
  const [productReviews, setProductReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const productDoc = await getDoc(doc(db, "products", productId));
        if (productDoc.exists()) {
          const productData = productDoc.data() as Product;
          setName(productData.name);
          setPrice(productData.price ? productData.price.toString() : "");
          // Handle potential missing fields or different formats
          setCategories(Array.isArray(productData.categories) ? productData.categories.join(", ") : "");
          setColors(productData.colors || []);
          setDiscount(productData.discount || "");
          setFeatures(Array.isArray(productData.features) ? productData.features.join(", ") : "");
          setSizes(Array.isArray(productData.sizes) ? productData.sizes.join(", ") : "");
          setDetails(productData.details || "");
          setDefaultColorName(productData.defaultColorName || "");

          // Handle default images normalization (string vs array)
          let defImgs: string[] = [];
          // @ts-ignore checking specifically for potential array format in existing data or legacy string
          if (Array.isArray(productData.defaultImage)) {
            // @ts-ignore
            defImgs = productData.defaultImage;
            // Check if 'default' key in imageUrls also has images that should be considered default
            if (productData.imageUrls && productData.imageUrls["default"]) {
              // Merge unique
              const set = new Set([...defImgs, ...productData.imageUrls["default"]]);
              defImgs = Array.from(set);
            }
          } else if (typeof productData.defaultImage === "string" && productData.defaultImage) {
            defImgs = [productData.defaultImage];
          } else if (productData.imageUrls && productData.imageUrls["default"]) {
            // Fallback if defaultImage field is empty but "default" key exists in map
            defImgs = productData.imageUrls["default"];
          }
          setDefaultImageUrls(defImgs);

          setImageUrls(productData.imageUrls || {});
          // @ts-ignore
          setProductReviews(productData.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddColor = () => {
    const trimmedColor = colorInput.trim();
    if (trimmedColor && !colors.includes(trimmedColor)) {
      setColors((prevColors) => [...prevColors, trimmedColor]);
      setImageFiles((prev) => ({ ...prev, [trimmedColor]: [] }));
      setColorInput("");
    }
  };

  const handleFileChange = (color: string, files: FileList) => {
    setImageFiles((prev) => ({ ...prev, [color]: Array.from(files) }));
  };

  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDefaultImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
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
    const categoriesArray = categories.split(",").map((item) => item.trim().toLowerCase()).filter(item => item !== "");
    const featuresArray = features.split(",").map((item) => item.trim()).filter(item => item !== "");
    const sizesArray = sizes.split(",").map((item) => item.trim()).filter(item => item !== "");

    const newImageUrls = { ...imageUrls };

    // Handle Default Images (Upload new files)
    const uploadedDefaultUrls: string[] = [];
    if (defaultImageFiles.length > 0) {
      for (const file of defaultImageFiles) {
        const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
        const sanitizedFileName = file.name.replace(/\s+/g, "_");
        const timestamp = Date.now();
        const defaultImageRef = ref(
          storage,
          `shoes/${sanitizedName}/default/${timestamp}_${sanitizedFileName}`
        );
        try {
          await uploadBytes(defaultImageRef, file);
          const url = await getDownloadURL(defaultImageRef);
          uploadedDefaultUrls.push(url);
        } catch (err) {
          console.error("Error uploading default image:", err);
          // alert? continue?
        }
      }
    }

    // Combine existing valid default URLs with newly uploaded ones
    const finalDefaultUrls = [...defaultImageUrls, ...uploadedDefaultUrls];
    newImageUrls["default"] = finalDefaultUrls;

    // Determine the "Primary" default image (fallback for single-string usage or thumbnail)
    const primaryDefaultImage = finalDefaultUrls.length > 0 ? finalDefaultUrls[0] : "";

    // 2. Upload new color images (Sequential)
    // Using for...of loop ensures sequential execution to prevent rate limiting or race conditions
    for (const color of colors) {
      if (imageFiles[color] && imageFiles[color].length > 0) {
        newImageUrls[color] = newImageUrls[color] || [];

        for (const file of imageFiles[color]) {
          const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_");
          const sanitizedColor = color.replace(/[^a-zA-Z0-9]/g, "_");
          const sanitizedFileName = file.name.replace(/\s+/g, "_");
          const timestamp = Date.now();

          const imageRef = ref(storage, `shoes/${sanitizedName}/${sanitizedColor}/${timestamp}_${sanitizedFileName}`);

          try {
            await uploadBytes(imageRef, file);
            const downloadURL = await getDownloadURL(imageRef);
            newImageUrls[color].push(downloadURL);
          } catch (err) {
            console.error(`Error uploading image for color ${color}:`, err);
            // Continue with other images even if one fails, or alert user?
            // For now, logging error is safer than crashing entire submit
          }
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
        defaultImage: primaryDefaultImage,
        sizes: sizesArray,
        details: details,
        defaultColorName: defaultColorName,
      });
      alert("Product updated successfully");

      // Clear file inputs after successful upload to prevent double uploading if user clicks update again mistakenly
      setImageFiles({});
      setDefaultImageFiles([]);
      setDefaultImageUrls(finalDefaultUrls);
      // We could also reload the page or navigate, but keeping state allows further edits

    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update product database.");
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
            Default Images & Primary Color Name
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
            multiple
            onChange={handleDefaultImageChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />

          {/* Display Existing Default Images (URLs) */}
          <div className="flex flex-wrap gap-2 mt-2">
            {defaultImageUrls.map((url, index) => (
              <div key={`def-url-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`Default Preview ${index}`}
                  className="w-24 h-24 object-cover rounded shadow-sm border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newUrls = defaultImageUrls.filter(u => u !== url);
                    setDefaultImageUrls(newUrls);
                    if (url.includes("firebase")) {
                      const imageRef = ref(storage, url);
                      deleteObject(imageRef).catch(e => console.error("Del def img err", e));
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                >
                  <RxCross1 size={14} />
                </button>
              </div>
            ))}

            {/* Display Newly Selected Files */}
            {defaultImageFiles.map((file, index) => (
              <div key={`def-file-${index}`} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="New File Preview"
                  className="w-24 h-24 object-cover rounded shadow-sm border border-gray-200 opacity-80"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDefaultImageFiles(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-lg"
                >
                  <RxCross1 size={14} />
                </button>
              </div>
            ))}
          </div>
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
