import React, { useState } from "react";
import { db, storage } from "@/Database/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/components/ui/use-toast";

const AddProduct = () => {
  const { toast } = useToast();
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [categories, setCategories] = useState<string>("");
  const [colors, setColors] = useState<string[]>([]);
  const [discount, setDiscount] = useState<string>("");
  const [defaultColorName, setDefaultColorName] = useState<string>("");
  const [features, setFeatures] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string[]>>({});
  const [sizes, setSizes] = useState<string>("");
  const [defaultImageFiles, setDefaultImageFiles] = useState<File[]>([]);
  const [defaultImagePreviews, setDefaultImagePreviews] = useState<string[]>([]);
  const [details, setDetails] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddColor = () => {
    const colorInput = prompt("Enter color name:");
    if (colorInput && !colors.includes(colorInput)) {
      setColors((prevColors) => [...prevColors, colorInput]);
      setImageFiles((prev) => ({ ...prev, [colorInput]: [] }));
      setImagePreviews((prev) => ({ ...prev, [colorInput]: [] }));
    }
  };

  const handleFileChange = (color: string, files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setImageFiles((prev) => ({
        ...prev,
        [color]: [...(prev[color] || []), ...newFiles]
      }));

      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => ({
        ...prev,
        [color]: [...(prev[color] || []), ...newPreviewUrls]
      }));
    }
  };

  const handleRemoveImage = (color: string, index: number) => {
    setImageFiles((prev) => {
      const updated = [...(prev[color] || [])];
      updated.splice(index, 1);
      return { ...prev, [color]: updated };
    });
    setImagePreviews((prev) => {
      const updated = [...(prev[color] || [])];
      URL.revokeObjectURL(updated[index]);
      updated.splice(index, 1);
      return { ...prev, [color]: updated };
    });
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setColors((prev) => prev.filter((c) => c !== colorToRemove));
    setImageFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[colorToRemove];
      return newFiles;
    });
    setImagePreviews((prev) => {
      const newPreviews = { ...prev };
      // Revoke URLs to prevent memory leaks
      if (newPreviews[colorToRemove]) {
        newPreviews[colorToRemove].forEach((url) => URL.revokeObjectURL(url));
      }
      delete newPreviews[colorToRemove];
      return newPreviews;
    });
  };

  const handleDefaultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDefaultImageFiles((prev) => [...prev, ...newFiles]);

      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setDefaultImagePreviews((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const handleRemoveDefaultImage = (index: number) => {
    setDefaultImageFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    setDefaultImagePreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index]);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const categoriesArray = categories.split(",").map((item) => item.trim()).filter(item => item !== "");
      const featuresArray = features.split(",").map((item) => item.trim()).filter(item => item !== "");
      const sizesArray = sizes.split(",").map((item) => item.trim()).filter(item => item !== "");

      const imageUrlsArray: Record<string, string[]> = {};
      let primaryDefaultImageUrl = "";

      // Upload default images
      if (defaultImageFiles.length > 0) {
        const defaultUploadPromises = defaultImageFiles.map(async (file, index) => {
          const defaultImageRef = ref(
            storage,
            `shoes/${name}/default/${index}_${file.name}`
          );
          await uploadBytes(defaultImageRef, file);
          return getDownloadURL(defaultImageRef);
        });
        const defaultImageUrlsArray = await Promise.all(defaultUploadPromises);
        primaryDefaultImageUrl = defaultImageUrlsArray[0];
        imageUrlsArray["default"] = defaultImageUrlsArray;
      }

      // Parallelize image uploads for better performance
      await Promise.all(colors.map(async (color) => {
        if (imageFiles[color] && imageFiles[color].length > 0) {
          const uploadPromises = imageFiles[color].map(async (file) => {
            const imageRef = ref(storage, `shoes/${name}/${color}/${file.name}`);
            await uploadBytes(imageRef, file);
            return getDownloadURL(imageRef);
          });
          imageUrlsArray[color] = await Promise.all(uploadPromises);
        } else {
          imageUrlsArray[color] = [];
        }
      }));

      await addDoc(collection(db, "products"), {
        name,
        price: parseFloat(price),
        categories: categoriesArray,
        colors,
        discount,
        defaultColorName: defaultColorName,
        features: featuresArray,
        imageUrls: imageUrlsArray,
        defaultImage: primaryDefaultImageUrl,
        sizes: sizesArray,
        details: details,
        rating: {}, // Initialize with empty rating
        reviews: [], // Initialize with empty reviews
      });

      toast({
        title: "Product Added",
        description: `${name} has been successfully added.`,
      });

      // Reset form
      setName("");
      setPrice("");
      setCategories("");
      setColors([]);
      setDiscount("");
      setFeatures("");
      setImageFiles({});
      setImagePreviews({});
      setSizes("");
      setDetails("");
      setDefaultColorName("");
      setDefaultImageFiles([]);
      setDefaultImagePreviews([]);

    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Add New Product</h1>
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
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="block text-gray-700 font-semibold text-lg">
              Default Images (Angles)
            </label>
            <input
              type="text"
              placeholder="Primary Color Name (e.g. Green)"
              value={defaultColorName}
              onChange={(e) => setDefaultColorName(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300 w-64"
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-xl font-bold"
              title="Add another color"
            >
              +
            </button>
          </div>

          <div className="p-4 border rounded-md bg-gray-50">
            <input
              type="file"
              multiple
              onChange={handleDefaultImageChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300 bg-white"
            />
            {defaultImagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-2 bg-white rounded-md border">
                {defaultImagePreviews.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Default Preview ${index}`}
                      className="w-24 h-24 object-cover rounded shadow-sm border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDefaultImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {colors.map((color) => (
          <div key={color} className="space-y-2 mt-6 relative border p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 font-semibold text-lg">
                Images for Color: <span className="text-black font-bold">{color}</span>
              </label>
              <button
                type="button"
                onClick={() => handleRemoveColor(color)}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Remove Color
              </button>
            </div>

            <input
              type="file"
              multiple
              onChange={(e) => handleFileChange(color, e.target.files)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            {imagePreviews[color] && imagePreviews[color].length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-2 bg-gray-50 rounded-md border">
                {imagePreviews[color].map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-20 h-20 object-cover rounded shadow-sm border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(color, index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
            placeholder="Enter product details like material, comfort, etc."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-3 text-white font-bold rounded-md transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
        >
          {loading ? "Adding Product..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
