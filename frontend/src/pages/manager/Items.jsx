import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchIcon as searchSvg } from "@/assets/admin/topmenu_new";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import imgBg from "@/assets/admin/figma_selection/faeefebc0dff5a2e07fafd82684d5fe511a5f7d1.png";
import statusTick from "@/assets/admin/figma_selection/ce384d644dd0363c728f1fb1d4d8b014fb7f30c8.svg";
import iconEdit from "@/assets/admin/figma_selection/30d22df015a0acce3dd7984d089bd037853622d7.svg";
import iconDelete from "@/assets/admin/figma_selection/77d1c5cb4524f3bd944adaeee5f86d34af0a071e.svg";
import { Checkbox } from "@/components/ui/checkbox";

export default function ManagerItems() {
  return (
    <div className="p-6">
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
          <Button className="rounded-full h-10 px-6 text-[16px] font-bold bg-[#df1d01] hover:bg-[#d01b01] text-white">
            + Thêm sản phẩm
          </Button>
          <Button className="rounded-full h-10 px-6 text-[16px] font-bold bg-[#fe7e07] hover:bg-[#e67106] text-white">
            + Phiếu nhập kho
          </Button>
        </div>
      </div>

      <div className="mt-6 bg-[#F1F1F1] rounded-[6px] shadow-[0_100px_80px_rgba(195,194,209,0.07),0_41.778px_33.422px_rgba(195,194,209,0.05),0_22.336px_17.869px_rgba(195,194,209,0.04),0_12.522px_10.017px_rgba(195,194,209,0.04),0_6.65px_5.32px_rgba(195,194,209,0.03),0_2.767px_2.214px_rgba(195,194,209,0.02)] overflow-hidden">
        <Table
          className="text-[12px] border-separate border-spacing-y-3"
          style={{ borderSpacing: "0 12px" }}
        >
          <TableHeader className="bg-white  -translate-y-2.5">
            <TableRow className="border-0">
              <TableHead className="w-[24px]">
                <Checkbox aria-label="Select all" />
              </TableHead>
              <TableHead className="w-[184px] text-[#656575]">
                Tên sản phẩm/ Mã sản phẩm
              </TableHead>
              <TableHead className="w-[140px] text-[#656575]">
                Ngày tạo
              </TableHead>
              <TableHead className="w-[90px] text-[#656575]">Hãng</TableHead>
              <TableHead className="w-[90px] text-[#656575]">Loại</TableHead>
              <TableHead className="w-[110px] text-[#656575]">
                Số lượng tồn kho
              </TableHead>
              <TableHead className="w-[80px] text-[#656575]">
                Trạng thái
              </TableHead>
              <TableHead className="w-[60px] text-[#656575]">Giá Bán</TableHead>
              <TableHead className="w-[74px] text-right text-[#656575]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i} className="border-0 bg-white rounded-[6px]">
                <TableCell className="w-[24px] rounded-l-[6px]">
                  <Checkbox aria-label={`Select row ${i}`} />
                </TableCell>
                <TableCell className="w-[184px]">
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
                      <div className="text-[#9a9aaf] text-[12px]">
                        #SP000{i}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[140px] text-[#2e2e3a]">
                  02/10/2025
                </TableCell>
                <TableCell className="w-[90px] text-[#2e2e3a]">
                  YAMAHA
                </TableCell>
                <TableCell className="w-[90px] text-[#2e2e3a]">
                  Phụ Tùng
                </TableCell>
                <TableCell className="w-[110px] text-[#2e2e3a]">
                  1234 cái
                </TableCell>
                <TableCell className="w-[80px]">
                  <div className="flex items-center gap-1">
                    <img
                      src={statusTick}
                      alt="ok"
                      className="w-[18px] h-[18px]"
                    />
                    <span className="text-[12px] text-[#24ca49]">Có sẵn</span>
                  </div>
                </TableCell>
                <TableCell className="w-[60px] text-[#2e2e3a]">
                  120.000
                </TableCell>
                <TableCell className="w-[74px] rounded-r-[6px]">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
