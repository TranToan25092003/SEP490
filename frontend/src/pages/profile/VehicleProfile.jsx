import React from "react";

const cars = [
  // {
  //   _id: "1",
  //   name: "Camry",
  //   brand: "Toyota",
  //   year: 2023,
  //   engine_type: "Gasoline",
  //   description: "Luxury sedan with advanced safety features",
  //   image:
  //     "https://images.unsplash.com/photo-1605559424843-9e4c228fb845?w=400&h=250&fit=crop",
  //   createdAt: "2024-01-15T10:30:00Z",
  //   updatedAt: "2024-01-15T10:30:00Z",
  // },
  {
    _id: "2",
    name: "Corolla",
    brand: "Toyota",
    year: 2022,
    engine_type: "Hybrid",
    description: "Fuel-efficient compact car",
    license_plate: "26-MD1-110112",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop",
    createdAt: "2024-01-16T14:20:00Z",
    updatedAt: "2024-01-16T14:20:00Z",
  },
  // {
  //   _id: "3",
  //   name: "Civic",
  //   brand: "Honda",
  //   year: 2024,
  //   engine_type: "Gasoline",
  //   description: "Sporty hatchback with modern design",
  //   image:
  //     "https://images.unsplash.com/photo-1544620347-12d3db1cf94e?w=400&h=250&fit=crop",
  //   createdAt: "2024-01-17T09:45:00Z",
  //   updatedAt: "2024-01-17T09:45:00Z",
  // },
  // {
  //   _id: "4",
  //   name: "Accord",
  //   brand: "Honda",
  //   year: null,
  //   engine_type: "Diesel",
  //   description: "Premium midsize sedan",
  //   image:
  //     "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop",
  //   createdAt: "2024-01-18T16:10:00Z",
  //   updatedAt: "2024-01-18T16:10:00Z",
  // },
  {
    _id: "5",
    name: "Mustang",
    brand: "Ford",
    year: 2023,
    license_plate: "26-MD1-110112",
    engine_type: "Gasoline",
    description: "Iconic American muscle car",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop",
    createdAt: "2024-01-19T11:25:00Z",
    updatedAt: "2024-01-19T11:25:00Z",
  },
  {
    _id: "6",
    name: "F-150",
    brand: "Ford",
    license_plate: "26-MD1-110112",
    year: 2024,
    engine_type: null,
    description: "Best-selling pickup truck",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop",
    createdAt: "2024-01-20T13:40:00Z",
    updatedAt: "2024-01-20T13:40:00Z",
  },

  {
    _id: "6",
    name: "F-150",
    brand: "Ford",
    year: 2024,
    engine_type: null,
    license_plate: "26-MD1-110112",
    description: "Best-selling pickup truck",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop",
    createdAt: "2024-01-20T13:40:00Z",
    updatedAt: "2024-01-20T13:40:00Z",
  },

  {
    _id: "6",
    name: "F-150",
    brand: "Ford",
    year: 2024,
    engine_type: null,
    license_plate: "26-MD1-110112",
    description: "Best-selling pickup truck",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop",
    createdAt: "2024-01-20T13:40:00Z",
    updatedAt: "2024-01-20T13:40:00Z",
  },

  {
    _id: "6",
    name: "F-150",
    brand: "Ford",
    year: 2024,
    engine_type: null,
    description: "Best-selling pickup truck",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop",
    createdAt: "2024-01-20T13:40:00Z",
    updatedAt: "2024-01-20T13:40:00Z",
  },

  {
    _id: "6",
    name: "F-150",
    brand: "Ford",
    year: 2024,
    engine_type: null,
    description: "Best-selling pickup truck",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=250&fit=crop",
    createdAt: "2024-01-20T13:40:00Z",
    updatedAt: "2024-01-20T13:40:00Z",
  },
];

const VehicleProfile = () => {
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
          <div className="grid grid-cols-4 gap-4 items-center border-b py-2">
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
              <p className="capitalize">mô tả: {car.description}</p>
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
