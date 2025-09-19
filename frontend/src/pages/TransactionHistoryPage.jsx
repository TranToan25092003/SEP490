import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Divider,
  Spin,
  Tabs,
  Pagination,
  Collapse,
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Upload,
  Tag,
} from "antd";
import {
  ShoppingOutlined,
  EditOutlined,
  UploadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
const { Paragraph, Text } = Typography;
const { Content } = Layout;
import { useAuth } from "@clerk/clerk-react";
import { getAllBorrowRecord } from "@/API/duc.api/borrow.api";
import { getAllBuyRecord } from "@/API/duc.api/buy.api";
import erroImg from "../assets/error-image.png";
import {
  getUserUploadedItems,
  submitItemEditRequest,
} from "@/API/duc.api/item.api";
import { getAllCategories } from "@/API/duc.api/category.api";
import { uploadImage } from "@/utils/uploadCloudinary";
import { useNavigate, Link } from "react-router-dom";
import ExtendBorrowModal from "@/components/item/extend-borrow-modal";
import RequestReturnModal from "@/components/item/request-return-borrow-modal";
import ConfirmReturnModal from "@/components/item/confirm-return-borrow-modal";

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("uploaded");
  const [buyRecords, setBuyRecords] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();
  const [buyCurrentPage, setBuyCurrentPage] = useState(1);
  const [borrowCurrentPage, setBorrowCurrentPage] = useState(1);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [uploadedCurrentPage, setUploadedCurrentPage] = useState(1);
  const pageSize = 10;

  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedBorrowId, setSelectedBorrowId] = useState(null);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(null);

  // Add state for edit functionality
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentCategoryName, setCurrentCategoryName] =
    useState("Select a category");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [buyRes, borrowRes, uploadedRes, categoriesRes] =
          await Promise.all([
            getAllBuyRecord(token),
            getAllBorrowRecord(token),
            getUserUploadedItems(token),
            getAllCategories(), // Use the new API
          ]);
        if (buyRes.success) setBuyRecords(buyRes.data);
        if (borrowRes.success) setBorrowRecords(borrowRes.data);
        if (uploadedRes.success) setUploadedItems(uploadedRes.data);
        if (categoriesRes.success) setCategories(categoriesRes.data);

        console.log("Loaded categories:", categoriesRes.data);
      } catch (error) {
        setError("Failed to fetch transaction history");
        console.error(error);
      }
      setLoading(false);
    };
    fetchData();
  }, [getToken]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const paginateData = (data, currentPage) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  };

  const handleExtendSuccess = async () => {
    setExtendModalVisible(false);
    const token = await getToken();
    const borrowRes = await getAllBorrowRecord(token);
    if (borrowRes.success) setBorrowRecords(borrowRes.data);
  };

  const handleReturnSuccess = async () => {
    setReturnModalVisible(false);
    const token = await getToken();
    const borrowRes = await getAllBorrowRecord(token);
    if (borrowRes.success) setBorrowRecords(borrowRes.data);
  };

  const handleItemClick = (item) => {
    event.stopPropagation();
    navigate(`/item/${item.id}`);
  };

  // Function to handle item editing
  const handleEditItem = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    console.log("Editing item:", item);

    setFileList(
      item.images
        ? item.images.map((url, index) => ({
            uid: `-${index}`,
            name: `image-${index}.jpg`,
            status: "done",
            url,
          }))
        : []
    );

    // Set the current category name for placeholder
    setCurrentCategoryName(item.category || "Select a category");

    // Find the categoryId from the name if needed
    let categoryId = item.categoryId?._id;
    if (!categoryId && item.category && categories.length > 0) {
      const matchingCategory = categories.find(
        (cat) =>
          cat.name === item.category ||
          cat.label === item.category ||
          cat.title === item.category
      );
      if (matchingCategory) {
        categoryId = matchingCategory._id;
        console.log(
          `Found matching category: ${matchingCategory.name} (${categoryId})`
        );
      }
    }

    console.log("Setting category ID in form:", categoryId);
    console.log("Current category name:", item.category);

    // Pre-fill form with existing item data - INCLUDING category
    editForm.setFieldsValue({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: categoryId, // Set the categoryId to automatically select it
    });

    setEditModalVisible(true);
  };

  // Function to handle image preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
    );
  };

  // Function to convert file to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to handle file list changes
  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Function to close preview
  const handleCancel = () => setPreviewOpen(false);

  // Function to submit edit request
  const handleEditSubmit = async (values) => {
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      // Check for valid itemId
      const itemId = selectedItem.id || selectedItem._id;
      if (!itemId) {
        console.error("Missing item ID:", selectedItem);
        message.error("Cannot identify item. Missing ID.");
        setSubmitting(false);
        return;
      }

      console.log(`Starting edit submission for item ${itemId}`);
      console.log("Form values:", values);

      // Handle image uploads if there are any new images
      setUploading(true);
      const newImages = fileList.filter(
        (file) => !file.url && file.originFileObj
      );
      let uploadedImages = [];

      if (newImages.length > 0) {
        console.log("Uploading new images:", newImages.length);
        // Upload new images
        const uploadPromises = newImages.map((file) =>
          uploadImage(file.originFileObj)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        uploadedImages = uploadedUrls.filter((url) => url !== null);
        console.log("Successfully uploaded images:", uploadedImages.length);
      }

      // Combine existing images with newly uploaded ones
      const existingImages = fileList
        .filter((file) => file.url)
        .map((file) => file.url);

      const allImages = [...existingImages, ...uploadedImages];
      setUploading(false);

      // We should always have a category now since it's pre-selected and required
      const categoryId = values.categoryId;

      if (!categoryId) {
        console.error("Missing categoryId in form values");
        message.error("Please select a category");
        setSubmitting(false);
        return;
      }

      console.log("Submitting with category:", categoryId);

      const token = await getToken();
      if (!token) {
        console.error("Failed to get authentication token");
        message.error("Authentication error. Please try logging in again.");
        setSubmitting(false);
        return;
      }

      console.log("Got authentication token");

      // Combine form values with images
      const editData = {
        ...values,
        categoryId: categoryId,
        images: allImages,
      };

      console.log("Final edit data:", editData);

      // Use our API function
      console.log(`Calling API submitItemEditRequest for item ${itemId}`);
      try {
        const response = await submitItemEditRequest(itemId, editData, token);

        console.log("API response:", response);

        if (response.success) {
          message.success({
            content: (
              <div>
                <div className="font-bold">
                  Đã gửi yêu cầu chỉnh sửa thành công!
                </div>
                <div>
                  Thay đổi của bạn sẽ được hiển thị sau khi được quản trị viên
                  phê duyệt.
                </div>
                <div>
                  Bạn vẫn có thể tiếp tục chỉnh sửa cho đến khi được phê duyệt.
                </div>
              </div>
            ),
            duration: 5,
            style: {
              marginTop: "20vh",
            },
          });
          setEditModalVisible(false);

          // Update the item in the current list with the updated data
          if (response.data) {
            const updatedItems = uploadedItems.map((item) => {
              if (item.id === itemId || item._id === itemId) {
                // Return updated item data from response
                return {
                  ...item,
                  ...response.data,
                  status: "Pending", // Make sure status shows as pending
                  pendingChanges: response.data.pendingChanges,
                };
              }
              return item;
            });

            // Update the state with the new items list
            setUploadedItems(updatedItems);

            // Also refresh from the server to be sure
            const updatedRes = await getUserUploadedItems(token);
            if (updatedRes.success) setUploadedItems(updatedRes.data);
          } else {
            // Fallback to just refreshing from server if no data in response
            const updatedRes = await getUserUploadedItems(token);
            if (updatedRes.success) setUploadedItems(updatedRes.data);
          }
        } else {
          console.error("API returned error:", response);
          message.error(response.message || "Failed to submit edit request");
        }
      } catch (apiError) {
        console.error("Error during API call:", apiError);
        message.error(`API Error: ${apiError.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting edit request:", error);
      message.error("An error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  // Function to check if item is editable
  const isItemEditable = (item) => {
    // Debug log để kiểm tra status của item
    console.log("Item status:", item.status, "Item type:", item.type);

    // Allow editing if item is not sold, not borrowed, and not in auction
    // Also allow editing for pending items
    return (
      item.status.toLowerCase() !== "sold" &&
      item.status.toLowerCase() !== "borrowed" &&
      item.status.toLowerCase() !== "in auction"
    );
  };

  const items = [
    {
      key: "uploaded",
      label: "Uploaded Items",
      children: loading ? (
        <Spin />
      ) : error ? (
        <Paragraph type="danger">{error}</Paragraph>
      ) : uploadedItems.length === 0 ? (
        <Paragraph>No uploaded items found.</Paragraph>
      ) : (
        <div>
          {paginateData(uploadedItems, uploadedCurrentPage).map((item) => (
            <div key={item.id || item.name} className="mb-4">
              <Collapse
                accordion
                expandIconPosition="right"
                defaultActiveKey={[]}
                className="bg-white border rounded-lg shadow-md"
              >
                <Collapse.Panel
                  header={
                    <div className="flex items-center w-full">
                      <img
                        src={item.images[0] || erroImg}
                        alt={item.name || "Item"}
                        className="w-12 h-12 object-cover rounded mr-4"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">
                          <span
                            className="cursor-pointer hover:text-blue-600"
                            onClick={(e) => handleItemClick(item, e)}
                          >
                            {/* Hiển thị tên từ pendingChanges nếu sản phẩm đang pending và có pendingChanges */}
                            {item.status === "Pending" &&
                            item.pendingChanges?.name
                              ? item.pendingChanges.name
                              : item.name || "Unknown Item"}
                          </span>
                          {/* {item.status === "Pending" && item.pendingChanges && (
                            <Tag color="orange" className="ml-2">
                              Đang chờ duyệt
                            </Tag>
                          )} */}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm mb-1">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                            Category:{" "}
                            {item.status === "Pending" &&
                            item.pendingChanges?.category
                              ? item.pendingChanges.category
                              : item.category || "N/A"}
                          </span>
                          <span className="text-gray-600">
                            {item.status === "Pending" &&
                            item.pendingChanges?.price
                              ? formatPrice(item.pendingChanges.price)
                              : formatPrice(item.price)}{" "}
                            | {item.type || "N/A"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              item.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : item.status === "Borrowed"
                                ? "bg-purple-100 text-purple-800"
                                : item.status === "Sold"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status || "N/A"}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs">
                          Uploaded:{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {/* Add Edit button for editable items */}
                      {isItemEditable(item) ? (
                        <Button
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={(e) => handleEditItem(item, e)}
                          className={`ml-4 mr-4 ${
                            item.status === "Pending"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          } text-white font-bold`}
                          size="large"
                        >
                          {item.status === "Pending" && item.pendingChanges
                            ? "Chỉnh sửa tiếp"
                            : "Chỉnh sửa"}
                        </Button>
                      ) : (
                        <div className="ml-4 mr-4 text-xs text-gray-500">
                          {item.status === "Sold" && "Đã bán"}
                          {item.status === "Borrowed" && "Đang cho mượn"}
                          {item.status === "In Auction" && "Đang đấu giá"}
                        </div>
                      )}
                    </div>
                  }
                  key={item.id || item.name}
                >
                  {/* Item details when expanded */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    <div>
                      <h4 className="font-semibold mb-2">Item Details</h4>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Name:</span>{" "}
                          {item.status === "Pending" &&
                          item.pendingChanges?.name ? (
                            <>
                              <span className="line-through text-gray-400">
                                {item.name}
                              </span>{" "}
                              <span className="text-blue-600">
                                {item.pendingChanges.name}
                              </span>
                            </>
                          ) : (
                            item.name
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Description:</span>{" "}
                          {item.status === "Pending" &&
                          item.pendingChanges?.description ? (
                            <>
                              <div className="line-through text-gray-400">
                                {item.description}
                              </div>
                              <div className="text-blue-600">
                                {item.pendingChanges.description}
                              </div>
                            </>
                          ) : (
                            item.description
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Category:</span>{" "}
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                            {item.status === "Pending" &&
                            item.pendingChanges?.category ? (
                              <>
                                <span className="line-through text-gray-400">
                                  {item.category}
                                </span>{" "}
                                <span className="text-blue-600">
                                  {item.pendingChanges.category}
                                </span>
                              </>
                            ) : (
                              item.category
                            )}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Price:</span>{" "}
                          {item.status === "Pending" &&
                          item.pendingChanges?.price ? (
                            <>
                              <span className="line-through text-gray-400">
                                {formatPrice(item.price)}
                              </span>{" "}
                              <span className="text-blue-600">
                                {formatPrice(item.pendingChanges.price)}
                              </span>
                            </>
                          ) : (
                            formatPrice(item.price)
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span> {item.type}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              item.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : item.status === "Borrowed"
                                ? "bg-purple-100 text-purple-800"
                                : item.status === "Sold"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.status}
                            {item.status === "Pending" &&
                              item.pendingChanges &&
                              " (Chờ duyệt thay đổi)"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Images</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {item.status === "Pending" &&
                        item.pendingChanges?.images &&
                        item.pendingChanges.images.length > 0 ? (
                          item.pendingChanges.images.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={img || erroImg}
                                alt={`${item.name} - ${idx + 1}`}
                                className="w-full h-24 object-cover rounded border border-blue-300"
                              />
                              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">
                                Mới
                              </div>
                            </div>
                          ))
                        ) : item.images && item.images.length > 0 ? (
                          item.images.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={img || erroImg}
                                alt={`${item.name} - ${idx + 1}`}
                                className="w-full h-24 object-cover rounded border border-gray-200"
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No images available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.type === "Sell" &&
                    item.status === "Sold" &&
                    item.purchaseDate && (
                      <div className="p-4">
                        <div className="flex items-start space-x-4">
                          {item.buyer?.imageUrl && (
                            <img
                              src={item.buyer.imageUrl}
                              alt={item.buyer.name || "Buyer"}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <p>
                              <strong>Purchase Date:</strong>{" "}
                              {new Date(item.purchaseDate).toLocaleDateString()}
                            </p>
                            <p>
                              <strong>Buyer:</strong>{" "}
                              {item.buyer?.name || "Unknown"}
                            </p>
                            {item.buyer?.emailAddresses &&
                              item.buyer.emailAddresses.length > 0 && (
                                <p>
                                  <strong>Email:</strong>{" "}
                                  {item.buyer.emailAddresses.join(", ")}
                                </p>
                              )}
                            {item.buyer?.phoneNumbers &&
                            item.buyer.phoneNumbers.length > 0 ? (
                              <p>
                                <strong>Phone:</strong>{" "}
                                {item.buyer.phoneNumbers.join(", ")}
                              </p>
                            ) : (
                              <p>
                                <strong>Phone:</strong> None
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  {item.type === "Borrow" &&
                    item.status === "Borrowed" &&
                    item.borrowingHistory && (
                      <div className="p-4">
                        {item.borrowingHistory.map((history, index) => (
                          <div
                            key={index}
                            className="mb-4 border-b pb-4 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-start space-x-4">
                              {history.borrower?.imageUrl && (
                                <img
                                  src={history.borrower.imageUrl}
                                  alt={history.borrower.name || "Borrower"}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div>
                                <p>
                                  <strong>Start Time:</strong>{" "}
                                  {new Date(
                                    history.startTime
                                  ).toLocaleDateString()}
                                </p>
                                <p>
                                  <strong>End Time:</strong>{" "}
                                  {new Date(
                                    history.endTime
                                  ).toLocaleDateString()}
                                </p>
                                <p>
                                  <strong>Total Price:</strong>{" "}
                                  {formatPrice(history.totalPrice)}
                                </p>
                                <p>
                                  <strong>Borrower:</strong>{" "}
                                  {history.borrower?.name || "Unknown"}
                                </p>
                                {history.borrower?.emailAddresses &&
                                  history.borrower.emailAddresses.length >
                                    0 && (
                                    <p>
                                      <strong>Email:</strong>{" "}
                                      {history.borrower.emailAddresses.join(
                                        ", "
                                      )}
                                    </p>
                                  )}
                                {history.borrower?.phoneNumbers &&
                                history.borrower.phoneNumbers.length > 0 ? (
                                  <p>
                                    <strong>Phone:</strong>{" "}
                                    {history.borrower.phoneNumbers.join(", ")}
                                  </p>
                                ) : (
                                  <p>
                                    <strong>Phone:</strong> None
                                  </p>
                                )}
                                {/* Confirm Return Button with Modal */}
                                <button
                                  onClick={() =>
                                    setConfirmModalVisible({
                                      visible: true,
                                      borrowId: history.borrowId,
                                    })
                                  }
                                  className="mt-2 bg-blue-500 text-white px-3 py-1.5 rounded-md shadow-md hover:bg-blue-600 transition duration-200 ease-in-out"
                                  disabled={
                                    history.status === "returned" ||
                                    history.status === "late"
                                  }
                                >
                                  Confirm Return
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </Collapse.Panel>
              </Collapse>
            </div>
          ))}
          {/* Thêm thông báo hướng dẫn */}
          <div className="bg-blue-50 border-blue-200 border p-4 rounded-lg mt-4 mb-2">
            <p className="text-blue-800 font-medium">Lưu ý:</p>
            <ul className="list-disc pl-5 text-sm text-blue-700">
              <li>
                Bạn có thể chỉnh sửa thông tin sản phẩm đang ở trạng thái có thể
                chỉnh sửa (hiển thị nút "Chỉnh sửa")
              </li>
              <li>
                Các sản phẩm đã bán, đang cho mượn, hoặc đang trong phiên đấu
                giá không thể chỉnh sửa
              </li>
              <li>
                Sản phẩm đang chờ phê duyệt cũng có thể chỉnh sửa, sau khi chỉnh
                sửa sẽ quay lại trạng thái chờ phê duyệt
              </li>
              <li>
                Mọi thay đổi sẽ cần được quản trị viên duyệt trước khi hiển thị
                công khai
              </li>
            </ul>
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination
              current={uploadedCurrentPage}
              total={uploadedItems.length}
              pageSize={pageSize}
              onChange={setUploadedCurrentPage}
            />
          </div>
          <ConfirmReturnModal
            visible={confirmModalVisible?.visible || false}
            onCancel={() => setConfirmModalVisible(null)}
            onSuccess={async () => {
              const token = await getToken();
              const updatedRes = await getUserUploadedItems(token);
              if (updatedRes.success) setUploadedItems(updatedRes.data);
            }}
            borrowId={confirmModalVisible?.borrowId}
            borrowRecords={uploadedItems.flatMap(
              (item) => item.borrowingHistory || []
            )}
          />

          {/* Add Edit Modal */}
          <Modal
            title="Edit Item"
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            footer={null}
            destroyOnClose
            width={700}
          >
            <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
              <Form.Item
                name="name"
                label="Item Name"
                rules={[{ required: true, message: "Please enter item name" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter item description" },
                ]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>

              <Form.Item
                name="categoryId"
                label="Category"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select
                  placeholder={currentCategoryName}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  loading={categories.length === 0}
                >
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <Select.Option key={category._id} value={category._id}>
                        {category.name}
                      </Select.Option>
                    ))
                  ) : (
                    <Select.Option value="" disabled>
                      Loading categories...
                    </Select.Option>
                  )}
                </Select>
                <div className="text-xs text-gray-500 mt-1">
                  Select the category that best describes your item. This helps
                  buyers find your item more easily.
                </div>
              </Form.Item>

              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please enter item price" }]}
              >
                <Input type="number" addonAfter="VND" />
              </Form.Item>

              <Form.Item label="Product Images">
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleChange}
                  beforeUpload={() => false} // Prevent auto upload
                  multiple
                >
                  {fileList.length >= 8 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
                <div className="text-gray-500 text-xs mt-1">
                  You can upload up to 8 images. Click on an image to preview
                  it.
                </div>
              </Form.Item>

              <Form.Item>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setEditModalVisible(false)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting || uploading}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading Images..." : "Submit for Review"}
                  </Button>
                  {/* Debug button */}
                  <Button
                    onClick={() => {
                      const formValues = editForm.getFieldsValue();
                      console.log("Current form values:", formValues);
                      console.log("Selected item:", selectedItem);
                      console.log("File list:", fileList);
                      message.info("Check console for debug info");
                    }}
                    className="ml-2"
                    type="dashed"
                  >
                    Debug
                  </Button>
                  {/* Test API button */}
                  <Button
                    onClick={async () => {
                      try {
                        const token = await getToken();
                        if (!token) {
                          message.error("No authentication token!");
                          return;
                        }

                        const itemId = selectedItem?.id || selectedItem?._id;
                        if (!itemId) {
                          message.error("No item ID found!");
                          return;
                        }

                        const testData = {
                          name: "Test API Edit",
                          description: "Testing the API only",
                          price: 10000,
                          categoryId:
                            selectedItem.categoryId?._id ||
                            selectedItem.categoryId,
                        };

                        console.log("Testing API with data:", testData);
                        console.log("Item ID:", itemId);
                        console.log("Token length:", token.length);

                        message.info("Sending test request to API...");

                        const response = await submitItemEditRequest(
                          itemId,
                          testData,
                          token
                        );

                        console.log("Test API response:", response);

                        if (response.success) {
                          message.success("Test API call successful!");
                        } else {
                          message.error(`Test failed: ${response.message}`);
                        }
                      } catch (error) {
                        console.error("Test API error:", error);
                        message.error(`Test error: ${error.message}`);
                      }
                    }}
                    className="ml-2"
                    type="default"
                    danger
                  >
                    Test API
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Modal>

          {/* Image preview modal */}
          <Modal
            open={previewOpen}
            title={previewTitle}
            footer={null}
            onCancel={handleCancel}
          >
            <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
          </Modal>
        </div>
      ),
    },
    {
      key: "buy",
      label: "Buy History",
      children: loading ? (
        <Spin />
      ) : error ? (
        <Paragraph type="danger">{error}</Paragraph>
      ) : buyRecords.length === 0 ? (
        <Paragraph>No buy records found.</Paragraph>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Image</th>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Category</th>
                  <th className="px-4 py-2 border">Price (VND)</th>
                  <th className="px-4 py-2 border">Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {paginateData(buyRecords, buyCurrentPage).map((record) => (
                  <tr key={record.buyId}>
                    <td className="px-4 py-2 border">
                      <img
                        src={record.item?.images[0] || erroImg}
                        alt={record.item?.name || "Item"}
                        className="w-12 h-12 object-cover"
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <Link
                        to={`/item/${record.item?._id}`}
                        style={{ color: "black" }}
                      >
                        {record.item?.name || "Unknown Item"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 border">
                      <Link
                        to={`/category/${record.item?.categoryId?._id}`}
                        style={{ color: "black" }}
                      >
                        {record.item?.categoryId?.name || "Unknown Category"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 border">
                      <Text className="text-green-600 font-bold">
                        {formatPrice(record.item?.price)}
                      </Text>
                    </td>
                    <td className="px-4 py-2 border">
                      {new Date(record.purchaseDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination
              current={buyCurrentPage}
              total={buyRecords.length}
              pageSize={pageSize}
              onChange={setBuyCurrentPage}
            />
          </div>
        </div>
      ),
    },
    {
      key: "borrow",
      label: "Borrow History",
      children: loading ? (
        <Spin />
      ) : error ? (
        <Paragraph type="danger">{error}</Paragraph>
      ) : borrowRecords.length === 0 ? (
        <Paragraph>No borrow records found.</Paragraph>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Image</th>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Category</th>
                  <th className="px-4 py-2 border">Price (VND)</th>
                  <th className="px-4 py-2 border">Rate Type</th>
                  <th className="px-4 py-2 border">Start Time</th>
                  <th className="px-4 py-2 border">End Time</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginateData(borrowRecords, borrowCurrentPage).map(
                  (record) => (
                    <tr key={record.borrowId}>
                      <td className="px-4 py-2 border">
                        <img
                          src={record.item?.images[0] || erroImg}
                          alt={record.item?.name || "Item"}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                      <td className="px-4 py-2 border">
                        <Link
                          to={`/item/${record.item?._id}`}
                          style={{ color: "black" }}
                        >
                          {record.item?.name || "Unknown Item"}
                        </Link>
                      </td>
                      <td className="px-4 py-2 border">
                        <Link
                          to={`/category/${record.item?.categoryId?._id}`}
                          style={{ color: "black" }}
                        >
                          {record.item?.categoryId?.name || "Unknown Category"}
                        </Link>
                      </td>
                      <td className="px-4 py-2 border">
                        <Text className="text-green-600 font-bold">
                          {formatPrice(record.totalPrice)}
                        </Text>
                      </td>
                      <td className="px-4 py-2 border">Day</td>
                      <td className="px-4 py-2 border">
                        {new Date(record.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 border">
                        {new Date(record.endTime).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 border">{record.status}</td>
                      <td className="px-4 py-2 border">
                        <div className="flex space-x-2 justify-center items-center w-full">
                          <button
                            onClick={() => {
                              setSelectedBorrowId(record.borrowId);
                              setExtendModalVisible(true);
                            }}
                            className={`bg-yellow-500 text-white px-3 py-1.5 rounded-md shadow-md hover:bg-blue-600 transition duration-200 ease-in-out transform hover:-translate-y-0.5 ${
                              record.status !== "borrowed"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={record.status !== "borrowed"}
                          >
                            Extend
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBorrowId(record.borrowId);
                              setReturnModalVisible(true);
                            }}
                            className={`bg-green-700 text-white px-3 py-1.5 rounded-md shadow-md hover:bg-green-600 transition duration-200 ease-in-out transform hover:-translate-y-0.5 ${
                              record.status === "returned"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={record.status === "returned"}
                          >
                            Request Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination
              current={borrowCurrentPage}
              total={borrowRecords.length}
              pageSize={pageSize}
              onChange={setBorrowCurrentPage}
            />
          </div>
          <ExtendBorrowModal
            visible={extendModalVisible}
            onCancel={() => setExtendModalVisible(false)}
            borrowId={selectedBorrowId}
            onSuccess={handleExtendSuccess}
            borrowRecords={borrowRecords}
          />
          <RequestReturnModal
            visible={returnModalVisible}
            onCancel={() => setReturnModalVisible(false)}
            borrowId={selectedBorrowId}
            onSuccess={handleReturnSuccess}
            borrowRecords={borrowRecords}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <Content className="flex-1 overflow-auto">
        <Tabs
          tabPosition="left"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          style={{ width: "100%", height: "100%" }}
        />
      </Content>
    </Layout>
  );
};

export default TransactionHistoryPage;
