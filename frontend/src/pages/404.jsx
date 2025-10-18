import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-6">
      <div className="text-center max-w-[560px]">
        <p className="text-[#DF1D01] font-semibold tracking-widest">ERROR</p>
        <h1 className="mt-2 text-6xl font-bold text-[#2E2E3A]">404</h1>
        <p className="mt-3 text-[#656575] text-base">
          OOPS! TRANG BẠN TÌM KHÔNG CÓ, VUI LÒNG THỬ LẠI HOẶC LIÊN HỆ VỚI CHÚNG
          TÔI
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            asChild
            className="rounded-full px-6 bg-[#DF1D01] hover:bg-[#d01b01]"
          >
            <Link to="/">Về trang chủ</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link to={-1}>Quay lại</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
