import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Upload,
  Button,
  Modal,
  DatePicker,
  InputNumber,
  Radio,
  message,
  Divider,
  Select,
  Spin,
  notification,
  Card,
  Steps,
  Typography,
  Space,
} from "antd";
import {
  UploadOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ShoppingOutlined,
  FireOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ImgCrop from "antd-img-crop";
import { getAllCategoriesWithStats } from "@/API/duc.api/category.api";
import { getAllTypes } from "@/API/duc.api/type.api";
import { getAllStatuses } from "@/API/duc.api/status.api";
import { createItem } from "@/API/duc.api/item.api";
import { createAuction } from "@/API/huynt.api/auction.api";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "sonner";
import { Switch } from "antd";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const AI_WEBHOOK_URL = import.meta.env.VITE_AI_WEBHOOK;

const CreatePost = () => {
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const navigate = useNavigate();
  const { userId, isSignedIn } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [postType, setPostType] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [firstStepData, setFirstStepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowNotification, setShouldShowNotification] = useState(false);

  useEffect(() => {
    if (shouldShowNotification) {
      api.warning({
        message: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để có thể đăng bán sản phẩm!",
        icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
        placement: "bottomRight",
        duration: 4,
      });
      setTimeout(() => {
        navigate("/");
      }, 100);
      setShouldShowNotification(false);
    }
  }, [shouldShowNotification, api, navigate]);

  useEffect(() => {
    if (!isSignedIn) {
      setShouldShowNotification(true);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, typesRes, statusesRes] = await Promise.all([
          getAllCategoriesWithStats(),
          getAllTypes(),
          getAllStatuses(),
        ]);
        setCategories(categoriesRes.data || []);
        setTypes(typesRes || []);
        setStatuses(statusesRes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSignedIn]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "huynt7104");
    formData.append("cloud_name", "db4tuojnn");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/db4tuojnn/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setPostType(type.name.toLowerCase());
    setCurrentStep(2);
    form.resetFields();
  };

  const handleFirstStepSubmit = (values) => {
    if (fileList.length === 0) {
      message.error("Please upload at least 1 image");
      return;
    }
    console.log("Second step submitted with values:", values);
    setFirstStepData(values);
    setIsModalVisible(true);
    modalForm.resetFields();
  };

  const handleModalSubmit = async (values) => {
    try {
      setUploading(true);

      if (!firstStepData) {
        throw new Error("Second step data is missing");
      }

      if (!userId) {
        setShouldShowNotification(true);
        return;
      }

      // Upload all images to Cloudinary
      const uploadPromises = fileList.map((file) =>
        uploadImage(file.originFileObj)
      );
      const imageUrls = await Promise.all(uploadPromises);

      // Find pending status (changed from approved to pending)

      const pendingStatus = statuses.find(
        (status) => status.name.toLowerCase() === "pending"
      );
      if (!pendingStatus) {
        throw new Error("Pending status not found");
      }

      console.log("Second step data:", firstStepData);
      console.log("Third step (modal) values:", values);
      console.log("User ID:", userId);

      // Determine ratePrice based on post type
      let ratePrice = "no"; // Default for auction and sell
      if (postType === "borrow") {
        ratePrice = firstStepData.ratePrice;
      }

      // First create the item
      const itemData = {
        name: firstStepData.name,
        description: firstStepData.description,
        price: Number(values.price),
        images: imageUrls,
        ratePrice: ratePrice,
        owner: userId,
        typeId: selectedType._id,
        categoryId: firstStepData.categoryId,
        statusId: pendingStatus._id,
      };

      // Validate required fields before sending
      const requiredFields = [
        "name",
        "description",
        "price",
        "owner",
        "typeId",
        "categoryId",
        "statusId",
      ];

      const missingFields = requiredFields.filter((field) => !itemData[field]);
      if (missingFields.length > 0) {
        console.error("Missing fields:", missingFields);
        console.error("Item data:", itemData);
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      console.log("Sending item data:", itemData);

      // =====================================
      // AI checking

      if (AI_WEBHOOK_URL) {
        const toastLoading = toast.loading(
          "checking by AI please waiting 😊😊😊"
        );

        try {
          const checkingAiResponse = (
            await axios.post(
              AI_WEBHOOK_URL,

              {
                name: itemData.name,
                description: itemData.description,
                image: itemData.images[0],
              }
            )
          ).data;

          const { isAccept, rejectReason } = checkingAiResponse;

          if (!isAccept) {
            toast.error(
              `Hmm Your item is: ${rejectReason} need to review to be available😕😕😕`,
              {
                id: toastLoading,
              }
            );
          } else {
            toast.success("Pass AI checking", {
              id: toastLoading,
            });

            const approvedStatus = statuses.find(
              (status) => status.name.toLowerCase() === "approved"
            );
            if (!approvedStatus) {
              throw new Error("Pending status not found");
            }

            itemData.statusId = approvedStatus._id;
          }
        } catch (err) {
          console.error("AI checking error:", err);
          toast.error("Something wrong with AI please try later 😅😅😅", {
            id: toastLoading,
          });
        }
      }

      console.log(itemData);
      // =====================================

      const itemRes = await createItem(itemData);
      console.log("Item creation response:", itemRes);

      // Based on post type, create additional records
      if (postType === "auction") {
        const auctionData = {
          startTime: values.auctionStartTime.toISOString(),
          endTime: values.auctionEndTime.toISOString(),
          startPrice: Number(values.price),
          currentPrice: Number(values.price),
          itemId: itemRes.data._id,
          statusId: pendingStatus._id,
          minBidIncrement: values.minBidIncrement || 0, // Add minimum bid increment
        };
        console.log("Creating auction with data:", auctionData);
        await createAuction(auctionData);
      }

      message.success("Post created successfully!");
      navigate("/", { state: { created: true } });
    } catch (error) {
      console.error("Error creating post:", error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create post"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = ({ fileList: newFileList }) => {
    const isLt5M = newFileList.every(
      (file) => !file.originFileObj || file.originFileObj.size / 1024 / 1024 < 5
    );

    if (!isLt5M) {
      message.error("Each image must be less than 5MB!");
      return;
    }

    setFileList(newFileList);
  };

  const getTypeIcon = (typeName) => {
    const name = typeName.toLowerCase();
    if (name === "auction") return <FireOutlined />;
    if (name === "sell") return <ShoppingOutlined />;
    if (name === "borrow") return <SwapOutlined />;
    return <PlusOutlined />;
  };

  const getTypeDescription = (typeName) => {
    const name = typeName.toLowerCase();
    if (name === "auction") return "Create an auction for your item";
    if (name === "sell") return "Sell your item directly";
    if (name === "borrow") return "Rent out your item";
    return "Choose how to list your item";
  };

  const renderPriceModal = () => {
    const isAuction = postType === "auction";
    const isBorrow = postType === "borrow";

    return (
      <Modal
        title={
          <div className="text-center">
            <Title level={4} className="mb-0">
              Set {isAuction ? "Auction" : isBorrow ? "Borrow" : "Sale"} Price
            </Title>
            <Text type="secondary">
              {isAuction
                ? "Set starting price and auction duration"
                : isBorrow
                ? "Set your rental price"
                : "Set your selling price"}
            </Text>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <Form form={modalForm} onFinish={handleModalSubmit} layout="vertical">
          <Form.Item
            name="price"
            label={isAuction ? "Starting Price" : "Price"}
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              addonAfter="VND"
              size="large"
              placeholder="Enter price"
            />
          </Form.Item>

          {isAuction && (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Form.Item
                name="minBidIncrement"
                label="Minimum Bid Increment"
                tooltip="The minimum amount a new bid must be higher than the current bid"
                rules={[
                  {
                    type: "number",
                    min: 0,
                    message: "Minimum bid increment cannot be negative",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VND"
                  size="large"
                  placeholder="Enter minimum bid increment (optional)"
                />
              </Form.Item>
              <Form.Item
                name="auctionStartTime"
                label="Start Time"
                rules={[
                  {
                    required: true,
                    message: "Please select start time",
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();

                      const now = new Date();
                      const fiveMinutesFromNow = new Date(
                        now.getTime() + 5 * 60 * 1000
                      );

                      if (value.isBefore(fiveMinutesFromNow)) {
                        return Promise.reject(
                          new Error(
                            "Start time must be at least 5 minutes from now"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  size="large"
                  placeholder="Select start time"
                />
              </Form.Item>
              <Form.Item
                name="auctionEndTime"
                label="End Time"
                rules={[
                  {
                    required: true,
                    message: "Please select end time",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startTime = getFieldValue("auctionStartTime");
                      if (!value || !startTime) {
                        return Promise.resolve();
                      }
                      if (value.isBefore(startTime)) {
                        return Promise.reject(
                          new Error("End time must be after start time")
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  size="large"
                  placeholder="Select end time"
                />
              </Form.Item>
            </Space>
          )}

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={uploading}
              size="large"
            >
              Complete
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 ">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">Loading...</Text>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Choose Type",
      description: "Select how to list your item",
    },
    {
      title: "Item Details",
      description: "Add product information",
    },
    {
      title: "Set Price",
      description: "Configure pricing",
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="min-h-screen bg-gradient-to-br ">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <Title level={2} className="mb-2">
              Create New Post
            </Title>
            <Text type="secondary" className="text-lg">
              Share your items with the community
            </Text>

            {/* START Toggle AI button */}
            <div className=" flex items-center justify-center">
              <div className="relative p-1.5 animated-border rounded-xl">
                <div className="p-4 rounded-lg flex gap-2 items-center">
                  <Text className="text-white ">
                    Sản phẩm của bạn sẽ được kiểm tra bằng AI 🤖🤖🤖
                  </Text>
                </div>
              </div>
              <style jsx>{`
                @keyframes gradient {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
                .animated-border {
                  background: linear-gradient(
                    45deg,
                    #8b5cf6,
                    #ec4899,
                    #3b82f6,
                    #22d3ee
                  );
                  background-size: 400%;
                  animation: gradient 15s ease infinite;
                }
              `}</style>
            </div>

            {/* END Toggle AI button */}
          </div>

          {/* Progress Steps */}
          <Card className="mb-8 shadow-sm">
            <Steps current={currentStep - 1} items={steps} className="mb-6" />
          </Card>

          {/* Step 1: Choose Type */}
          {currentStep === 1 && (
            <Card className="shadow-lg border-0">
              <div className="text-center mb-8">
                <Title level={3} className="mb-2">
                  How would you like to list your item?
                </Title>
                <Text type="secondary">
                  Choose the best option for your needs
                </Text>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {types.map((type) => (
                  <Card
                    key={type._id}
                    hoverable
                    className="text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-blue-400"
                    onClick={() => handleTypeSelect(type)}
                    bodyStyle={{ padding: "2rem 1rem" }}
                  >
                    <div className="text-4xl mb-4 text-blue-500">
                      {getTypeIcon(type.name)}
                    </div>
                    <Title level={4} className="mb-2">
                      {type.name}
                    </Title>
                    <Text type="secondary" className="text-sm">
                      {getTypeDescription(type.name)}
                    </Text>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Step 2: Item Details */}
          {currentStep === 2 && (
            <Card className="shadow-lg border-0">
              <div className="text-center mb-8">
                <Title level={3} className="mb-2">
                  Tell us about your item
                </Title>
                <Text type="secondary">
                  Provide detailed information to attract buyers
                </Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleFirstStepSubmit}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Form.Item
                      name="name"
                      label={<Text strong>Title</Text>}
                      rules={[
                        { required: true, message: "Please enter title" },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter product title"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    <Form.Item
                      name="categoryId"
                      label={<Text strong>Category</Text>}
                      rules={[
                        { required: true, message: "Please select category" },
                      ]}
                    >
                      <Select
                        size="large"
                        placeholder="Select category"
                        className="rounded-lg"
                      >
                        {categories.map((category) => (
                          <Option key={category._id} value={category._id}>
                            {category.title}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Only show ratePrice for borrow type */}
                    {postType === "borrow" && (
                      <Form.Item
                        name="ratePrice"
                        label={<Text strong>Rate Price</Text>}
                        rules={[
                          {
                            required: true,
                            message: "Please select rate price",
                          },
                        ]}
                      >
                        <Radio.Group
                          size="large"
                          style={{ display: "flex", gap: 16 }}
                        >
                          <Radio.Button
                            value="hour"
                            style={{
                              background: "#fff",
                              borderRadius: 8,
                              border: "1px solid #d9d9d9",
                              minWidth: 100,
                              textAlign: "center",
                              boxShadow: "none",
                            }}
                          >
                            Per Hour
                          </Radio.Button>
                          <Radio.Button
                            value="day"
                            style={{
                              background: "#fff",
                              borderRadius: 8,
                              border: "1px solid #d9d9d9",
                              minWidth: 100,
                              textAlign: "center",
                              boxShadow: "none",
                            }}
                          >
                            Per Day
                          </Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                    )}
                  </div>

                  <div>
                    <Form.Item
                      name="description"
                      label={<Text strong>Description</Text>}
                      rules={[
                        { required: true, message: "Please enter description" },
                      ]}
                    >
                      <TextArea
                        rows={8}
                        placeholder="Detailed description of the product. Line breaks and formatting will be preserved when displayed."
                        className="rounded-lg"
                      />
                    </Form.Item>
                    <div className="text-xs text-gray-500 mt-1">
                      Formatting tips: Press Enter for a new line. Your text
                      formatting will be preserved when displayed.
                    </div>
                  </div>
                </div>

                <Divider>
                  <Text strong>Product Images</Text>
                </Divider>

                <div className="text-center mb-4">
                  <Text type="secondary">
                    First image will be the cover photo (Maximum 10 images, each
                    less than 5MB)
                  </Text>
                </div>

                <div className="flex justify-center">
                  <ImgCrop rotationSlider>
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      onChange={handleImageChange}
                      beforeUpload={() => false}
                      multiple
                      maxCount={10}
                      className="w-full max-w-2xl"
                    >
                      {fileList.length < 10 && (
                        <div className="flex flex-col items-center justify-center h-24">
                          <UploadOutlined className="text-2xl text-blue-500 mb-2" />
                          <div className="text-sm text-gray-600">Upload</div>
                        </div>
                      )}
                    </Upload>
                  </ImgCrop>
                </div>

                <Form.Item className="mt-8 text-center">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="px-8 h-12 text-lg rounded-lg"
                  >
                    Continue to Pricing
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}

          {renderPriceModal()}
        </div>
      </div>
    </>
  );
};

export default CreatePost;
