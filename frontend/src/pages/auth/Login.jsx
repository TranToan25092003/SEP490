import React, { useEffect, useState } from "react";
import photo from "../../assets/image.png";
import { useSignIn, useSignUp, useUser } from "@clerk/clerk-react";

import { useNavigate, Route, Routes } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const { isSignedIn } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  if (!isLoaded) return null;

  const handleEmailSignin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status == "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/");
        return;
      }

      if (result.status == "needs_first_factor") {
        const final = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });

        if (final.status == "complete") {
          await setActive({ session: final.createdSessionId });
          navigate("/");
          return;
        }
      }

      navigate("/");
      toast.error("Không thể hoàn tất đăng nhập. Hãy thử lại.");
    } catch (error) {
      toast.warning(error.errors?.[0]?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignin = async () => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {}
  };

  const handleGoogleSignin = async () => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {}
  };
  return (
    <div className="flex items-center justify-center bg-black min-h-screen">
      <div className="flex flex-col md:flex-row w-full relative">
        {/* Cột trái (ảnh + overlay text) */}
        <div className="relative w-full md:w-1/2 h-[300px] md:h-screen ">
          <img src={photo} className="h-full w-full object-cover" alt="" />
          <div className="absolute top-[80px] md:top-[125px] left-[30px] md:ml-[72px] w-[250px] md:w-[350px] h-auto [&_*]:text-white">
            <img
              src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw8NDxUNDRIVFQ0VFxUNDQ8VFRUVDRUNFRUWFxUVFRUYHSggGB0lHRUVITEhJSkrLi4uFx8zODUtNygtLisBCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAOEA4QMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQcC/8QAHBABAAICAwEAAAAAAAAAAAAAAAHwQaERkdEx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANuRQBFQFRUBQAAAAAAAAAAAAAEFAAAAARQC4C4AEUARUBUVAVFQFAAAAAAAARUBQQFEAVFARUUEUAOQAEVAVFQFRUBUVAUAAAAAAABFAAAEUAAAABFEBeRUAAARQBFAAAAAAAAAAAAAAAAAAAAAAAAuQBFAEUARQAAAAAAAAAAAAAAAAAAAAAAAW5QAABFAEVAUAAAAAAAAAAAAEBQQFAAAAAAAARQBFAEVAUAAAAAAAAAAAAAAABFARQBFAAABFAAAEVAUAAAAAAAAAAAAAAAAAAAAAAAAABFQFRUBQAAAAAAAAAAAAAAQFAAABFAAABFQFRUBUVAUEBQAAAAAAAAQFQAVBQRRAURQQAF5AABAVFQFQAUAAAAEBQAAAEVAUEBUVAVFQFEUEABQAEUAQAVABQQFAAAAAAAAAAAAQAUAEUAQVAUW5QAABFQFRUBQQFAAABFAAABFQFRQBFAQUBBQBFAAAEVAVFQAVAUEBQAAAAAAAEAAABUAAAAUEABQvwAui6AAABZQALsAIvZF7ACPCAAAALoALoAAn0AJJAAuwAIACCPAByAD/9k="
              className="w-8 h-8 rounded-full mb-2"
              alt="logo"
            />
            <h1 className="text-3xl md:text-4xl font-bold mb-2 uppercase">
              motormate
            </h1>
            <p className="font-normal leading-normal text-sm md:text-base whitespace-normal break-words">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni
              illo minus, repellat eos in dicta error perspiciatis ad vero
              asperiores, neque esse eligendi deleniti reiciendis cum distinctio
              quo ratione facere!
            </p>
          </div>
        </div>

        {/* Cột phải (form đăng ký / đăng nhập) */}
        <div className="relative w-full md:w-1/2 bg-white border border-red-500 flex flex-col justify-center items-center py-8 md:py-0">
          <div className="absolute top-4 right-4 md:mt-[5px] md:ml-[40px] bg-white w-auto md:w-[260px] h-auto inline-flex text-sm md:text-base">
            <p className="font-normal leading-normal">Bạn chưa có tài khoản?</p>
            <button
              onClick={() => navigate("/register")}
              className="text-[#DF1D01] cursor-pointer underline ml-1 hover:text-red-700"
            >
              Đăng Ký
            </button>
          </div>

          <div className="text-black mt-10 md:mt-0 w-3/4 flex flex-col ">
            <h1 className="uppercase  text-[#D31705]  text-2xl font-semibold">
              ĐĂNG NHẬP
            </h1>

            <div
              className="border border-[#333333]
            flex
            justify-center
            items-center
            mt-5
            h-10
            cursor-pointer hover:bg-gray-200
            "
              onClick={handleGoogleSignin}
              style={{
                border: "1px solid #333",
                borderRadius: "40px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 25"
                className="mr-1"
                fill="none"
              >
                <path
                  d="M22.501 12.7332C22.501 11.8699 22.4296 11.2399 22.2748 10.5865H12.2153V14.4832H18.12C18.001 15.4515 17.3582 16.9099 15.9296 17.8898L15.9096 18.0203L19.0902 20.435L19.3106 20.4565C21.3343 18.6249 22.501 15.9298 22.501 12.7332Z"
                  fill="#4285F4"
                />
                <path
                  d="M12.214 23C15.1068 23 17.5353 22.0666 19.3092 20.4567L15.9282 17.8899C15.0235 18.5083 13.8092 18.9399 12.214 18.9399C9.38069 18.9399 6.97596 17.1083 6.11874 14.5766L5.99309 14.5871L2.68583 17.0954L2.64258 17.2132C4.40446 20.6433 8.0235 23 12.214 23Z"
                  fill="#34A853"
                />
                <path
                  d="M6.12046 14.5767C5.89428 13.9234 5.76337 13.2233 5.76337 12.5C5.76337 11.7767 5.89428 11.0767 6.10856 10.4234L6.10257 10.2842L2.75386 7.7356L2.64429 7.78667C1.91814 9.21002 1.50146 10.8084 1.50146 12.5C1.50146 14.1917 1.91814 15.79 2.64429 17.2133L6.12046 14.5767Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.2141 6.05997C14.2259 6.05997 15.583 6.91163 16.3569 7.62335L19.3807 4.73C17.5236 3.03834 15.1069 2 12.2141 2C8.02353 2 4.40447 4.35665 2.64258 7.78662L6.10686 10.4233C6.97598 7.89166 9.38073 6.05997 12.2141 6.05997Z"
                  fill="#EB4335"
                />
              </svg>
              <p>Continue with Google</p>
            </div>

            <div
              className="border border-[#333333]
            flex
            justify-center
            items-center
            mt-5
            h-10
            cursor-pointer hover:bg-gray-200
            "
              onClick={handleFacebookSignin}
              style={{
                border: "1px solid #333",
                borderRadius: "40px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 32 33"
                className="mr-2"
                fill="none"
              >
                <circle cx="16" cy="16.5" r="14" fill="#0C82EE" />
                <path
                  d="M21.2137 20.7816L21.8356 16.8301H17.9452V14.267C17.9452 13.1857 18.4877 12.1311 20.2302 12.1311H22V8.76699C22 8.76699 20.3945 8.5 18.8603 8.5C15.6548 8.5 13.5617 10.3929 13.5617 13.8184V16.8301H10V20.7816H13.5617V30.3345C14.2767 30.444 15.0082 30.5 15.7534 30.5C16.4986 30.5 17.2302 30.444 17.9452 30.3345V20.7816H21.2137Z"
                  fill="white"
                />
              </svg>
              <p>Continue with Facebook</p>
            </div>
            <div className="flex items-center mt-5">
              <div className="flex-grow border-t border-gray-400"></div>
              <span className="mx-4 text-gray-600">Hoặc</span>
              <div className="flex-grow border-t border-gray-400"></div>
            </div>

            <div className="flex flex-col  w-full mt-5">
              <p>Tài khoản</p>
              <input
                type="text"
                placeholder="Tài khoản"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                className="border border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between">
                <p className="mt-5">Mật khẩu</p>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="16"
                  viewBox="0 0 19 16"
                  className="mt-5 cursor-pointer"
                  onClick={() => {
                    setHide(!hide);
                  }}
                  fill="none"
                >
                  <path
                    d="M17.0189 0.881275L16.283 0.145332C16.075 -0.0626585 15.691 -0.0306494 15.451 0.257296L12.8908 2.80126C11.7388 2.30532 10.4749 2.06532 9.14682 2.06532C5.1947 2.08126 1.77092 4.38523 0.122802 7.69743C0.0267743 7.90542 0.0267743 8.16135 0.122802 8.33734C0.890735 9.90536 2.04281 11.2014 3.48281 12.1773L1.38682 14.3053C1.14682 14.5453 1.11481 14.9293 1.27485 15.1373L2.0108 15.8732C2.21879 16.0812 2.60277 16.0492 2.84277 15.7613L16.8907 1.71339C17.1947 1.47352 17.2267 1.08956 17.0187 0.88155L17.0189 0.881275ZM9.99481 5.71316C9.7228 5.64914 9.43485 5.56919 9.16283 5.56919C7.80278 5.56919 6.71489 6.65721 6.71489 8.01712C6.71489 8.28913 6.77891 8.57708 6.85887 8.8491L5.78675 9.90513C5.4668 9.34518 5.29081 8.72108 5.29081 8.01715C5.29081 5.88918 7.00283 4.17715 9.13081 4.17715C9.83487 4.17715 10.4588 4.35314 11.0188 4.6731L9.99481 5.71316Z"
                    fill={hide ? "#000000" : "#666666"}
                    fill-opacity="0.8"
                  />
                  <path
                    d="M18.1709 7.69737C17.6109 6.57732 16.8749 5.56939 15.963 4.75336L12.9869 7.69737V8.01732C12.9869 10.1453 11.2749 11.8573 9.1469 11.8573H8.82695L6.93896 13.7453C7.64302 13.8893 8.37897 13.9853 9.09897 13.9853C13.0511 13.9853 16.4749 11.6813 18.123 8.35319C18.267 8.12912 18.267 7.90521 18.1709 7.6972L18.1709 7.69737Z"
                    fill={hide ? "#000000" : "#666666"}
                    fill-opacity="0.8"
                  />
                </svg>
              </div>

              <input
                type={hide ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className="border border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="uppercase underline cursor-pointer hover:text-gray-500"
                >
                  QUÊN MẬT KHẨU ?
                </button>
              </div>

              <div className="w-full">
                <button
                  className="uppercase mt-3 bg-[#DF1D01] rounded-4xl h-full flex items-center justify-center gap-1 cursor-pointer hover:bg-red-400"
                  disabled={isLoading}
                  onClick={(e) => {
                    handleEmailSignin(e);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    className="ml-5 my-1"
                    fill="none"
                  >
                    <path
                      d="M20.9 3.42857C20.9 1.54286 19.82 0 18.5 0H14.9V3.42857H18.5V7.97143L14.324 15.4286H10.1V6.85714H5.3C2.648 6.85714 0.5 9.92571 0.5 13.7143V18.8571H2.9C2.9 21.7029 4.508 24 6.5 24C8.492 24 10.1 21.7029 10.1 18.8571H15.476L20.9 9.17143V3.42857ZM2.9 15.4286V13.7143C2.9 11.8286 3.98 10.2857 5.3 10.2857H7.7V15.4286H2.9ZM6.5 20.5714C5.84 20.5714 5.3 19.8 5.3 18.8571H7.7C7.7 19.8 7.16 20.5714 6.5 20.5714Z"
                      fill="white"
                    />
                    <path
                      d="M10.1001 1.71429H4.1001V5.14287H10.1001V1.71429Z"
                      fill="white"
                    />
                    <path
                      d="M20.9 13.7143C18.908 13.7143 17.3 16.0114 17.3 18.8572C17.3 21.7029 18.908 24 20.9 24C22.892 24 24.5 21.7029 24.5 18.8572C24.5 16.0114 22.892 13.7143 20.9 13.7143ZM20.9 20.5714C20.24 20.5714 19.7 19.8 19.7 18.8572C19.7 17.9143 20.24 17.1429 20.9 17.1429C21.56 17.1429 22.1 17.9143 22.1 18.8572C22.1 19.8 21.56 20.5714 20.9 20.5714Z"
                      fill="white"
                    />
                  </svg>
                  <p className="text-white text-xl font-bold mx-2 my-1 mr-5">
                    Đăng Nhập
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
