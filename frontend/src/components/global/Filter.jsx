import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import React from "react";
import { useEffect } from "react";

const FiltersContext = React.createContext(null);

export default function Filters({ children, filters, onFiltersChange }) {
  const [globalParams, setGlobalParams] = React.useState({});
  const [isOpen, setIsOpen] = React.useState(false);
  const idPrefix = React.useRef(Math.random().toString(36).substr(2, 9));

  const updateParam = React.useCallback((key, value) => {
    setGlobalParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeParam = React.useCallback((key) => {
    setGlobalParams((prev) => {
      if (!(key in prev)) return prev;
      const clone = { ...prev };
      delete clone[key];
      return clone;
    });
  }, []);

  const getParam = React.useCallback((key) => {
    return globalParams[key];
  }, [globalParams]);

  useEffect(() => {
    setGlobalParams(filters || {});
  }, [filters]);

  const clearAllFilters = () => {
    setGlobalParams({});
    onFiltersChange?.({});
  };

  const applyFilters = () => {
    onFiltersChange?.(globalParams);
    setIsOpen(false);
  }

  const filterCount = Object.keys(filters || {}).length;

  return (
    <FiltersContext.Provider
      value={{
        updateParam,
        removeParam,
        getParam,
        idPrefix: idPrefix.current,
      }}
    >
      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
              {filterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="start">
            <DropdownMenuLabel className="flex p-2 items-center justify-between">
              Bộ lọc
              {filterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-auto px-2 py-1 text-xs"
                >
                  Xóa tất cả
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-4 p-2">
              {children}
              <Button
                className="ml-auto block"
                onClick={applyFilters}
              >
                Áp dụng
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </FiltersContext.Provider>
  );
}

function capitalizeFirst(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

Filters.StringFilter = ({ filterKey, label, placeholder }) => {
  const { updateParam, removeParam, getParam } = React.useContext(FiltersContext);
  const value = getParam(filterKey) || "";

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.trim()) {
      updateParam(filterKey, value);
    } else {
      removeParam(filterKey);
    }
  };

  const handleClear = () => {
    removeParam(filterKey);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        {label || capitalizeFirst(filterKey)}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Label>
      <Input
        placeholder={placeholder || `Enter ${filterKey}...`}
        value={value}
        onChange={handleInputChange}
      />
    </div>
  );
};

Filters.DateRangeFilter = ({ filterKey, label }) => {
  const { updateParam, removeParam, getParam } = React.useContext(FiltersContext);

  const storedDateRange = getParam(filterKey) || {};
  const startDate = storedDateRange.start ? new Date(storedDateRange.start) : null;
  const endDate = storedDateRange.end ? new Date(storedDateRange.end) : null;

  const handleStartDateSelect = (date) => {
    if (endDate && date && date > endDate) {
      return;
    }

    const dateRange = {
      ...storedDateRange,
      start: date
    };

    if (!dateRange.start) delete dateRange.start;

    if (dateRange.start || dateRange.end) {
      updateParam(filterKey, dateRange);
    } else {
      removeParam(filterKey);
    }
  };

  const handleEndDateSelect = (date) => {
    if (startDate && date && date < startDate) {
      return;
    }

    const dateRange = {
      ...storedDateRange,
      end: date
    };

    if (!dateRange.end) delete dateRange.end;

    if (dateRange.start || dateRange.end) {
      updateParam(filterKey, dateRange);
    } else {
      removeParam(filterKey);
    }
  };

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days);
    end.setHours(23, 59, 59, 999);

    const dateRange = {
      start: start,
      end: end,
    };
    updateParam(filterKey, dateRange);
  };

  const handleClear = () => {
    removeParam(filterKey);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label || `${capitalizeFirst(filterKey)} Range`}</Label>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex justify-between">
        <div className="flex flex-wrap justify-start gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickSelect(1)}
            className="text-secondary-foreground hover:text-blue-800 cursor-pointer"
          >
            1 ngày
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(2)}
            className="text-secondary-foreground hover:text-blue-800 cursor-pointer"
          >
            2 ngày
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(5)}
            className="text-secondary-foreground hover:text-blue-800 cursor-pointer"
          >
            5 ngày
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect(7)}
            className="text-secondary-foreground hover:text-blue-800 cursor-pointer"
          >
            7 ngày
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? startDate.toLocaleDateString() : "Từ"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateSelect}
              initialFocus
              disabled={(date) => endDate ? date > endDate : false}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? endDate.toLocaleDateString() : "Đến"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateSelect}
              initialFocus
              disabled={(date) => startDate ? date < startDate : false}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

Filters.NumberRangeFilter = ({ filterKey, label, step = 1 }) => {
  const { updateParam, removeParam, getParam } = React.useContext(FiltersContext);

  const minParam = getParam(filterKey)?.min;
  const maxParam = getParam(filterKey)?.max;
  const minValue = typeof minParam === "string" ? parseInt(minParam, 10) : typeof minParam === "number" ? minParam : "";
  const maxValue = typeof maxParam === "string" ? parseInt(maxParam, 10) : typeof maxParam === "number" ? maxParam : "";

  const handleUpdateParam = (key, value) => {
    const current = getParam(filterKey) || {};
    const newValue = Number.isNaN(parseInt(value, 10)) ? null : parseInt(value, 10);
    const newRange = { ...current, [key]: newValue };

    if (newRange.min == null && newRange.max == null) {
      removeParam(filterKey);
    } else {
      updateParam(filterKey, newRange);
    }
  };

  const handleClear = () => {
    removeParam(filterKey);
  };

  const hasValue = minValue !== "" || maxValue !== "";

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        {label || `${capitalizeFirst(filterKey)} Range`}
        {hasValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          step={step}
          placeholder="Tối thiểu"
          value={minValue}
          onChange={(e) => handleUpdateParam("min", e.target.value)}
        />
        <Input
          type="number"
          step={step}
          placeholder="Tối đa"
          value={maxValue}
          onChange={(e) => handleUpdateParam("max", e.target.value)}
        />
      </div>
    </div>
  );
};

Filters.DropdownFilter = ({
  filterKey,
  label,
  placeholder,
  options = [],
}) => {
  const { updateParam, removeParam, getParam } = React.useContext(FiltersContext);

  const handleSelect = (value) => {
    updateParam(filterKey, value);
  };

  const handleClear = () => {
    removeParam(filterKey);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        {label || capitalizeFirst(filterKey)}
        {getParam(filterKey) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Label>
      <Select value={getParam(filterKey) || ""} onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || `Select ${filterKey}...`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;

            return (
              <SelectItem key={value || index} value={value}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

Filters.DropdownMultipleSelectFilter = ({
  filterKey,
  label,
  placeholder,
  options = [],
}) => {
  const { updateParam, removeParam, getParam } = React.useContext(FiltersContext);
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedValues = getParam(filterKey) || [];
  const selectedArray = Array.isArray(selectedValues) ? selectedValues : [];

  const handleSelect = (value) => {
    const newSelected = selectedArray.includes(value)
      ? selectedArray.filter((item) => item !== value)
      : [...selectedArray, value];

    if (newSelected.length === 0) {
      removeParam(filterKey);
    } else {
      updateParam(filterKey, newSelected);
    }
  };

  const handleClear = () => {
    removeParam(filterKey);
    setIsOpen(false);
  };

  const getOptionLabel = (value) => {
    const option = options.find(
      (opt) => (typeof opt === "string" ? opt : opt.value) === value
    );
    return typeof option === "string" ? option : option?.label;
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        {label || capitalizeFirst(filterKey)}
        {selectedArray.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm border border-input bg-background rounded-md hover:bg-accent"
        >
          <div className="flex flex-wrap gap-1">
            {selectedArray.length > 0 ? (
              selectedArray.map((value) => (
                <Badge key={value} variant="secondary" className="text-xs">
                  {getOptionLabel(value)}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">
                {placeholder || `Select ${filterKey}...`}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 border border-input bg-background rounded-md shadow-md z-50">
            <div className="max-h-48 overflow-y-auto">
              {options.map((option, index) => {
                const value = typeof option === "string" ? option : option.value;
                const optionLabel = typeof option === "string" ? option : option.label;
                const isSelected = selectedArray.includes(value);

                return (
                  <button
                    key={value || index}
                    type="button"
                    className="flex items-center w-full px-3 py-2 cursor-pointer hover:bg-accent text-left"
                    onClick={() => handleSelect(value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelect(value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{optionLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
