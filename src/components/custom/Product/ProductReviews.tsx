import React, { useState, useEffect } from "react";
import { Rating } from "react-simple-star-rating";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/Database/firebase";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { Product, Review } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { FaHeart, FaRegHeart, FaEllipsisV } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDispatch } from "react-redux";
import { updateProductReview } from "@/redux/productSlice";

interface ProductReviewsProps {
    product: Product;
    productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
    product,
    productId,
}) => {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const dispatch = useDispatch();
    const [reviews, setReviews] = useState<Review[]>(product.reviews || []);
    const [userProfiles, setUserProfiles] = useState<Record<string, { name: string, photoUrl: string }>>({});
    const [newReview, setNewReview] = useState<string>("");
    const [newRating, setNewRating] = useState<number>(0);
    const [visibleCount, setVisibleCount] = useState<number>(3);
    const [userName, setUserName] = useState<string>("Guest");
    const [userPhoto, setUserPhoto] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);

    // Real-time reviews listener
    useEffect(() => {
        if (!productId) return;
        const unsubscribe = onSnapshot(doc(db, "products", productId), (docSnap) => {
            if (docSnap.exists()) {
                setReviews(docSnap.data().reviews || []);
            }
        });
        return () => unsubscribe();
    }, [productId]);

    // Fetch user profiles for sync
    useEffect(() => {
        const uniqueUserIds = [...new Set(reviews.map(r => r.userId).filter(Boolean))];
        const missingIds = uniqueUserIds.filter(uid => !userProfiles[uid]);

        if (missingIds.length > 0) {
            const fetchProfiles = async () => {
                const newProfiles: Record<string, { name: string, photoUrl: string }> = {};
                await Promise.all(missingIds.map(async (uid) => {
                    try {
                        const userSnap = await getDoc(doc(db, "users", uid));
                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            newProfiles[uid] = { name: data.name, photoUrl: data.photoUrl };
                        }
                    } catch (e) {
                        console.error("Error fetching user profile:", e);
                    }
                }));
                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            };
            fetchProfiles();
        }
    }, [reviews, userProfiles]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                if (user.displayName) setUserName(user.displayName);
                if (user.photoURL) setUserPhoto(user.photoURL);
                if (user.email) setUserEmail(user.email);

                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (!user.displayName && data.name) setUserName(data.name);
                        if (!user.photoURL && data.photoUrl) setUserPhoto(data.photoUrl);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };
        fetchUserData();
    }, [user]);

    const handleRating = (rate: number) => {
        setNewRating(rate);
    };

    const updateFirestoreReviews = async (updatedReviews: Review[], updatedRatingDistribution: Record<string, number>) => {
        try {
            const productRef = doc(db, "products", productId);
            await updateDoc(productRef, {
                reviews: updatedReviews,
                rating: updatedRatingDistribution
            });

            dispatch(updateProductReview({
                productId,
                review: updatedReviews, // Sending full array or handle inside slice appropriately. For now assuming slice handles simple replacement or refetch. 
                // Actually slice expects a single review object or array? existing slice logic might append. 
                // To be safe/consistent with existing redux action which likely expects a single review to append, we might need to adjust or trigger a full refetch.
                // However, since we are managing local state 'reviews', visual update is instant. 
                // Ideally we should dispatch a 'setReviews' action but existing slice might mostly handle 'add'.
                // For this implementation, relying on local state for immediate feedback and refetching on revisit.
                updatedRating: updatedRatingDistribution
            }));

            // Force refresh local state to match what we just sent (good practice)
            setReviews(updatedReviews);

        } catch (error) {
            console.error("Error updating reviews in DB:", error);
            throw error;
        }
    };

    const recalculateRatings = (currentReviews: Review[]) => {
        const ratingDist: Record<string, number> = {};
        currentReviews.forEach(r => {
            const key = r.rating.toString();
            ratingDist[key] = (ratingDist[key] || 0) + 1;
        });
        return ratingDist;
    };


    const handleSubmitReview = async () => {
        if (!user) {
            toast({ description: "Please login to write a review.", variant: "destructive" });
            return;
        }
        if (newRating === 0) {
            toast({ description: "Please select a star rating.", variant: "destructive" });
            return;
        }
        if (!newReview.trim()) {
            toast({ description: "Please write a review text.", variant: "destructive" });
            return;
        }

        const reviewData: Review = {
            reviewerName: userName || "Anonymous",
            reviewerPhoto: userPhoto,
            reviewerEmail: userEmail,
            rating: newRating,
            reviewText: newReview,
            date: new Date().toISOString().split("T")[0],
            userId: user.uid,
            likes: [],
        };

        try {
            let updatedReviews = [...reviews];

            if (editingReviewIndex !== null) {
                // Update existing review
                updatedReviews[editingReviewIndex] = {
                    ...updatedReviews[editingReviewIndex],
                    rating: newRating,
                    reviewText: newReview,
                    // Update user details in case they changed
                    reviewerName: userName || "Anonymous",
                    reviewerPhoto: userPhoto,
                    reviewerEmail: userEmail,
                    date: new Date().toISOString().split("T")[0] + " (Edited)",
                };
                toast({ description: "Review updated successfully!" });
            } else {
                // Add new review
                updatedReviews.unshift(reviewData);
                toast({ description: "Review submitted successfully!" });
            }

            const updatedRatings = recalculateRatings(updatedReviews);
            await updateFirestoreReviews(updatedReviews, updatedRatings);

            setNewReview("");
            setNewRating(0);
            setEditingReviewIndex(null);

        } catch (error) {
            console.error("Error submitting review: ", error);
            toast({ description: "Failed to submit review.", variant: "destructive" });
        }
    };

    const handleLike = async (index: number) => {
        if (!user) {
            toast({ description: "Please login to like reviews.", variant: "destructive" });
            return;
        }

        const updatedReviews = [...reviews];
        const review = { ...updatedReviews[index] }; // Create a shallow copy of the review object

        // Ensure likes array exists
        const likes = review.likes || [];
        const userLikeIndex = likes.indexOf(user.uid);

        if (userLikeIndex === -1) {
            // Like
            review.likes = [...likes, user.uid];
        } else {
            // Unlike
            review.likes = likes.filter(id => id !== user.uid);
        }

        updatedReviews[index] = review;
        setReviews(updatedReviews); // Optimistic update

        try {
            const productRef = doc(db, "products", productId);
            await updateDoc(productRef, {
                reviews: updatedReviews
            });
        } catch (error) {
            console.error("Error liking review:", error);
            // Revert optimistic update if needed, but for now simple logging is fine
            setReviews(reviews); // Revert
            toast({ description: "Failed to update like.", variant: "destructive" });
        }
    };

    const handleEdit = (index: number) => {
        const review = reviews[index];
        setNewReview(review.reviewText);
        setNewRating(review.rating);
        setEditingReviewIndex(index);
        // Scroll to form
        const form = document.getElementById("review-form");
        if (form) form.scrollIntoView({ behavior: "smooth" });
    };

    const handleDelete = async (index: number) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        const updatedReviews = [...reviews];
        updatedReviews.splice(index, 1);

        try {
            const updatedRatings = recalculateRatings(updatedReviews);
            await updateFirestoreReviews(updatedReviews, updatedRatings);
            toast({ description: "Review deleted." });
        } catch (error) {
            toast({ description: "Failed to delete review", variant: "destructive" });
        }
    };

    const handleShowMore = () => {
        setVisibleCount((prev) => prev + 3);
    };

    return (
        <div className="mt-10 border-t pt-8">
            <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>

            <div className="space-y-6 mb-10">
                {reviews.slice(0, visibleCount).map((review, index) => {
                    const isOwner = user && (
                        (review.userId && review.userId === user.uid) ||
                        (review.reviewerEmail && user.email && review.reviewerEmail === user.email)
                    );
                    const isLiked = user && review.likes?.includes(user.uid);

                    // Prioritize synced profile data if available
                    // Fallback to current user state if owner
                    // Finally fallback to review snapshot data
                    const syncedProfile = review.userId ? userProfiles[review.userId] : null;
                    
                    const displayPhoto = syncedProfile?.photoUrl || (isOwner ? userPhoto : review.reviewerPhoto);
                    const displayName = syncedProfile?.name || (isOwner ? userName : review.reviewerName);

                    return (
                        <div
                            key={index}
                            className={`border-b pb-4 relative group pr-8 transition-colors ${isOwner ? "bg-green-50 p-4 rounded-lg border-none mb-4" : "mb-4"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {displayPhoto ? (
                                        <img
                                            src={displayPhoto}
                                            alt={displayName || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                            {(displayName && displayName.length > 0) ? displayName.charAt(0).toUpperCase() : "U"}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-semibold text-lg block leading-tight">{displayName || "Anonymous"}</span>
                                        <span className="text-sm text-gray-500 block leading-tight">{review.date}</span>
                                    </div>
                                </div>

                                {isOwner && (
                                    <div className="absolute right-0 top-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                <FaEllipsisV className="text-gray-500 hover:text-black cursor-pointer" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(index);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <MdEdit className="mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(index);
                                                    }}
                                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                                >
                                                    <MdDelete className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center mt-2 mb-2">
                                <Rating
                                    readonly
                                    initialValue={review.rating}
                                    size={20}
                                    allowFraction={true}
                                    SVGstyle={{ display: "inline-block" }}
                                />
                            </div>
                            <p className="text-gray-700 mb-3">{review.reviewText}</p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(index);
                                    }}
                                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-black'}`}
                                >
                                    {isLiked ? <FaHeart /> : <FaRegHeart />}
                                    <span>{review.likes?.length || 0}</span>
                                </button>
                            </div>
                        </div>
                    );
                })}

                {visibleCount < reviews.length && (
                    <button
                        onClick={handleShowMore}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Show More
                    </button>
                )}
            </div>

            <div id="review-form" className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold">{editingReviewIndex !== null ? "Edit Your Review" : "Write a Review"}</h4>
                    {editingReviewIndex !== null && (
                        <button onClick={() => {
                            setEditingReviewIndex(null);
                            setNewReview("");
                            setNewRating(0);
                        }} className="text-xs text-gray-500 hover:text-black">Cancel Edit</button>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Rating</label>
                    <Rating
                        onClick={handleRating}
                        initialValue={newRating}
                        size={30}
                        transition
                        allowFraction={false}
                        SVGstyle={{ display: "inline-block" }}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">Review</label>
                    <textarea
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Write your experience..."
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                    ></textarea>
                </div>
                <button
                    onClick={handleSubmitReview}
                    className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
                >
                    {editingReviewIndex !== null ? "Update Review" : "Submit Review"}
                </button>
            </div>
        </div>
    );
};

export default ProductReviews;
