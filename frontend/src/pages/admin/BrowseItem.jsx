import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLoaderData, useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import ErrorPage from "@/components/global/Error";
import { customFetch } from "@/utils/customAxios";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import SheetComponent from "@/components/item/SheetComponent";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Eye, Info, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

// Custom Table component without overflow-x-auto
const CustomTable = ({ className, ...props }) => {
  return (
    <table
      data-slot="table"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  );
};

/**
 * ====================================
 * loader
 * ====================================
 */
export const browseLoader = async () => {
  try {
    const browseItemData = await customFetch("/admin/items/browse");
    return {
      data: browseItemData.data.data,
    };
  } catch {
    // Error ignored
    return {
      message: "something wrong",
    };
  }
};

// Helper function to get badge styling based on item type and status
const getItemBadge = (product) => {
  // Kiểm tra chính xác hơn về pending update
  if (product.isUpdated && product.pendingChanges) {
    return (
      <Badge className="bg-orange-500 hover:bg-orange-600">
        Pending Update
      </Badge>
    );
  } else if (product.isAuction) {
    return (
      <Badge className="bg-purple-500 hover:bg-purple-600">
        Pending Auction
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600">Pending New Item</Badge>
    );
  }
};

// Helper to format date
const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy HH:mm");
  } catch {
    return "Invalid date";
  }
};

// Error component
const ErrorComponent = ({ message }) => {
  return <ErrorPage errorCode={"400"} message={message}></ErrorPage>;
};

// Item Detail Dialog Component
const ItemDetailDialog = ({ product, isOpen, onOpenChange }) => {
  if (!product) return null;

  const isAuction = product.isAuction;
  const isUpdated = product.isUpdated;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {product.name}
            {getItemBadge(product)}
          </DialogTitle>
          <DialogDescription>
            Item ID: {product._id}
            {isUpdated
              ? " (Pending Update)"
              : isAuction
              ? " (Pending Auction)"
              : " (Pending New Item)"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              {isUpdated && (
                <TabsTrigger value="changes">Pending Changes</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Basic Information</h3>
                    <dl className="space-y-2">
                      <div className="grid grid-cols-[1fr_2fr]">
                        <dt className="text-sm font-medium text-gray-500">
                          Price:
                        </dt>
                        <dd className="text-sm">${product.price}</dd>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr]">
                        <dt className="text-sm font-medium text-gray-500">
                          Category:
                        </dt>
                        <dd className="text-sm">{product.category}</dd>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr]">
                        <dt className="text-sm font-medium text-gray-500">
                          Type:
                        </dt>
                        <dd className="text-sm">{product.type}</dd>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr]">
                        <dt className="text-sm font-medium text-gray-500">
                          Status:
                        </dt>
                        <dd className="text-sm">
                          <Badge>{product.status}</Badge>
                        </dd>
                      </div>
                      <div className="grid grid-cols-[1fr_2fr]">
                        <dt className="text-sm font-medium text-gray-500">
                          Created:
                        </dt>
                        <dd className="text-sm">
                          {formatDate(product.createdAt)}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {isAuction && (
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="font-medium mb-2">Auction Details</h3>
                      <dl className="space-y-2">
                        <div className="grid grid-cols-[1fr_2fr]">
                          <dt className="text-sm font-medium text-gray-500">
                            Starting Price:
                          </dt>
                          <dd className="text-sm">
                            ${product.startPrice || product.price}
                          </dd>
                        </div>
                        {product.startTime && (
                          <div className="grid grid-cols-[1fr_2fr]">
                            <dt className="text-sm font-medium text-gray-500">
                              Start Time:
                            </dt>
                            <dd className="text-sm">
                              {formatDate(product.startTime)}
                            </dd>
                          </div>
                        )}
                        {product.endTime && (
                          <div className="grid grid-cols-[1fr_2fr]">
                            <dt className="text-sm font-medium text-gray-500">
                              End Time:
                            </dt>
                            <dd className="text-sm">
                              {formatDate(product.endTime)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.images && product.images.length > 0 ? (
                  product.images.map((image, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border"
                    >
                      <img
                        src={image}
                        alt={`${product.name} image ${index + 1}`}
                        className="w-full h-auto object-cover aspect-video"
                        onError={(e) => {
                          e.target.src = "/assets/fallback.png";
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No images available
                  </div>
                )}
              </div>
            </TabsContent>

            {isUpdated && (
              <TabsContent value="changes">
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Requested Changes</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-[100px_1fr_1fr] gap-2">
                        <div className="font-medium text-gray-500"></div>
                        <div className="font-medium text-gray-500">Current</div>
                        <div className="font-medium text-gray-500">
                          Proposed
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-[100px_1fr_1fr] gap-2 items-start">
                        <div className="font-medium text-gray-500">Name:</div>
                        <div>{product.name}</div>
                        <div className="text-green-600">
                          {product.pendingChanges.name}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-[100px_1fr_1fr] gap-2 items-start">
                        <div className="font-medium text-gray-500">Price:</div>
                        <div>${product.price}</div>
                        <div className="text-green-600">
                          ${product.pendingChanges.price}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-[100px_1fr_1fr] gap-2 items-start">
                        <div className="font-medium text-gray-500">
                          Description:
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {product.description}
                        </div>
                        <div className="text-sm whitespace-pre-wrap text-green-600">
                          {product.pendingChanges.description}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-medium text-gray-500 mb-2">
                          Request Date:
                        </div>
                        <div>
                          {formatDate(product.pendingChanges.requestDate)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            {/* Action buttons */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Reject</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reject the{" "}
                    {isUpdated
                      ? "update request"
                      : isAuction
                      ? "auction item"
                      : "new item"}
                    .
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  className="bg-[#169976] hover:bg-[#1DCD9F]"
                >
                  Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {product.isUpdated
                      ? "Approve Item Update"
                      : product.isAuction
                      ? "Approve New Auction Item"
                      : "Approve New Item"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {product.isUpdated
                      ? "This will approve the requested changes to this item."
                      : product.isAuction
                      ? "This auction item will be available for everyone in the system."
                      : "This item will be available for everyone in the system."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-green-500 hover:bg-green-600">
                    Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
const BrowseItemContent = ({ data }) => {
  // Basic setup
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("search") || "";
  const typeFilter = searchParams.get("type") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sortBy") || "newest";
  const perPage = parseInt(searchParams.get("perPage") || "6");

  // State
  const [submit, setSubmit] = useState(false);
  const [search, setSearch] = useState(searchQuery);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Data processing
  const products = data || [];

  // Per page options
  const perPageOptions = [
    { value: "6", label: "6 per page" },
    { value: "10", label: "10 per page" },
    { value: "15", label: "15 per page" },
    { value: "20", label: "20 per page" },
    { value: "30", label: "30 per page" },
  ];

  // Filter definitions
  const itemTypes = [
    { value: "all", label: "All Types" },
    { value: "auction", label: "Auction Items" },
    { value: "regular", label: "Regular Items" },
  ];

  const statusTypes = [
    { value: "all", label: "All Status" },
    { value: "updated", label: "Updated Items" },
    { value: "new", label: "New Items" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
  ];

  // Get current sort option label
  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === sortBy);
    return option ? option.label : "Sort By";
  };

  // Filtering and sorting products based on all criteria
  const filteredProducts = useMemo(() => {
    // First apply text search
    let filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase()) ||
        product.type.toLowerCase().includes(search.toLowerCase())
    );

    // Then apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((product) => {
        if (typeFilter === "auction") return product.isAuction;
        if (typeFilter === "regular") return !product.isAuction;
        return true;
      });
    }

    // Then apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => {
        if (statusFilter === "updated") return product.isUpdated;
        if (statusFilter === "new") return !product.isUpdated;
        return true;
      });
    }

    // Finally apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [products, search, typeFilter, statusFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Event handlers
  const handleSearchChange = (value) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    params.set("search", value);
    params.set("page", "1"); // Reset to first page on search
    setSearchParams(params);
  };

  const handleTypeFilterChange = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("type", value);
    params.set("page", "1"); // Reset to first page on filter change
    setSearchParams(params);
  };

  const handleStatusFilterChange = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", value);
    params.set("page", "1"); // Reset to first page on filter change
    setSearchParams(params);
  };

  const handleSortChange = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", value);
    setSearchParams(params);
  };

  const handlePerPageChange = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("perPage", value);
    params.set("page", "1"); // Reset to first page when changing items per page
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleApproveItem = async (product) => {
    try {
      setSubmit(true);

      if (product.isUpdated) {
        // If it's an update, use the approve-edit endpoint
        const response = await customFetch.post(
          `/admin/items/${product._id}/approve-edit`,
          {
            adminId: localStorage.getItem("adminId") || "admin",
          }
        );

        if (response.data && response.data.success) {
          toast.success("Item update approved successfully");
        } else {
          toast.error(
            response.data?.message || "Unknown error approving item update"
          );
        }
      } else {
        // For new items
        const response = await customFetch.post("/admin/items/approve", {
          itemId: product._id,
          approve: true,
        });

        if (response.data && response.data.success) {
          toast.success("Item approved successfully");
        } else {
          toast.error(response.data?.message || "Unknown error approving item");
        }
      }

      setSubmit(false);
      navigate(location.pathname, { replace: true });
    } catch (error) {
      console.error("Error approving item:", error);

      // Show a more specific error message based on the response if available
      const errorMsg =
        error.response?.data?.message || "Error in approving item";
      toast.error(errorMsg);

      setSubmit(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (search) params.set("search", search);
    params.set("perPage", perPage.toString());
    setSearchParams(params);
  };

  // Open item detail dialog
  const handleOpenItemDetail = (product) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="rounded-lg shadow-lg p-4">
        <div className="flex flex-col space-y-4 mb-6">
          {/* Header and search */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1DCD9F] mb-4 md:mb-0">
              Waiting Items List ({filteredProducts.length})
            </h2>
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                className="pl-10 pr-4 py-2 w-full"
                placeholder="Search items..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              <Filter size={16} className="mr-2 text-gray-500" />
              <span className="text-sm font-medium mr-2">Filters:</span>
            </div>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="h-9 w-32 md:w-36">
                <SelectValue placeholder="Item Type" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="h-9 w-32 md:w-36">
                <SelectValue placeholder="Item Status" />
              </SelectTrigger>
              <SelectContent>
                {statusTypes.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Items per page selector */}
            <Select
              value={perPage.toString()}
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className="h-9 w-32 md:w-36">
                <div className="flex items-center">
                  <List className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Per page" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <span>{getCurrentSortLabel()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={sortBy === option.value ? "bg-gray-100" : ""}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear filters button - only show if any filter is active */}
            {(typeFilter !== "all" ||
              statusFilter !== "all" ||
              sortBy !== "newest") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-full">
            <CustomTable className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-[#169976]">
                  <TableHead className="text-[#1DCD9F] w-16">Image</TableHead>
                  <TableHead className="text-[#1DCD9F] w-1/6">Name</TableHead>
                  <TableHead className="text-[#1DCD9F] w-20">Price</TableHead>
                  <TableHead className="text-[#1DCD9F] w-1/6">
                    Category
                  </TableHead>
                  <TableHead className="text-[#1DCD9F] w-1/6">Type</TableHead>
                  {/* <TableHead className="text-[#1DCD9F] w-28">Status</TableHead> */}
                  <TableHead className="text-[#1DCD9F] w-28">Created</TableHead>
                  <TableHead className="text-[#1DCD9F] w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow
                    key={product._id}
                    className={`border-[#169976] hover:bg-gray-50 cursor-pointer ${
                      product.isUpdated
                        ? "bg-orange-50"
                        : product.isAuction
                        ? "bg-purple-50"
                        : "bg-blue-50"
                    }`}
                    onClick={() => handleOpenItemDetail(product)}
                  >
                    <TableCell
                      className="p-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={
                          product.image || (product.images && product.images[0])
                        }
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md cursor-pointer"
                        onClick={() => handleOpenItemDetail(product)}
                        onError={(e) => {
                          e.target.src = "/assets/fallback.png";
                        }}
                      />
                    </TableCell>
                    <TableCell className="truncate max-w-[120px]">
                      <div className="flex flex-col">
                        <span
                          className="truncate font-medium"
                          title={product.name}
                        >
                          {product.name}
                        </span>
                        <div className="mt-1">{getItemBadge(product)}</div>
                      </div>
                    </TableCell>
                    <TableCell>${product.price}</TableCell>
                    <TableCell className="truncate" title={product.category}>
                      {product.category}
                    </TableCell>
                    <TableCell>{product.type}</TableCell>
                    {/* <TableCell>
                      {product.isUpdated ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Badge className="bg-orange-500 hover:bg-orange-600">
                                Pending Update
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="p-2">
                                <div>Original: {product.name}</div>
                                <div>Update: {product.pendingChanges.name}</div>
                                <div>
                                  Price: ${product.price} → $
                                  {product.pendingChanges.price}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge>
                          {product.isAuction
                            ? "Pending Auction"
                            : "Pending New Item"}
                        </Badge>
                      )}
                    </TableCell> */}
                    <TableCell className="text-xs">
                      {product.isUpdated
                        ? formatDate(product.pendingChanges.requestDate)
                        : formatDate(product.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenItemDetail(product);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            className="bg-[#169976] text-white hover:bg-[#1DCD9F] 
        px-2 py-1 rounded-full cursor-pointer w-7 h-7 
  flex items-center justify-center"
                          >
                            {submit ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 bg-red-600 border-white"></div>
                            ) : (
                              "✓"
                            )}
                          </AlertDialogTrigger>

                          <AlertDialogContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {product.isUpdated
                                  ? "Approve Item Update"
                                  : product.isAuction
                                  ? "Approve New Auction Item"
                                  : "Approve New Item"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {product.isUpdated
                                  ? "This will approve the requested changes to this item."
                                  : product.isAuction
                                  ? "This auction item will be available for everyone in the system."
                                  : "This item will be available for everyone in the system."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className={"cursor-pointer"}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className={"bg-green-400 cursor-pointer"}
                                onClick={() => handleApproveItem(product)}
                              >
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <SheetComponent itemId={product._id}></SheetComponent>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </CustomTable>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {typeFilter !== "all" || statusFilter !== "all" || search
              ? "No items match your filter criteria."
              : "No pending items found. All items have been processed."}
          </div>
        )}

        {/* Pagination and items per page info */}
        {filteredProducts.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
              <div className="text-sm text-gray-500 mb-3 sm:mb-0">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredProducts.length)} of{" "}
                {filteredProducts.length} items
              </div>
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: totalPages }).map((_, i) => {
                    // Show first page, last page, and pages around current page
                    if (
                      i === 0 ||
                      i === totalPages - 1 ||
                      (i >= currentPage - 2 && i <= currentPage)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => handlePageChange(i + 1)}
                            isActive={currentPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    // Show ellipsis for skipped pages
                    if (i === 1 && currentPage > 3) {
                      return (
                        <PaginationItem key="ellipsis-1">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    if (i === totalPages - 2 && currentPage < totalPages - 2) {
                      return (
                        <PaginationItem key="ellipsis-2">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Item detail dialog */}
      <ItemDetailDialog
        product={selectedProduct}
        isOpen={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};

/**
 * ====================================
 * Page Container
 * ====================================
 */
export const BrowseItem = () => {
  const loaderData = useLoaderData();

  if (loaderData.message) {
    return <ErrorComponent message={loaderData.message} />;
  }

  return <BrowseItemContent data={loaderData.data.data} />;
};

export default BrowseItem;
