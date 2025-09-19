import React from "react";
import { Clock, CheckCircle, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { customFetch } from "@/utils/customAxios";
import { useLoaderData, useNavigate } from "react-router-dom";

export const auctionAdminLoader = async () => {
  try {
    const auctionResponse = await customFetch.get("/admin/auction");

    const auctionData = auctionResponse.data;
    return {
      auctionData,
    };
  } catch (error) {
    toast.error("error at auction admin");
  }
};

const AuctionAdmin = () => {
  const { auctionData } = useLoaderData();
  const navigate = useNavigate();

  const data = auctionData;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAuctionStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return {
        status: "Upcoming",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "⏳",
      };
    } else if (now >= start && now <= end) {
      return {
        status: "Live",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "🔴",
      };
    } else {
      return {
        status: "Ended",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: "✅",
      };
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Auction Listings
          </h1>
          <p className="text-gray-600">Manage and track auction sessions</p>
        </div>

        {/* Auction Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((auction) => {
            const startDateTime = formatDateTime(auction.startTime);
            const endDateTime = formatDateTime(auction.endTime);
            const auctionStatus = getAuctionStatus(
              auction.startTime,
              auction.endTime
            );

            return (
              <div
                key={auction.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Image */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={auction.item.images[0]}
                    alt={auction.item.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5QzEwLjM0MzEgOSA5IDEwLjM0MzEgOSAxMkM5IDEzLjY1NjkgMTAuMzQzMSAxNSAxMiAxNUM1IAEzLjY1NjkgMTUgMTIgMTUgMTJDMTUgMTAuMzQzMSAxMy42NTY5IDkgMTIgOVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTUgNUg5TDEwLjUgN0gxOUMyMC4xIDcgMjEgNy45IDIxIDlWMThDMjEgMTkuMSAyMC4xIDIwIDE5IDIwSDVDMy45IDIwIDMgMTkuMSAzIDE4VjdDMyA1LjkgMy45IDUgNSA1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Item Name & Status */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {auction.item.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        auction.status
                      )}`}
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      {auction.status}
                    </span>
                  </div>

                  {/* Auction Status */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${auctionStatus.color}`}
                    >
                      <span className="mr-2">{auctionStatus.icon}</span>
                      {auctionStatus.status}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Tag className="w-4 h-4 mr-1" />
                      Starting Price
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(auction.startPrice)}
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-green-500" />
                      <div>
                        <span className="font-medium">Start:</span>
                        <span className="ml-1">
                          {startDateTime.date} at {startDateTime.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-red-500" />
                      <div>
                        <span className="font-medium">End:</span>
                        <span className="ml-1">
                          {endDateTime.date} at {endDateTime.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ID */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      ID: {auction.id}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 pb-4">
                  <div className="flex gap-2">
                    <button
                      className="cursor-pointer flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        navigate(`/admin/auction/detail/${auction.id}`);
                      }}
                    >
                      View Details
                    </button>
                    {/* <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
                      Edit
                    </button> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">
              Total Auctions
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {data.data.length}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">Approved</div>
            <div className="text-2xl font-bold text-green-900">
              {data.data.filter((item) => item.status === "Approved").length}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">
              Total Starting Value
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatPrice(
                data.data.reduce((sum, item) => sum + item.startPrice, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionAdmin;
