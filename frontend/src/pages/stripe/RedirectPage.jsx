import { useState, useEffect } from "react";
import { useNavigate, redirect, useLoaderData } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@/utils/customAxios";

// payment loader
export const paymentLoader = async ({ request }) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return redirect("/");
  }

  try {
    const response = await customFetch("/coin/confirm?session_id=" + sessionId);

    if (response.status == 400) {
      return {
        status: 400,
        message: "Payment failed",
      };
    }

    if (response.status == 200) {
      return {
        status: 200,
        message: "Payment successfully",
      };
    }
  } catch (error) {
    return {
      message: "error",
    };
  }
};

function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(120);

  const { message, status } = useLoaderData();

  useEffect(() => {
    // Đếm ngược mỗi giây
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/"); // Redirect về trang chính
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup khi component unmount
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle
            className={`text-2xl ${
              status == 200 ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Thank you for your payment. You will be redirected to the main page.
            in <span className="font-bold">{countdown}</span> seconds.
          </p>
          <Button onClick={() => navigate("/")} variant="default">
            Back to home page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccess;
