import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import ImgCrop from "antd-img-crop";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { uploadImage } from "@/utils/uploadCloudinary";
import { customFetch } from "@/utils/customAxios";
import { useLoaderData } from "react-router-dom";

export const categoryAdminDashboardLoader = async () => {
  try {
    const response = (await customFetch("/admin/category")).data.data;

    return {
      initialCategories: response,
    };
  } catch (error) {
    toast.error("something wrong at CategoryAdminDashboard");
    console.log(error);
  }
};

// Animation variants for Framer Motion
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const tableVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export function CategoryAdminDashboard() {
  const { initialCategories } = useLoaderData();
  const [categories, setCategories] = useState(initialCategories);
  const [fileLists, setFileLists] = useState({}); // Per-category fileList state
  const [newCategory, setNewCategory] = useState({ name: "", image: "" });
  const [newCategoryFileList, setNewCategoryFileList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle name updates for existing categories
  const handleUpdate = (id, field, value) => {
    setCategories(
      categories.map((category) =>
        category._id === id ? { ...category, [field]: value } : category
      )
    );
  };

  // Handle image upload for existing categories
  const handleImageChange = (id, { fileList: newFileList }) => {
    const isLt5M = newFileList.every(
      (file) => !file.originFileObj || file.originFileObj.size / 1024 / 1024 < 5
    );

    if (!isLt5M) {
      message.error("Image must be less than 5MB!");
      return;
    }

    setFileLists({ ...fileLists, [id]: newFileList });

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const reader = new FileReader();
      reader.onload = () => {
        setCategories(
          categories.map((category) =>
            category._id === id
              ? { ...category, image: reader.result }
              : category
          )
        );
        message.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(newFileList[0].originFileObj);
    } else if (newFileList.length === 0) {
      // Revert to original image if upload is cleared
      setCategories(
        categories.map((category) =>
          category._id === id
            ? {
                ...category,
                image: initialCategories.find((c) => c._id === id).image,
              }
            : category
        )
      );
      message.info("Image reset to original.");
    }
  };

  // Handle save for existing categories (mock API call)
  const handleSave = async (id) => {
    setIsSubmitting(true);
    const category = categories.find((c) => c._id === id);

    const { _id, name, image } = category;

    let url = image;
    if (url.startsWith("data:image/")) {
      // [START] upload image to cloud
      url = await uploadImage(image);
      // [END] upload image to cloud
    }

    const updateCategoryResponse = await customFetch.patch(
      `/admin/category/update/${_id}`,
      {
        name,
        image: url,
      }
    );

    if (updateCategoryResponse.status == 401) {
      toast.error("Update category failed");
      return;
    }

    toast.success("Update category success");
    setIsSubmitting(false);
    // Replace with actual API call to save changes
  };

  // Handle new category input changes
  const handleNewCategoryChange = (field, value) => {
    setNewCategory({ ...newCategory, [field]: value });
  };

  // Handle image upload for new category
  const handleNewCategoryImageChange = ({ fileList: newFileList }) => {
    const isLt5M = newFileList.every(
      (file) => !file.originFileObj || file.originFileObj.size / 1024 / 1024 < 5
    );

    if (!isLt5M) {
      message.error("Image must be less than 5MB!");
      return;
    }

    setNewCategoryFileList(newFileList);

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewCategory({ ...newCategory, image: reader.result });
        message.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(newFileList[0].originFileObj);
    } else if (newFileList.length === 0) {
      setNewCategory({ ...newCategory, image: "" });
      message.info("Image removed.");
    }
  };

  // Handle creating a new category
  const handleCreateCategory = async () => {
    setIsSubmitting(true);
    if (!newCategory.name.trim()) {
      toast.error("Category name is required!");
      return;
    }
    if (!newCategory.image) {
      toast.error("Category image is required!");
      return;
    }

    // [START] check name category duplicate
    const response = await customFetch(
      `/admin/category/check?name=${newCategory.name}`
    );

    const isExist = response.data.data.exists;
    if (isExist) {
      toast.error("Category name is already exist choose another name!");
      return;
    }

    // [END] check name category duplicate

    const url = await uploadImage(newCategory.image);

    const category = (
      await customFetch.post(`/admin/category/create`, {
        name: newCategory.name,
        image: url,
      })
    ).data.data;

    setCategories([
      ...categories,
      { _id: category._id, name: category.name, image: category.image },
    ]);
    setNewCategory({ name: "", image: "" });
    setNewCategoryFileList([]);
    setIsModalOpen(false);
    toast.success("create new category success");
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="max-w-5xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-white dark:bg-zinc-800 rounded-2xl">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Category Management
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create New Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md  bg-white  dark:bg-zinc-800 rounded-2xl">
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  className="px-4"
                >
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Create New Category
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category Name
                      </label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) =>
                          handleNewCategoryChange("name", e.target.value)
                        }
                        placeholder="Enter category name"
                        className="mt-1 text-gray-900 dark:text-gray-100 bg-transparent border-gray-300 dark:border-zinc-600"
                      />
                    </div>

                    <div className="flex flex-col justify-center items-center w-full content-center p-4 gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Image
                      </label>
                      <ImgCrop rotationSlider>
                        <Upload
                          listType="picture"
                          fileList={newCategoryFileList}
                          onChange={handleNewCategoryImageChange}
                          beforeUpload={() => false}
                          maxCount={1}
                          className="w-full max-w-sm"
                        >
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-700"
                          >
                            <UploadOutlined className="mr-2" />
                            Upload Image
                          </Button>
                        </Upload>
                      </ImgCrop>

                      {newCategory.image && (
                        <img
                          src={newCategory.image}
                          alt="New category preview"
                          className="w-24 h-24 object-cover rounded-lg shadow-sm mt-2 max-w-full"
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewCategory({ name: "", image: "" });
                          setNewCategoryFileList([]);
                          setIsModalOpen(false);
                        }}
                        className="border-gray-300 dark:border-zinc-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateCategory}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <svg
                            className="animate-spin ml-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={tableVariants}
              initial="hidden"
              animate="visible"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Category Name
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Image
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <motion.tr
                      key={category._id}
                      className="hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TableCell>
                        <Input
                          value={category.name}
                          onChange={(e) =>
                            handleUpdate(category._id, "name", e.target.value)
                          }
                          className="w-full text-gray-900 dark:text-gray-100 bg-transparent border-gray-300 dark:border-zinc-600"
                          placeholder="Category Name"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-2 justify-center max-w-24 overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-24 h-24 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-300"
                          />
                          <ImgCrop rotationSlider>
                            <Upload
                              listType="picture"
                              fileList={
                                fileLists[category._id]?.length > 0
                                  ? fileLists[category._id]
                                  : [
                                      {
                                        uid: category._id,
                                        url: category.image,
                                        name: category.name,
                                        status: "done",
                                      },
                                    ]
                              }
                              onChange={(info) =>
                                handleImageChange(category._id, info)
                              }
                              beforeUpload={() => false} // Prevent auto-upload
                              maxCount={1} // Allow only one image
                              className="w-full max-w-xs flex items-center gap-2"
                            >
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-700 cursor-pointer"
                              >
                                <UploadOutlined className="mr-2" />
                                Upload
                              </Button>
                            </Upload>
                          </ImgCrop>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSave(category._id)}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
