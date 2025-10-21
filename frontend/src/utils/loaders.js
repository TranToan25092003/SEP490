import { customFetch } from "./customAxios";
import { toast } from "sonner";

// Load parts data with pagination and filtering
export const partsLoader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (searchParams.get("page"))
      queryParams.append("page", searchParams.get("page"));
    if (searchParams.get("limit"))
      queryParams.append("limit", searchParams.get("limit"));
    if (searchParams.get("search"))
      queryParams.append("search", searchParams.get("search"));
    if (searchParams.get("brand"))
      queryParams.append("brand", searchParams.get("brand"));
    if (searchParams.get("vehicleModel"))
      queryParams.append("vehicleModel", searchParams.get("vehicleModel"));
    if (searchParams.get("sortBy"))
      queryParams.append("sortBy", searchParams.get("sortBy"));
    if (searchParams.get("sortOrder"))
      queryParams.append("sortOrder", searchParams.get("sortOrder"));

    const response = await customFetch(
      `/manager/parts?${queryParams.toString()}`
    );

    // customFetch returns axios response, so we need response.data
    const apiResponse = response.data;

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || "Failed to load parts");
    }

    return {
      parts: apiResponse.data,
      pagination: apiResponse.pagination,
    };
  } catch (error) {
    console.error("Parts loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải danh sách phụ tùng",
    });

    return {
      parts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    };
  }
};

// Load single part data
export const partLoader = async ({ params }) => {
  try {
    const response = await customFetch(`/manager/parts/${params.id}`);

    const apiResponse = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || "Failed to load part");
    }

    return apiResponse.data;
  } catch (error) {
    console.error("Part loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải thông tin phụ tùng",
    });

    return null;
  }
};

// Load vehicle models data (replaces categories)
export const vehicleModelsLoader = async () => {
  try {
    const response = await customFetch("/manager/parts/vehicle-models");

    const apiResponse = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || "Failed to load vehicle models");
    }

    return apiResponse.data;
  } catch (error) {
    console.error("Vehicle models loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải danh sách xe",
    });

    return [];
  }
};

// Load parts by vehicle model
export const partsByVehicleModelLoader = async ({ params, request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const queryParams = new URLSearchParams();
    if (searchParams.get("page"))
      queryParams.append("page", searchParams.get("page"));
    if (searchParams.get("limit"))
      queryParams.append("limit", searchParams.get("limit"));

    const response = await customFetch(
      `/manager/parts/vehicle-model/${params.modelId}?${queryParams.toString()}`
    );

    const apiResponse = response.data;
    if (!apiResponse.success) {
      throw new Error(
        apiResponse.message || "Failed to load parts by vehicle model"
      );
    }

    return {
      parts: apiResponse.data,
      pagination: apiResponse.pagination,
      modelId: params.modelId,
    };
  } catch (error) {
    console.error("Parts by vehicle model loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải phụ tùng theo dòng xe",
    });

    return {
      parts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
      modelId: params.modelId,
    };
  }
};

// Load parts by brand
export const partsByBrandLoader = async ({ params, request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const queryParams = new URLSearchParams();
    if (searchParams.get("page"))
      queryParams.append("page", searchParams.get("page"));
    if (searchParams.get("limit"))
      queryParams.append("limit", searchParams.get("limit"));

    const response = await customFetch(
      `/manager/parts/brand/${params.brand}?${queryParams.toString()}`
    );

    const apiResponse = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.message || "Failed to load parts by brand");
    }

    return {
      parts: apiResponse.data,
      pagination: apiResponse.pagination,
      brand: params.brand,
    };
  } catch (error) {
    console.error("Parts by brand loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải phụ tùng theo thương hiệu",
    });

    return {
      parts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
      brand: params.brand,
    };
  }
};

// Combined loader for parts page (parts + vehicle models)
export const partsPageLoader = async ({ request }) => {
  try {
    const [partsResult, vehicleModelsResult] = await Promise.all([
      partsLoader({ request }),
      vehicleModelsLoader(),
    ]);

    return {
      ...partsResult,
      vehicleModels: vehicleModelsResult,
    };
  } catch (error) {
    console.error("Parts page loader error:", error);
    return {
      parts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
      vehicleModels: [],
    };
  }
};

// Combined loader for add/edit part page (vehicle models + optional part data)
export const partFormLoader = async ({ params }) => {
  try {
    const promises = [vehicleModelsLoader()];

    // If editing, also load the part data
    if (params.id && params.id !== "add") {
      promises.push(partLoader({ params }));
    }

    const results = await Promise.all(promises);

    return {
      vehicleModels: results[0] || [],
      part: results[1] || null, // null for new part, part data for edit
    };
  } catch (error) {
    console.error("Part form loader error:", error);
    return {
      vehicleModels: [],
      part: null,
    };
  }
};

// Load goods receipts data with pagination and filtering
export const goodsReceiptListLoader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (searchParams.get("page"))
      queryParams.append("page", searchParams.get("page"));
    if (searchParams.get("limit"))
      queryParams.append("limit", searchParams.get("limit"));
    if (searchParams.get("search"))
      queryParams.append("search", searchParams.get("search"));
    if (searchParams.get("status"))
      queryParams.append("status", searchParams.get("status"));

    const response = await customFetch(
      `/manager/goods-receipt?${queryParams.toString()}`
    );

    // customFetch returns axios response, so we need response.data
    const apiResponse = response.data;

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || "Failed to load goods receipts");
    }

    return {
      receipts: apiResponse.receipts,
      pagination: apiResponse.pagination,
    };
  } catch (error) {
    console.error("Goods receipts loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải danh sách phiếu nhập kho",
    });

    return {
      receipts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    };
  }
};

// Load parts data for client (public API)
export const partsClientLoader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (searchParams.get("page"))
      queryParams.append("page", searchParams.get("page"));
    if (searchParams.get("limit"))
      queryParams.append("limit", searchParams.get("limit"));
    if (searchParams.get("search"))
      queryParams.append("search", searchParams.get("search"));
    if (searchParams.get("brand"))
      queryParams.append("brand", searchParams.get("brand"));
    if (searchParams.get("vehicleModel"))
      queryParams.append("vehicleModel", searchParams.get("vehicleModel"));
    if (searchParams.get("sortBy"))
      queryParams.append("sortBy", searchParams.get("sortBy"));
    if (searchParams.get("sortOrder"))
      queryParams.append("sortOrder", searchParams.get("sortOrder"));

    const response = await customFetch(`/parts?${queryParams.toString()}`);

    const apiResponse = response.data;

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || "Failed to load parts");
    }

    return {
      parts: apiResponse.data,
      pagination: apiResponse.pagination,
    };
  } catch (error) {
    console.error("Parts client loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải danh sách phụ tùng",
    });

    return {
      parts: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    };
  }
};

// Load single part data by client
export const partLoaderByClient = async ({ params }) => {
  try {
    // Fetch the main product details
    const mainProductResponse = await customFetch(`/parts/${params.id}`);
    const mainProductApiResponse = mainProductResponse.data;

    if (!mainProductApiResponse.success) {
      throw new Error(
        mainProductApiResponse.message || "Failed to load part details"
      );
    }
    const product = mainProductApiResponse.data;

    // Fetch related products based on the brand
    let relatedProducts = [];
    if (product && product.brand) {
      const relatedResponse = await customFetch(
        `/parts?brand=${product.brand}`
      );
      const relatedApiResponse = relatedResponse.data;
      if (relatedApiResponse.success) {
        relatedProducts = relatedApiResponse.data.filter(
          (p) => p._id !== product._id
        );
      }
    }
    return { product, relatedProducts };
  } catch (error) {
    console.error("Part detail loader error:", error);
    toast.error("Lỗi tải dữ liệu", {
      description: error.message || "Không thể tải thông tin chi tiết phụ tùng",
    });
    return { product: null, relatedProducts: [] };
  }
};
