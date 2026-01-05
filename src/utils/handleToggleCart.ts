import { db } from "@/Database/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Adds a product to the cart or updates its quantity if it's already in the cart.
 * @param userId - The ID of the user.
 * @param productId - The ID of the product to add to the cart.
 * @param quantity - The quantity of the product to add.
 * @param color - The color of the product.
 * @param size - The size of the product.
 */
export const handleAddToCart = async (
  userId: string,
  productId: string,
  quantity: number,
  color: string,
  size: number
) => {
  const userRef = doc(db, "users", userId);

  if (!size) {
    console.error("Size requirement not met for add to cart.");
    throw new Error("Size is mandatory");
  }

  try {
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const cart: Record<string, any> = userData?.cart || {};

      // Create or update the cart entry for this product
      const cartEntry = cart[productId] || {
        quantity: 0,
        color: "defaultColor",
        size: 40.5,
      };
      cartEntry.quantity += quantity;
      cartEntry.color = color;
      cartEntry.size = size;

      await updateDoc(userRef, {
        cart: {
          ...cart,
          [productId]: cartEntry,
        },
      });
    } else {
      console.error("User document does not exist.");
    }
  } catch (error) {
    console.error("Error updating cart: ", error);
  }
};
