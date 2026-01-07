import React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface FilterState {
    priceRange: { min: string; max: string };
    sort: string;
    colors: string[];
}

interface FilterSidebarProps {
    filterState: FilterState;
    setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filterState, setFilterState }) => {

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
        setFilterState(prev => ({
            ...prev,
            priceRange: { ...prev.priceRange, [type]: e.target.value }
        }));
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterState(prev => ({ ...prev, sort: e.target.value }));
    };

    const handleColorChange = (color: string) => {
        setFilterState(prev => {
            const isSelected = prev.colors.includes(color);
            return {
                ...prev,
                colors: isSelected
                    ? prev.colors.filter(c => c !== color)
                    : [...prev.colors, color]
            };
        });
    }

    const sortOptions = [
        { value: "newest", label: "Newest First" },
        { value: "price_asc", label: "Price: Low to High" },
        { value: "price_desc", label: "Price: High to Low" },
        { value: "name_asc", label: "Name: A to Z" },
    ];

    const popularColors = ["Black", "White", "Red", "Blue", "Green", "Grey", "Pink", "Yellow"];

    return (
        <div className="hidden lg:block w-64 flex-shrink-0 pr-6 border-r border-gray-100 mr-8">
            <div className="font-bold text-xl mb-6">Filters</div>

            {/* Sort By */}
            <div className="mb-6">
                <label className="text-sm font-bold mb-2 block">Sort By</label>
                <select
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
                    value={filterState.sort}
                    onChange={handleSortChange}
                >
                    {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <Accordion type="multiple" defaultValue={["price", "colors"]} className="w-full">

                {/* Price Range */}
                <AccordionItem value="price" className="border-b-0 mb-2">
                    <AccordionTrigger className="hover:no-underline font-semibold py-2">
                        Price Range (₹)
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex gap-2 items-center pt-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={filterState.priceRange.min}
                                onChange={(e) => handlePriceChange(e, 'min')}
                                className="h-8 text-xs"
                            />
                            <span>-</span>
                            <Input
                                type="number"
                                placeholder="Max"
                                value={filterState.priceRange.max}
                                onChange={(e) => handlePriceChange(e, 'max')}
                                className="h-8 text-xs"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Colors */}
                <AccordionItem value="colors" className="border-b-0 mb-2">
                    <AccordionTrigger className="hover:no-underline font-semibold py-2">
                        Colors
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 pt-1 pb-4">
                            {popularColors.map((color) => (
                                <div key={color} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`color-${color}`}
                                        checked={filterState.colors.includes(color)}
                                        onCheckedChange={() => handleColorChange(color)}
                                    />
                                    <label
                                        htmlFor={`color-${color}`}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        {color}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>

            {/* Clear Filter Button */}
            <div className="mt-6">
                <button
                    onClick={() => setFilterState({
                        priceRange: { min: "", max: "" },
                        sort: "newest",
                        colors: []
                    })}
                    className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-black hover:text-white transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
