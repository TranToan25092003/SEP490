import React from "react";

const VehicleProfile = (vehicles) => {
  const cars = vehicles.vehicles;

  return (
    <div className="container mx-auto p-6 ">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            xe của bạn
          </h1>
        </div>
      </div>

      {/* Horizontal List - Mỗi xe 1 dòng */}
      <div className="flex flex-col container">
        {cars.map((car) => (
          <div
            className="grid grid-cols-4 gap-4 items-center border-b py-2"
            key={car._id}
          >
            <div>
              <img
                src={car.image}
                className="w-30 h-20 object-cover rounded-xl ml-1"
                alt=""
              />
            </div>

            <div>
              <p className="capitalize font-medium">tên: {car.name}</p>
              <p className="capitalize font-medium">hãng: {car.brand}</p>
            </div>

            <div>
              <p className="capitalize font-medium">
                biển: {car.license_plate}
              </p>
              <p className="capitalize">động cơ: {car.engine_type}</p>
            </div>

            <div>
              <p className="capitalize font-medium">năm: {car.year}</p>
              <p className="capitalize truncate">mô tả: {car.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State nếu không có data */}
      {cars.length === 0 && (
        <div className="w-full text-center">
          <p className="capitalize font-bold mb-50">bạn chưa có xe nào</p>
        </div>
      )}
    </div>
  );
};

export default VehicleProfile;
