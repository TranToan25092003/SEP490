import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { customFetch } from "@/utils/customAxios";
import { useLoaderData } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

export const itemDetailDashboardLoader = async ({ params }) => {
  try {
    const { id } = params;

    const response = (await customFetch(`/admin/items/${id}/detail`)).data;

    const itemData = response.data;

    return {
      itemData,
    };
  } catch (error) {
    console.error("Error loading item details:", error);
    toast.error("Error at item detail dashboard");
    return {
      itemData: null,
    };
  }
};

// Animation variants for Framer Motion
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const textVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.2 } },
};

export function ItemDetailDashboard() {
  const { itemData } = useLoaderData();
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    _id,
    name,
    description,
    price,
    images,
    type,
    category,
    status,
    owner,
    pendingChanges,
  } = itemData;

  const handleApproveEdit = async () => {
    setIsProcessing(true);
    try {
      const response = await customFetch.post(
        `/admin/items/${_id}/approve-edit`,
        {
          adminId: localStorage.getItem("adminId") || "admin", // Replace with actual admin ID
        }
      );

      if (response.data.success) {
        toast.success("Edit request approved successfully");
        // Refresh the page to show the updated data
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to approve edit request");
      }
    } catch (error) {
      console.error("Error approving edit request:", error);
      toast.error("An error occurred while approving the edit request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectEdit = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await customFetch.post(
        `/admin/items/${_id}/reject-edit`,
        {
          adminId: localStorage.getItem("adminId") || "admin", // Replace with actual admin ID
          rejectReason: rejectReason,
        }
      );

      if (response.data.success) {
        toast.success("Edit request rejected successfully");
        setRejectReason("");
        // Refresh the page to show the updated data
        window.location.reload();
      } else {
        toast.error(response.data.message || "Failed to reject edit request");
      }
    } catch (error) {
      console.error("Error rejecting edit request:", error);
      toast.error("An error occurred while rejecting the edit request");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="max-w-4xl mx-auto"
      >
        <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-zinc-800 rounded-2xl">
          <CardHeader className="bg-primary/10 dark:bg-primary/20">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Item Image and Core Details */}
            <div className="flex flex-col md:flex-row gap-6">
              <motion.img
                src={images[0]}
                alt={name}
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                className="w-full md:w-80 h-64 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
              />
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Item ID:
                    </span>{" "}
                    {_id}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Type:
                    </span>{" "}
                    {type}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Price:
                    </span>{" "}
                    ${price}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>{" "}
                    <Badge
                      variant={status === "Available" ? "default" : "secondary"}
                      className="hover:bg-primary/80 transition-colors"
                    >
                      {status}
                    </Badge>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Category:
                    </span>{" "}
                    {category.name}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Owner Information */}
            <motion.div
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="border-t pt-4 dark:border-zinc-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Owner Information
              </h3>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                  <AvatarImage
                    src={owner.image}
                    alt={`${owner.firstName} ${owner.lastName}`}
                  />
                  <AvatarFallback>
                    {owner.firstName[0]}
                    {owner.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {owner.firstName} {owner.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {owner.email}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Edit Request Section */}
            {pendingChanges && pendingChanges.status === "pending" && (
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="border-t pt-4 dark:border-zinc-700 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Pending Edit Request
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Values
                    </h4>
                    <div className="space-y-2 mt-2">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span> {name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Price:</span> ${price}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Description:</span>{" "}
                        {description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Requested Changes
                    </h4>
                    <div className="space-y-2 mt-2 text-sm">
                      <p
                        className={`${
                          pendingChanges.name !== name
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }`}
                      >
                        <span className="font-medium">Name:</span>{" "}
                        {pendingChanges.name}
                      </p>
                      <p
                        className={`${
                          pendingChanges.price !== price
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }`}
                      >
                        <span className="font-medium">Price:</span> $
                        {pendingChanges.price}
                      </p>
                      <p
                        className={`${
                          pendingChanges.description !== description
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }`}
                      >
                        <span className="font-medium">Description:</span>{" "}
                        {pendingChanges.description}
                      </p>
                      <p>
                        <span className="font-medium">Requested on:</span>{" "}
                        {new Date(pendingChanges.requestDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    onClick={handleApproveEdit}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Changes
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isProcessing}>
                        Reject Changes
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Edit Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please provide a reason for rejecting this edit
                          request.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Textarea
                        placeholder="Enter reason for rejection"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="mt-2"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRejectEdit}>
                          Confirm Rejection
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
