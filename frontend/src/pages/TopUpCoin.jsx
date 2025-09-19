import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redirect, useNavigate, useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import clerk from "@/utils/clerk";
import { useUser } from "@clerk/clerk-react";
import { customFetch } from "@/utils/customAxios";

export const TopUpLoader = async () => {
  try {
    if (!clerk.isSignedIn) {
      toast.error("Bạn cần đăng nhập để truy cập trang này", {
        description: "Vui lòng đăng nhập để tiếp tục",
      });
      return redirect("/");
    }
  } catch (error) {
    toast.error("Something wrong", {
      description: "Vui lòng thử lại sau",
    });
    return redirect("/");
  }
};

export const TopUp = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [coinAmount, setCoinAmount] = useState("0");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankCardNumber, setBankCardNumber] = useState("");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [send, setSend] = useState(false);

  // Mock data for transactions (replace with actual API call if needed)
  useEffect(() => {
    const fetchData = async () => {
      const transactionHistoryResponse = await customFetch("/withdraw/list");

      setTransactions(transactionHistoryResponse.data.data);
    };
    fetchData();
  }, []);

  const handleTopUp = () => {
    const total = coinAmount == 0 ? paymentInfo : coinAmount;

    if (total == 0) {
      toast("Vui lòng nhập số coin bạn muốn nạp");
      return;
    }

    if (total >= 100000) {
      toast("Số coin phải nhỏ hơn 10.000");
      return;
    }

    navigate(`/checkout?total=${total}`);
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      if (!withdrawAmount || withdrawAmount <= 0) {
        toast.error("Vui lòng nhập số coin hợp lệ để rút");
        setLoading(false);
        return;
      }
      if (!bankCardNumber) {
        toast.error("Vui lòng nhập số thẻ ngân hàng");
        setLoading(false);
        return;
      }

      const checkCoinResponse = (
        await customFetch(`/withdraw/check?amount=${withdrawAmount}`)
      ).data;

      const requestWithdrawCoinResponse = await customFetch.post("/withdraw", {
        amount: withdrawAmount,
        cardNumber: bankCardNumber,
        type: "minus",
        status: "completed",
      });
      console.log(requestWithdrawCoinResponse);

      toast.success("Yêu cầu rút tiền đã được gửi", {
        description: `Rút ${withdrawAmount} coin (${new Intl.NumberFormat(
          "vi-VN"
        ).format(withdrawAmount * 1000)} VND) vào thẻ ${bankCardNumber}`,
      });

      setLoading(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      setBankCardNumber("");
      navigate(0);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-start gap-6">
      <Card className="rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-[#1DCD9F] mb-4">
          Top Up Coins
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-[#1DCD9F] text-sm mb-2 block">
              Select Coin Amount
            </label>
            <Select value={coinAmount} onValueChange={setCoinAmount}>
              <SelectTrigger className="bg-[#222222] border-[#169976] text-white w-full">
                <SelectValue placeholder="Select coins" />
              </SelectTrigger>
              <SelectContent className="bg-[#222222] text-white border-[#169976]">
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="100">100 Coins (100.000VND)</SelectItem>
                <SelectItem value="500">500 Coins (500.000VND)</SelectItem>
                <SelectItem value="1000">1000 Coins (1000.000VND)</SelectItem>
                <SelectItem value="5000">5000 Coins (5.000.000VND)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[#1DCD9F] text-sm mb-2 block">
              Enter coin:{" "}
              {new Intl.NumberFormat("vi-VN").format(paymentInfo * 1000) +
                " VND"}
            </label>
            <Input
              className="bg-[#222222] border-[#169976] text-white w-full"
              disabled={coinAmount != 0}
              placeholder="Number coin"
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-4">
            <Button
              className="bg-[#169976] text-white hover:bg-[#1DCD9F] w-full"
              onClick={handleTopUp}
            >
              Nạp
            </Button>
            <Button
              className="bg-[#222222] text-white hover:bg-[#333333] w-full"
              onClick={async () => {
                const params = new URLSearchParams(location.search);
                const clerkStatus = params.get("__clerk_status");
                if (clerkStatus == "verified") setIsWithdrawModalOpen(true);
                else {
                  if (!send) {
                    await user?.primaryEmailAddress?.prepareVerification({
                      strategy: "email_link",
                      redirectUrl: "http://localhost:5173/topup",
                    });
                    setSend(true);
                  }

                  toast("Please confirm email");
                }
              }}
            >
              Rút tiền
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction History Table */}
      <Card className="rounded-lg shadow-lg p-6 w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-[#1DCD9F] mb-4">
          Transaction History
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#1DCD9F]">ID</TableHead>
                <TableHead className="text-[#1DCD9F]">Amount</TableHead>
                <TableHead className="text-[#1DCD9F]">Action</TableHead>
                <TableHead className="text-[#1DCD9F]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction._id} className="hover:bg-yellow-100">
                  <TableCell className="text-black">
                    {transaction._id.slice(-6)}
                  </TableCell>
                  <TableCell className="text-black">
                    {new Intl.NumberFormat("vi-VN").format(
                      transaction.amount * 1000
                    )}{" "}
                    VND
                  </TableCell>
                  <TableCell className="text-white">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        transaction.action === "plus"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {transaction.action === "plus" ? "Top up" : "Withdraw"}
                    </span>
                  </TableCell>
                  <TableCell className="text-black">
                    {new Date(transaction.createdAt).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal for Withdraw */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#222222] text-white border-[#169976]">
          <DialogHeader>
            <DialogTitle className="text-[#1DCD9F]">Rút tiền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[#1DCD9F] text-sm mb-2 block">
                Số coin muốn rút:{" "}
                {new Intl.NumberFormat("vi-VN").format(withdrawAmount * 1000) +
                  " VND"}
              </label>
              <Input
                type="number"
                className="bg-[#333333] border-[#169976] text-white w-full"
                placeholder="Nhập số coin"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[#1DCD9F] text-sm mb-2 block">
                Số thẻ ngân hàng
              </label>
              <Input
                className="bg-[#333333] border-[#169976] text-white w-full"
                placeholder="Nhập số thẻ ngân hàng"
                value={bankCardNumber}
                onChange={(e) => setBankCardNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#169976] text-[#1DCD9F] hover:bg-[#333333]"
              onClick={() => setIsWithdrawModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-[#169976] text-white hover:bg-[#1DCD9F]"
              disabled={loading}
              onClick={handleWithdraw}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopUp;
