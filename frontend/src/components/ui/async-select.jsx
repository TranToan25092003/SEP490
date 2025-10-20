//Adapted from https://async.rdsx.dev/
import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * @typedef {Object} Option
 * @property {string} value
 * @property {string} label
 * @property {boolean} [disabled]
 * @property {string} [description]
 * @property {React.ReactNode} [icon]
 */

/**
 * @template T
 * @typedef {Object} AsyncSelectProps
 * @property {(query?: string) => Promise<T[]>} fetcher - Async function to fetch options
 * @property {boolean} [preload] - Preload all data ahead of time
 * @property {(option: T, query: string) => boolean} [filterFn] - Function to filter options
 * @property {(option: T) => React.ReactNode} renderOption - Function to render each option
 * @property {(option: T) => string} getOptionValue - Function to get the value from an option
 * @property {(option: T) => React.ReactNode} getDisplayValue - Function to get the display value for the selected option
 * @property {React.ReactNode} [notFound] - Custom not found message
 * @property {React.ReactNode} [loadingSkeleton] - Custom loading skeleton
 * @property {string} value - Currently selected value
 * @property {(value: string) => void} onChange - Callback when selection changes
 * @property {string} label - Label for the select field
 * @property {string} [placeholder] - Placeholder text when no selection
 * @property {boolean} [disabled] - Disable the entire select
 * @property {string | number} [width] - Custom width for the popover
 * @property {string} [className] - Custom class names
 * @property {string} [triggerClassName] - Custom trigger button class names
 * @property {string} [noResultsMessage] - Custom no results message
 * @property {boolean} [clearable] - Allow clearing the selection
 */

/**
 * AsyncSelect component with generic type support
 * @template T
 * @param {AsyncSelectProps<T>} props
 * @returns {JSX.Element}
 */
export function AsyncSelect({
  fetcher,
  preload,
  filterFn,
  renderOption,
  getOptionValue,
  getDisplayValue,
  notFound,
  loadingSkeleton,
  label,
  placeholder = "Chọn...",
  value,
  onChange,
  disabled = false,
  width = "200px",
  className,
  triggerClassName,
  noResultsMessage,
  clearable = true,
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedOption, setSelectedOption] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, preload ? 0 : 300);
  const [originalOptions, setOriginalOptions] = useState([]);
undefined
  useEffect(() => {
    setMounted(true);
    setSelectedValue(value);
  }, [value]);
undefined
  // Initialize selectedOption when options are loaded and value exists
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => getOptionValue(opt) === value);
      if (option) {
        setSelectedOption(option);
      }
    }
  }, [value, options, getOptionValue]);
undefined
  // Effect for initial fetch
  useEffect(() => {
    const initializeOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        // If we have a value, use it for the initial search
        const data = await fetcher(value);
        setOriginalOptions(data);
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách tùy chọn');
      } finally {
        setLoading(false);
      }
    };
undefined
    if (!mounted) {
      initializeOptions();
    }
  }, [mounted, fetcher, value]);
undefined
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetcher(debouncedSearchTerm);
        setOriginalOptions(data);
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách tùy chọn');
      } finally {
        setLoading(false);
      }
    };
undefined
    if (!mounted) {
      fetchOptions();
    } else if (!preload) {
      fetchOptions();
    } else if (preload) {
      if (debouncedSearchTerm) {
        setOptions(originalOptions.filter((option) => filterFn ? filterFn(option, debouncedSearchTerm) : true));
      } else {
        setOptions(originalOptions);
      }
    }
  }, [fetcher, debouncedSearchTerm, mounted, preload, filterFn]);
undefined
  const handleSelect = useCallback((currentValue) => {
    const newValue = clearable && currentValue === selectedValue ? "" : currentValue;
    setSelectedValue(newValue);
    setSelectedOption(options.find((option) => getOptionValue(option) === newValue) || null);
    onChange(newValue);
    setOpen(false);
  }, [selectedValue, onChange, clearable, options, getOptionValue]);
undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName
          )}
          style={{ width: width }}
          disabled={disabled}
        >
          {selectedOption ? (
            getDisplayValue(selectedOption)
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="opacity-50" size={10} />
        </Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: width }} className={cn("p-0", className)}>
        <Command shouldFilter={false}>
          <div className="relative border-b w-full">
            <CommandInput
              placeholder={`Tìm kiếm ${label.toLowerCase()}...`}
              value={searchTerm}
              onValueChange={(value) => {
                setSearchTerm(value);
              }}
            />
            {loading && options.length > 0 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <CommandList>
            {error && (
              <div className="p-4 text-destructive text-center">
                {error}
              </div>
            )}
            {loading && options.length === 0 && (
              loadingSkeleton || <DefaultLoadingSkeleton />
            )}
            {!loading && !error && options.length === 0 && (
              notFound || <CommandEmpty>{noResultsMessage ?? `Không tìm thấy ${label.toLowerCase()}.`}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={getOptionValue(option)}
                  value={getOptionValue(option)}
                  onSelect={handleSelect}
                >
                  {renderOption(option)}
                  <Check
                    className={cn(
                      "ml-auto h-3 w-3",
                      selectedValue === getOptionValue(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
undefined
function DefaultLoadingSkeleton() {
  return (
    <CommandGroup>
      {[1, 2, 3].map((i) => (
        <CommandItem key={i} disabled>
          <div className="flex items-center gap-2 w-full">
            <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />
            <div className="flex flex-col flex-1 gap-1">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
              <div className="h-3 w-16 animate-pulse bg-muted rounded" />
            </div>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}