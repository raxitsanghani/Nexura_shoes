export interface Review {
    reviewerName: string;
    rating: number;
    reviewText: string;
    reviewerPhoto?: string;
    reviewerEmail?: string;
    date: string; // ISO string or formatted date
    userId: string;
    likes: string[]; // Array of user IDs who liked the review
}

export interface Product {
    id: string;
    name: string;
    defaultImage: string;
    defaultColorName?: string;
    discount: string;
    rating: Record<string, number>;
    reviews: Review[];
    features: string[];
    price: number | string; // Handle both for now as existing code varies
    categories: string[];
    colors: string[];
    sizes: string[];
    imageUrls: Record<string, string[]>;
    isFavorite?: boolean;
    details?: string;
}
