import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { customFetch } from "@/utils/customAxios";
import { formatMention } from "@/utils/mentionParser";
import { useDebounce } from "@/hooks/use-debounce";

const MentionInput = ({
  value,
  onChange,
  onKeyPress,
  onKeyDown,
  placeholder,
  disabled,
  className,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [mentionStart, setMentionStart] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search products when debounced term changes
  useEffect(() => {
    const searchProducts = async (term) => {
      if (!term || term.length < 1) {
        setSuggestions([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          search: term,
          limit: "10",
          page: "1",
        });

        const apiUrl = `/manager/parts?${params.toString()}`;
        console.log("Searching products with URL:", apiUrl);

        const response = await customFetch(apiUrl);

        console.log("API Response:", response);
        console.log("Response data:", response.data);

        // Check response structure based on how other components use it
        let parts = [];
        if (response.data?.success) {
          parts = response.data.data || [];
        } else if (Array.isArray(response.data?.data)) {
          parts = response.data.data;
        } else if (Array.isArray(response.data)) {
          parts = response.data;
        }

        console.log("Parsed parts:", parts);

        setSuggestions(
          parts.map((part) => ({
            id: part._id || part.id,
            name: part.name || "Không có tên",
            price: part.price || 0,
            brand: part.brand || "",
          }))
        );
      } catch (error) {
        console.error("Error searching products:", error);
        console.error("Error response:", error.response);
        console.error("Error details:", error.response?.data || error.message);
        setSuggestions([]);
      }
    };

    if (debouncedSearchTerm) {
      searchProducts(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    onChange(e);

    // Check if cursor is after @ symbol
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Check if there's a space or closing bracket after @ (indicating mention is complete)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpaceOrBracket = /[\s\])]/.test(textAfterAt);

      if (!hasSpaceOrBracket) {
        // We're in a mention
        const mentionText = textAfterAt;
        setMentionStart(lastAtIndex);
        setSearchTerm(mentionText);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
        setMentionStart(-1);
        setSearchTerm("");
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(-1);
      setSearchTerm("");
    }
  };

  // Handle selecting a suggestion
  const selectSuggestion = (product) => {
    if (mentionStart === -1) return;

    const textBeforeMention = value.substring(0, mentionStart);
    const textAfterCursor = value.substring(
      mentionStart + 1 + searchTerm.length
    );
    const mentionText = formatMention(product.name, product.id);
    const newValue = textBeforeMention + mentionText + " " + textAfterCursor;

    onChange({ target: { value: newValue } });
    setShowSuggestions(false);
    setMentionStart(-1);
    setSearchTerm("");
    setSelectedIndex(-1);

    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        const cursorPos = mentionStart + mentionText.length + 1;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // If suggestions are showing and there are suggestions
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        return;
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        return;
      }
    }

    // For Enter key, if not selecting a suggestion, allow normal behavior (sending message)
    if (
      e.key === "Enter" &&
      (!showSuggestions || suggestions.length === 0 || selectedIndex < 0)
    ) {
      // Close suggestions if open
      if (showSuggestions) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
      // Call the parent handler (either onKeyDown or onKeyPress for compatibility)
      if (onKeyDown) {
        onKeyDown(e);
      } else if (onKeyPress) {
        onKeyPress(e);
      }
      return;
    }

    // For other keys, pass through
    if (onKeyDown) {
      onKeyDown(e);
    } else if (onKeyPress) {
      onKeyPress(e);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
        >
          {suggestions.map((product, index) => (
            <div
              key={product.id}
              onClick={() => selectSuggestion(product)}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? "bg-blue-50" : ""
              } ${index === 0 ? "rounded-t-lg" : ""} ${
                index === suggestions.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  {product.brand && (
                    <p className="text-sm text-gray-500 truncate">
                      {product.brand}
                    </p>
                  )}
                </div>
                {product.price > 0 && (
                  <p className="text-sm font-semibold text-blue-600 ml-4">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showSuggestions && suggestions.length === 0 && searchTerm && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-gray-500 text-center">
            Không tìm thấy sản phẩm
          </p>
        </div>
      )}
    </div>
  );
};

export default MentionInput;
