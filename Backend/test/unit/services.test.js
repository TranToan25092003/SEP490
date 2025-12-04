const db = require("../db");
const { ServicesService } = require("../../service/services.service");
const mongoose = require("mongoose");
const { Service } = require("../../model");

const SERVICE_IDS = [
  new mongoose.Types.ObjectId("507f1f77bcf86cd799439013"),
  new mongoose.Types.ObjectId("507f1f77bcf86cd799439014"),
  new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
  new mongoose.Types.ObjectId("507f1f77bcf86cd799439016"),
];

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.closeDatabase();
});

afterEach(async () => {
  await db.clearDatabase();
});

describe("Services Module", () => {
  test("UC0001_shouldReturnAllValidServiceIds", async () => {
    await Service.collection.insertMany([
      {
        _id: SERVICE_IDS[0],
        name: "Thay dầu động cơ",
        base_price: 200000,
        description: "Dịch vụ thay dầu động cơ",
        estimated_time: 30,
      },
      {
        _id: SERVICE_IDS[1],
        name: "Kiểm tra phanh",
        base_price: 150000,
        description: "Dịch vụ kiểm tra hệ thống phanh",
        estimated_time: 45,
      },
    ]);

    const validIds = await ServicesService.getValidServiceIds([
      SERVICE_IDS[0].toString(),
      SERVICE_IDS[1].toString(),
    ]);

    expect(validIds).toHaveLength(2);
    expect(validIds).toContain(SERVICE_IDS[0].toString());
    expect(validIds).toContain(SERVICE_IDS[1].toString());
  });

  test("UC0002_shouldReturnOnlyExistingServiceIds", async () => {
    await Service.collection.insertOne({
      _id: SERVICE_IDS[0],
      name: "Thay dầu động cơ",
      base_price: 200000,
      description: "Dịch vụ thay dầu động cơ",
      estimated_time: 30,
    });

    const validIds = await ServicesService.getValidServiceIds([
      SERVICE_IDS[0].toString(),
      SERVICE_IDS[1].toString(), // This ID doesn't exist
    ]);

    expect(validIds).toHaveLength(1);
    expect(validIds).toContain(SERVICE_IDS[0].toString());
    expect(validIds).not.toContain(SERVICE_IDS[1].toString());
  });

  test("UC0003_shouldReturnEmptyArrayWhenNoServiceIdsMatch", async () => {
    await Service.collection.insertOne({
      _id: SERVICE_IDS[0],
      name: "Thay dầu động cơ",
      base_price: 200000,
      description: "Dịch vụ thay dầu động cơ",
      estimated_time: 30,
    });

    const validIds = await ServicesService.getValidServiceIds([
      SERVICE_IDS[1].toString(),
      SERVICE_IDS[2].toString(),
    ]);

    expect(validIds).toHaveLength(0);
    expect(Array.isArray(validIds)).toBe(true);
  });

  test("UC0004_shouldHandleEmptyInputArray", async () => {
    const validIds = await ServicesService.getValidServiceIds([]);

    expect(validIds).toHaveLength(0);
    expect(Array.isArray(validIds)).toBe(true);
  });

  test("UC0005_shouldHandleDuplicateServiceIds", async () => {
    await Service.collection.insertOne({
      _id: SERVICE_IDS[0],
      name: "Thay dầu động cơ",
      base_price: 200000,
      description: "Dịch vụ thay dầu động cơ",
      estimated_time: 30,
    });

    const validIds = await ServicesService.getValidServiceIds([
      SERVICE_IDS[0].toString(),
      SERVICE_IDS[0].toString(),
      SERVICE_IDS[0].toString(),
    ]);

    // Should return all matching IDs, even duplicates
    expect(validIds.length).toBeGreaterThan(0);
    expect(validIds.every(id => id === SERVICE_IDS[0].toString())).toBe(true);
  });
});
