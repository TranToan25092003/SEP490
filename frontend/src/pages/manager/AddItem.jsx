import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddItem() {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thêm sản phẩm</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            Hủy
          </Button>
          <Button className="rounded-full bg-[#df1d01] hover:bg-[#d01b01]">
            Lưu sản phẩm
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[8px] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <h2 className="text-[16px] font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-[14px] text-[#2e2e3a]">Tên sản phẩm</label>
              <Input placeholder="Nhập tên sản phẩm" />
            </div>
            <div className="grid gap-2">
              <label className="text-[14px] text-[#2e2e3a]">Mã sản phẩm</label>
              <Input placeholder="VD: SP0001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">Hãng</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn hãng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yamaha">YAMAHA</SelectItem>
                    <SelectItem value="honda">HONDA</SelectItem>
                    <SelectItem value="suzuki">SUZUKI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">Loại</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="part">Phụ Tùng</SelectItem>
                    <SelectItem value="accessory">Phụ Kiện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">Giá bán</label>
                <Input placeholder="VD: 120000" />
              </div>
              <div className="grid gap-2">
                <label className="text-[14px] text-[#2e2e3a]">
                  Số lượng tồn kho
                </label>
                <Input placeholder="VD: 100" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-[14px] text-[#2e2e3a]">Mô tả</label>
              <Textarea placeholder="Mô tả sản phẩm" rows={5} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[8px] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
          <h2 className="text-[16px] font-semibold mb-4">Hình ảnh</h2>
          <div className="h-[220px] rounded-[8px] border border-dashed grid place-items-center text-[#656575]">
            Kéo & thả ảnh vào đây hoặc chọn file
          </div>
        </div>
      </div>
    </div>
  );
}
