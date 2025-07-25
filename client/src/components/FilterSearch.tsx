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
  mediaType = "items"
}: FilterSearchProps) => {
  return (
    <div className="w-80 rounded-xl border bg-card text-card-foreground shadow p-6 mb-9 sticky top-[15%] self-start">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Filter & Search
        </h3>
        <p className="text-sm text-muted-foreground">
          {`Find ${mediaType} that match your interests and current level`}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{`Search ${mediaType}`}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div>
          <Label>Category</Label>
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
            <Label>Duration</Label>
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

        <div className="text-sm font-medium text-center">
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