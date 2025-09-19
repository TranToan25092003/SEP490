import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ErrorPage = ({ errorCode = 404, message = "Page Not Found" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    navigate(-1); // Quay lại trang trước
  };

  const handleGoHome = () => {
    navigate("/"); // Chuyển về trang chủ
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-red-600 dark:text-red-400">
            {errorCode}
          </CardTitle>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-2">
            {message}
          </h2>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorCode === 404
              ? "Sorry, the page you're looking for doesn't exist."
              : "Something went wrong. Please try again later."}
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            >
              Go Back
            </Button>
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorPage;
