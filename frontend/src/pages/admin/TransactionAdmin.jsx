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
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { customFetch } from "@/utils/customAxios";
import { useLoaderData } from "react-router-dom";

export const transactionAdminDashboardLoader = async () => {
  try {
    const response = (await customFetch.get("/admin/transaction")).data;

    const transactionData = response.data;
    return {
      transactionData,
    };
  } catch (error) {
    console.log(error);
    toast.error("something wrong at transaction");
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

export function TransactionAdminDashboard() {
  // Calculate statistics
  const { transactionData } = useLoaderData();
  const totalTransactions = transactionData.length;
  const totalAmount = transactionData.reduce((sum, t) => sum + t.amount, 0);
  const averageAmount = totalTransactions
    ? (totalAmount / totalTransactions).toFixed(2)
    : 0;

  // Format currency to VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 min-h-screen">
      {/* Summary Statistics Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="mb-8"
      >
        <Card className="shadow-xl border-0 bg-white dark:bg-zinc-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Transaction Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.03 }}
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Transactions
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {totalTransactions}
                </p>
              </motion.div>
              <motion.div
                className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.03 }}
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Amount
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalAmount)}
                </p>
              </motion.div>
              <motion.div
                className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.03 }}
              >
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Average Transaction
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(averageAmount)}
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction List Section */}
      <motion.div initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="shadow-xl border-0 bg-white dark:bg-zinc-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Transaction List
            </CardTitle>
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
                      Transaction ID
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Name
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Email
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Amount
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Card Brand
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Date
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionData.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      className="hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {transaction.id}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {transaction.name}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {transaction.email}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 capitalize">
                        {transaction.card_brand}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {transaction.created}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "succeeded"
                              ? "default"
                              : "secondary"
                          }
                          className="hover:bg-primary/80 transition-colors"
                        >
                          {transaction.status}
                        </Badge>
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
