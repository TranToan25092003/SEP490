const mongoose = require("mongoose");
const db = require("../db");
const { Bay } = require("../../model");
const { BayService } = require("../../service/bays.service");

describe("BayService", () => {
  const BAY_IDS = [
    new mongoose.Types.ObjectId("64e4f0c4e17c5a0012039501"),
    new mongoose.Types.ObjectId("64e4f0c4e17c5a0012039502"),
    new mongoose.Types.ObjectId("64e4f0c4e17c5a0012039503"),
    new mongoose.Types.ObjectId("64e4f0c4e17c5a0012039504"),
    new mongoose.Types.ObjectId("64e4f0c4e17c5a0012039505"),
    new mongoose.Types.ObjectId("64e4f0c4e17c5a0012039506"),
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

  describe("getAllBays", () => {
    test("UC0001_returnsEmptyArrayWhenNoBaysExist", async () => {
      const result = await BayService.getAllBays();
      expect(result).toEqual([]);
    });

    test("UC0002_mapsSingleBayDocumentToDTO", async () => {
      await Bay.collection.insertOne({
        _id: BAY_IDS[0],
        bay_number: "A1",
        description: "Engine diagnostics",
      });

      const result = await BayService.getAllBays();

      expect(result).toEqual([
        {
          id: BAY_IDS[0],
          bayNumber: "A1",
          description: "Engine diagnostics",
        },
      ]);
    });

    test("UC0003_preservesInsertionOrderForMultipleBays", async () => {
      await Bay.collection.insertMany([
        {
          _id: BAY_IDS[1],
          bay_number: "B2",
          description: "Bodywork bay",
        },
        {
          _id: BAY_IDS[2],
          bay_number: "C3",
          description: "Electrical bay",
        },
      ]);

      const result = await BayService.getAllBays();

      expect(result).toHaveLength(2);
      expect(result[0].id.toString()).toBe(BAY_IDS[1].toString());
      expect(result[1].id.toString()).toBe(BAY_IDS[2].toString());
    });

    test("UC0004_handlesMissingOptionalDescriptionField", async () => {
      await Bay.collection.insertOne({
        _id: BAY_IDS[3],
        bay_number: "D4",
      });

      const [result] = await BayService.getAllBays();

      expect(result).toEqual({
        id: BAY_IDS[3],
        bayNumber: "D4",
        description: undefined,
      });
    });

    test("UC0005_allowsNumericBayNumberAndReturnsRawValue", async () => {
      await Bay.collection.insertOne({
        _id: BAY_IDS[4],
        bay_number: 12,
        description: "Quick service bay",
      });

      const [result] = await BayService.getAllBays();

      expect(result.id.toString()).toBe(BAY_IDS[4].toString());
      // bayNumber is stored as a number but may be serialized as string by Mongoose/schema
      expect(result.bayNumber).toBe("12");
      expect(result.description).toBe("Quick service bay");
    });

    test("UC0006_returnsOnlyExpectedDTOFields", async () => {
      await Bay.collection.insertOne({
        _id: BAY_IDS[5],
        bay_number: "E5",
        description: "Paint booth",
        extra_field: "should not appear",
      });

      const [result] = await BayService.getAllBays();

      expect(Object.keys(result).sort()).toEqual(
        ["id", "bayNumber", "description"].sort()
      );
      expect(result.description).toBe("Paint booth");
    });
  });
});
