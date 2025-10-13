import React from "react";
import photo from "../../assets/image.png";
import { useSignIn, useSignUp } from "@clerk/clerk-react";

const Login = () => {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const handleFacebookSignin = async () => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_facebook",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {}
  };

  const handleRegister = async () => {
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
      });
    } catch (error) {}
  };

  const handleGoogleSignup = async () => {
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
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
      <div className="flex flex-col md:flex-row w-[90%] md:w-3/4 relative">
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
              onClick={handleGoogleSignup}
              className="text-[#DF1D01] cursor-pointer underline ml-1 hover:text-red-700"
            >
              Đăng Ký
            </button>
          </div>
          {/* Nội dung form chính (nếu có) */}
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
          </div>
        </div>
      </div>
      <div id="clerk-captcha"></div>
    </div>
  );
};

export default Login;
