import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { customFetch } from "@/utils/customAxios";
import { useLoaderData } from "react-router-dom";

// Sample data (replace with actual API data)

export const auctionAdminDetailLoader = async ({ params }) => {
  try {
    const { id } = params;

    const response = await customFetch("/admin/auction/" + id);

    const { auction, listBid, userTakeIn } = response.data.data;

    return { auction, listBid, userTakeIn };
  } catch (error) {
    console.log(error);
    toast.error("Something wrong at auction detail");
  }
};

export function AuctionAdminDetail() {
  const { auction, listBid, userTakeIn } = useLoaderData();
  const timeRemaining = formatDistanceToNow(new Date(auction.endTime), {
    addSuffix: true,
  });

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gray-50 dark:bg-zinc-950 min-h-screen">
      {/* Auction Details Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Auction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={auction.image}
              alt={auction.itemName}
              className="w-full md:w-48 h-48 object-cover rounded-lg"
            />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {auction.itemName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {auction.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Item ID:
                  </span>{" "}
                  {auction.itemId}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Status:
                  </span>{" "}
                  <Badge
                    variant={
                      auction.status === "Approved" ? "default" : "secondary"
                    }
                  >
                    {auction.status}
                  </Badge>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Start Price:
                  </span>{" "}
                  ${auction.startPrice}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Current Price:
                  </span>{" "}
                  ${auction.currentPrice}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Start Time:
                  </span>{" "}
                  {format(new Date(auction.startTime), "PPP p")}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    End Time:
                  </span>{" "}
                  {format(new Date(auction.endTime), "PPP p")} ({timeRemaining})
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Settled:
                  </span>{" "}
                  {auction.settled ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={auction.owner.image}
                alt={`${auction.owner.firstName} ${auction.owner.lastName}`}
              />
              <AvatarFallback>
                {auction.owner.firstName[0]}
                {auction.owner.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {auction.owner.firstName} {auction.owner.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {auction.owner.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auction Summary Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Auction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Bids
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {listBid.length}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Highest Bid
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${Math.max(...listBid.map((bid) => bid.price))}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Participants
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {userTakeIn.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auction Bids Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Bid Price ($)
                </TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listBid.map((bid, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {bid.price}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {format(new Date(bid.time), "PPP p")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Participating Users Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Participating Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {userTakeIn.map((user) => (
              <div
                key={user.id}
                className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm"
              >
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage
                    src={user.image}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
