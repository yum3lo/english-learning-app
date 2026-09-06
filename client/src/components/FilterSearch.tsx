import { Search, X } from "lucide-react";
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
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const hasActiveFilters = Boolean(
    searchTerm || selectedCategory !== 'all' || (selectedDuration && selectedDuration !== 'all')
  );

  const categoryOptions: readonly string[] = user?.fieldsOfInterest?.length
    ? user.fieldsOfInterest
    : CATEGORIES;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full flex-1">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label={`Search ${mediaType}`}
          className="pl-8 text-sm placeholder:text-sm"
        />
      </div>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-full sm:w-[180px]" aria-label="Category">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categoryOptions.map(category => (
            <SelectItem key={category} value={category}>{category}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {mediaType === "videos" && setSelectedDuration && (
        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Duration">
            <SelectValue placeholder="All Durations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Durations</SelectItem>
            {DURATIONS.map(duration => (
              <SelectItem key={duration} value={duration}>{duration}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {`${filteredCount} ${mediaType} found`}
      </span>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            if (setSelectedDuration) {
              setSelectedDuration('all');
            }
          }}
        >
          <X className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Clear filters</span>
        </Button>
      )}
    </div>
  );
};

export default FilterSearch;