import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, DURATIONS } from '@/constants/categories';

interface FilterSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDuration?: string;
  setSelectedDuration?: (duration: string) => void;
  filteredCount: number;
  mediaType?: string;
  searchPlaceholder?: string;
}

const FilterSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory,
  selectedDuration,
  setSelectedDuration,
  filteredCount,
  mediaType = "items",
  searchPlaceholder = "Search by title or description..."
}: FilterSearchProps) => {
  return (
    <div className="w-full lg:w-80 rounded-xl border bg-card text-card-foreground shadow p-4 lg:p-6">
      <div className="mb-4 lg:mb-6">
        <h3 className="text-lg lg:text-xl font-semibold mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 lg:w-5 lg:h-5" />
          Filter & Search
        </h3>
        <p className="text-xs lg:text-sm text-muted-foreground">
          {`Find ${mediaType} that match your interests and current level`}
        </p>
      </div>

      <div className="space-y-3 lg:space-y-4">
        <div>
          <Label className="text-sm">{`Search ${mediaType}`}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm placeholder:text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mediaType === "videos" && setSelectedDuration && (
          <div>
            <Label className="text-sm">Duration</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Durations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                {DURATIONS.map(duration => (
                  <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-xs lg:text-sm font-medium text-center p-2 bg-muted rounded-md">
          {`${filteredCount} ${mediaType} found`}
        </div>

        {(searchTerm || selectedCategory !== 'all' || (selectedDuration && selectedDuration !== 'all')) && (
          <Button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              if (setSelectedDuration) {
                setSelectedDuration('all');
              }
            }}
            className="w-full"
          >
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterSearch;