import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { PaginationDemo } from "@/components/global/PaginationComp";
import {
  useLoaderData,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { customFetch } from "@/utils/customAxios";

import SheetComponent from "@/components/item/SheetComponent";
import { PaginationAdmin } from "@/components/global/AdminPagination";
export const itemsAdminLoader = async ({ request, params }) => {
  try {
    const url = new URL(request.url);

    // const fullUrl = url.toString();

    const page = url.searchParams.get("page") ?? 1;
    const status = url.searchParams.get("status") ?? "";

    const query = `?page=${parseInt(page)}&status=${status}`;

    const rawItemsData = await customFetch("/admin/items" + query);

    const { pagination, data } = rawItemsData.data;

    const returnItemsData = data;

    console.log(rawItemsData);

    return {
      data: returnItemsData,
      page,
      status,
      pagination,
    };
  } catch (error) {
    console.log(error);
  }
};

const Items = () => {
  const { data, page, status, pagination } = useLoaderData();
  const products = data;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen  p-4">
      <div className="grid justify-items-end mb-2">
        <Select
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set("status", value);

            navigate(`${location.pathname}?${params.toString()}`);
          }}
          value={status}
          className="border-2 border-red-60 "
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value=" ">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
              <SelectItem value="Borrowed">Borrowed</SelectItem>
              <SelectItem value="Auctioning">Auctioning</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className=" rounded-lg shadow-lg p-4 ">
        <h2 className="text-xl font-semibold text-[#1DCD9F] mb-4">
          Product List
        </h2>
        <Table>
          <TableHeader>
            <TableRow className=" border-[#169976]">
              <TableHead className="text-[#1DCD9F]">Image</TableHead>
              <TableHead className="text-[#1DCD9F]">Name</TableHead>
              <TableHead className="text-[#1DCD9F]">Price</TableHead>
              <TableHead className="text-[#1DCD9F]">Category</TableHead>
              <TableHead className="text-[#1DCD9F]">Type</TableHead>
              <TableHead className="text-[#1DCD9F]">Status</TableHead>
              <TableHead className="text-[#1DCD9F]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id} className="border-[#169976]">
                <TableCell>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>{product.status}</TableCell>
                <TableCell>
                  <div className="flex justify-center ">
                    <Button
                      className="bg-[#169976] text-white hover:bg-[#1DCD9F] px-4 py-2 rounded-md"
                      onClick={() => {
                        navigate(`detail/${product._id}`);
                      }}
                    >
                      View
                    </Button>
                    {product.status != "Rejected" &&
                    product.status != "Sold" ? (
                      <SheetComponent itemId={product._id}></SheetComponent>
                    ) : (
                      ""
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>{" "}
      <div className="mt-2">
        <PaginationAdmin pagination={pagination}></PaginationAdmin>
      </div>
    </div>
  );
};

export default Items;
