// import { useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

// interface FilterSidebarProps {
//     // We can add props here later if we want actual filtering logic to be passed down
//     // or use context/redux
// }

const FilterSidebar = () => {
    // Mock data for filters to match the screenshot
    const filters = [
        { id: "pronation", name: "Pronation", options: ["Neutral", "Overpronation", "Underpronation"] },
        { id: "drop", name: "Drop", options: ["0-4 mm", "5-8 mm", "9-12 mm"] },
        { id: "upper", name: "Upper", options: ["Mesh", "Knit", "Synthetic"] },
        { id: "material", name: "Main Material", options: ["Sustainable", "Leather", "Vegan"] },
        { id: "cushioning", name: "Cushioning", options: ["Maximum", "Moderate", "Minimal"] },
    ];

    return (
        <div className="hidden lg:block w-64 flex-shrink-0 pr-6 border-r border-gray-100 mr-8">
            <div className="font-bold text-xl mb-6">Filters</div>

            <Accordion type="multiple" defaultValue={["pronation", "drop"]} className="w-full">
                {filters.map((filter) => (
                    <AccordionItem key={filter.id} value={filter.id} className="border-b-0 mb-2">
                        <AccordionTrigger className="hover:no-underline font-semibold py-2">
                            {filter.name}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="flex flex-col gap-2 pt-1 pb-4">
                                {filter.options.map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox id={`${filter.id}-${option}`} />
                                        <label
                                            htmlFor={`${filter.id}-${option}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {option}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
};

export default FilterSidebar;
