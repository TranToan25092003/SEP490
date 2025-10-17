import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchIcon as searchSvg } from "@/assets/admin/topmenu_new";
import {
  Table,
  TableBody,
  TableCell,
  TableCellMinContent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import imgBg from "@/assets/admin/figma_selection/faeefebc0dff5a2e07fafd82684d5fe511a5f7d1.png";
import statusTick from "@/assets/admin/figma_selection/ce384d644dd0363c728f1fb1d4d8b014fb7f30c8.svg";
import iconEdit from "@/assets/admin/figma_selection/30d22df015a0acce3dd7984d089bd037853622d7.svg";
import iconDelete from "@/assets/admin/figma_selection/77d1c5cb4524f3bd944adaeee5f86d34af0a071e.svg";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPagination } from "@/components/global/AdminPagination";

export default function ManagerItems() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-[520px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 size-[18px]">
            <img
              src={searchSvg}
              alt="search"
              className="block w-[18px] h-[18px]"
            />
          </span>
          <Input
            placeholder="Tìm kiếm..."
            className="pl-9 h-10 rounded-full text-[16px] placeholder:text-[#656575]"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button>+ Thêm sản phẩm</Button>
          <Button>+ Phiếu nhập kho</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox aria-label="Select all" />
            </TableHead>
            <TableHead>Tên sản phẩm/ Mã sản phẩm</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Hãng</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Số lượng tồn kho</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Giá Bán</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Checkbox aria-label={`Select row ${i}`} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9">
                    <img
                      src={imgBg}
                      alt="bg"
                      className="absolute left-[2px] top-[2px] w-8 h-8"
                    />
                  </div>
                  <div className="leading-4">
                    <div className="text-[#2e2e3a] text-[14px] font-bold tracking-[-0.126px]">
                      Product {i}
                    </div>
                    <div className="text-[#9a9aaf] text-[12px]">#SP000{i}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>02/10/2025</TableCell>
              <TableCell>YAMAHA</TableCell>
              <TableCell>Phụ Tùng</TableCell>
              <TableCell>1234 cái</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <img
                    src={statusTick}
                    alt="ok"
                    className="w-[18px] h-[18px]"
                  />
                  <span className="text-[12px] text-[#24ca49]">Có sẵn</span>
                </div>
              </TableCell>
              <TableCell>120.000</TableCell>
              <TableCellMinContent>
                <div className="flex items-center gap-2 justify-end">
                  <button className="bg-white rounded-[5px] shadow-[0_100px_80px_rgba(5,37,135,0.06),0_41.778px_33.422px_rgba(5,37,135,0.04),0_22.336px_17.869px_rgba(5,37,135,0.04),0_12.522px_10.017px_rgba(5,37,135,0.03),0_6.65px_5.32px_rgba(5,37,135,0.02),0_2.767px_2.214px_rgba(5,37,135,0.02)] w-[34px] h-[34px] grid place-items-center">
                    <img
                      src={iconEdit}
                      alt="edit"
                      className="w-[14px] h-[14px]"
                    />
                  </button>
                  <button className="bg-white rounded-[5px] shadow-[0_100px_80px_rgba(5,37,135,0.06),0_41.778px_33.422px_rgba(5,37,135,0.04),0_22.336px_17.869px_rgba(5,37,135,0.04),0_12.522px_10.017px_rgba(5,37,135,0.03),0_6.65px_5.32px_rgba(5,37,135,0.02),0_2.767px_2.214px_rgba(5,37,135,0.02)] w-[34px] h-[34px] grid place-items-center">
                    <img
                      src={iconDelete}
                      alt="delete"
                      className="w-[14px] h-[14px]"
                    />
                  </button>
                </div>
              </TableCellMinContent>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AdminPagination
        pagination={{
          totalPages: 10,
          itemsPerPage: 5,
          totalItems: 100,
        }}
      />
    </div>
  );
}
