import React from "react";
import setting from "../../assets/Settings.svg";
import deleteIcon from "../../assets/Delete.svg";

const HistoryRepair = () => {
  return (
    <div className=" h-screen flex flex-col md:w-4/5 sm:w-full mx-auto overflow-hidden">
      <div className="border border-yellow-700 relative md:h-2/5 sm:h-screen md:visible  bg-contain bg-no-repeat bg-center ">
        <img
          src="/src/assets/72066df545dc82b34dee04b69356287535e39908.jpg"
          className="h-full w-full object-fill"
          alt=""
        />

        <div className="absolute top-10 left-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="195"
            height="70"
            viewBox="0 0 291 109"
            fill="none"
          >
            <rect
              width="190"
              height="109"
              transform="translate(50)"
              fill="#0E1315"
            />
            <rect
              width="120"
              height="113.98"
              transform="matrix(1 0 -0.292372 0.956305 33.6602 0)"
              fill="#0E1315"
            />
            <rect
              width="120"
              height="113.98"
              transform="matrix(1 0 -0.292372 0.956305 170.66 0)"
              fill="#0E1315"
            />
          </svg>
          <h1 className=" absolute top-4 left-8 text-2xl font-bold text-[#E82917]">
            MotorMate
          </h1>
        </div>

        <div className="absolute top-27 left-40">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="185"
            height="60"
            viewBox="0 0 291 109"
            fill="none"
          >
            <rect
              width="200"
              height="97"
              transform="matrix(1 0 -0.292372 0.956305 10.6602 0)"
              fill="#ffffff"
            />
            <rect
              width="100"
              height="97"
              transform="matrix(1 0 -0.292372 0.956305 210.66 0)"
              fill="#ffffff"
            />
          </svg>
          <h1 className=" absolute top-3 left-6 text-xl font-bold text-[#0E1315]">
            Lịch sử sửa xe
          </h1>
        </div>

        <div className="absolute top-40 left-45">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="185"
            height="60"
            viewBox="0 0 291 109"
            fill="none"
          >
            <rect
              width="200"
              height="60"
              transform="matrix(1 0 -0.292372 0.956305 10.6602 0)"
              fill="#DF1D01"
            />
            <rect
              width="100"
              height="60"
              transform="matrix(1 0 -0.292372 0.956305 1300.66 0)"
              fill="#DF1D01"
            />
          </svg>
          <h1 className=" absolute top-2 left-7 text-xs text-white">
            3.000.000VND
          </h1>
        </div>
      </div>

      {/* content */}
      <div className=" h-3/5 ">
        <div className="flex justify-between items-center mt-5 mx-5">
          {/* left */}
          <div className=" flex justify-center items-center ">
            <img
              src={setting}
              className="bg-white border-r border-gray-400"
              width={24}
              height={20}
              alt=""
            />

            <div className="flex justify-center items-center bg-[#e3e3ed] ml-2 rounded-sm p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="ml-1 cursor-pointer hover:bg-white"
              >
                <mask
                  id="mask0_262_2236"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                >
                  <rect width="24" height="24" fill="#D9D9D9" />
                </mask>
                <g mask="url(#mask0_262_2236)">
                  <path
                    d="M9.51965 15.6153C7.81196 15.6153 6.36582 15.023 5.18122 13.8384C3.99661 12.6538 3.4043 11.2077 3.4043 9.49999C3.4043 7.79231 3.99661 6.34616 5.18122 5.16154C6.36582 3.97694 7.81196 3.38464 9.51965 3.38464C11.2273 3.38464 12.6735 3.97694 13.8581 5.16154C15.0427 6.34616 15.635 7.79231 15.635 9.49999C15.635 10.2141 15.5151 10.8961 15.2754 11.5461C15.0356 12.1961 14.7158 12.7615 14.3158 13.2423L20.0696 18.9961C20.2081 19.1346 20.2789 19.3087 20.2821 19.5183C20.2853 19.7279 20.2145 19.9051 20.0696 20.05C19.9248 20.1948 19.7491 20.2673 19.5427 20.2673C19.3363 20.2673 19.1607 20.1948 19.0158 20.05L13.2619 14.2961C12.7619 14.7089 12.1869 15.032 11.5369 15.2653C10.8869 15.4987 10.2145 15.6153 9.51965 15.6153ZM9.51965 14.1154C10.8081 14.1154 11.8995 13.6683 12.7937 12.774C13.6879 11.8798 14.135 10.7885 14.135 9.49999C14.135 8.21153 13.6879 7.12018 12.7937 6.22594C11.8995 5.33171 10.8081 4.88459 9.51965 4.88459C8.23118 4.88459 7.13983 5.33171 6.2456 6.22594C5.35138 7.12018 4.90427 8.21153 4.90427 9.49999C4.90427 10.7885 5.35138 11.8798 6.2456 12.774C7.13983 13.6683 8.23118 14.1154 9.51965 14.1154Z"
                    fill="#35353A"
                  />
                </g>
              </svg>
              <input type="search" placeholder="Tìm kiếm" className="ml-1 " />
            </div>
          </div>

          {/* right */}
          <div className="flex justify-center items-center w-2/5">
            <div className="w-2/5 flex justify-between border-r border-gray-400 px-1">
              <p className="text-gray-600">1 - 10 of 52</p>
              <div className="flex ">
                <img
                  src={setting}
                  className="bg-white mr-1"
                  width={24}
                  height={20}
                  alt=""
                />
                <img
                  src={setting}
                  className="bg-white "
                  width={24}
                  height={20}
                  alt=""
                />
              </div>
            </div>
            <div className="w-1/4 flex justify-between items-center mx-2 border-r border-gray-400 ">
              <img
                src={setting}
                className="bg-white mr-1"
                width={24}
                height={20}
                alt=""
              />
              <img
                src={setting}
                className="bg-white mr-1"
                width={24}
                height={20}
                alt=""
              />
              <div>
                <img
                  src={setting}
                  className="bg-white mr-1 "
                  width={24}
                  height={20}
                  alt=""
                />
              </div>
            </div>
            <div className="w-1/10 flex justify-end">
              <img
                src={setting}
                className="bg-white mr-1"
                width={24}
                height={20}
                alt=""
              />
            </div>
          </div>
        </div>

        <div className="mt-10 ">
          <table className="w-full table-fixed border-collapse text-center">
            <thead className="">
              <tr className="[&_*]:text-sm [&_*]:text-left  ">
                <th className=" px-4 py-2 w-[16.6%]">Mã lệnh</th>
                <th className=" px-8 py-2 w-[21.6%]">Xe</th>
                <th className=" px-6 py-2 w-[16.6%]">Thời gian</th>
                <th className=" px-4 py-2 w-[16.6%]">Dịch vụ</th>
                <th className=" px-4 py-2 w-[10%]">Status</th>
                <th className=" px-4 py-2 w-[10%]">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr className="[&_*] border-b border-gray-400">
                <td className="-300 px-4 py-2">WG-20250924-0012</td>
                <td className=" px-4 py-2">30G-123.45 + Atlis 2019</td>
                <td className=" px-4 py-2">24/09/2025 09:10</td>
                <td className=" px-4 py-2">Thay dầu, Kiểm tra phanh</td>
                <td className=" px-4 py-2">
                  <p className="bg-green-100 text-green-700 w-fit">Hoàn tất</p>
                </td>
                <td className=" px-4 py-2 flex justify-evenly items-center [&_*]:cursor-pointer [&_*]:hover:bg-gray-300">
                  <img src={deleteIcon} alt="" />
                  <img src={deleteIcon} alt="" />
                  <img src={deleteIcon} alt="" />
                </td>
              </tr>
              <tr className="[&_*] border-b border-gray-400">
                <td className="-300 px-4 py-2">WG-20250924-0012</td>
                <td className=" px-4 py-2">30G-123.45 + Atlis 2019</td>
                <td className=" px-4 py-2">24/09/2025 09:10</td>
                <td className=" px-4 py-2">Thay dầu, Kiểm tra phanh</td>
                <td className=" px-4 py-2">
                  <p className="bg-blue-100 text-blue-700 w-full capitalize px-0.5">
                    đang sửa
                  </p>
                </td>
                <td className=" px-4 py-2 flex justify-evenly items-center [&_*]:cursor-pointer [&_*]:hover:bg-gray-300">
                  <img src={deleteIcon} alt="" />
                  <img src={deleteIcon} alt="" />
                  <img src={deleteIcon} alt="" />
                </td>
              </tr>
              <tr className="[&_*] border-b border-gray-400">
                <td className="-300 px-4 py-2">WG-20250924-0012</td>
                <td className=" px-4 py-2">30G-123.45 + Atlis 2019</td>
                <td className=" px-4 py-2">24/09/2025 09:10</td>
                <td className=" px-4 py-2">Thay dầu, Kiểm tra phanh</td>
                <td className=" px-4 py-2">
                  <p className="bg-yellow-100 text-yellow-700 w-fit capitalize">
                    đang chờ duyệt
                  </p>
                </td>
                <td className=" px-4 py-2 flex justify-evenly items-center [&_*]:cursor-pointer [&_*]:hover:bg-gray-300">
                  <img src={deleteIcon} className="" alt="" />
                  <img src={deleteIcon} alt="" />
                  <img src={deleteIcon} alt="" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryRepair;
