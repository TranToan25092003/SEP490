import { z, ZodSchema } from "zod";

export const vehicleSchema = z.object({
  name: z.string().min(1, "Tên xe là bắt buộc").max(50, "Tên xe quá dài"),
  brand: z.string().min(1, "Hãng xe là bắt buộc").max(50, "Hãng xe quá dài"),
  license_plate: z
    .string()
    .min(1, "Biển số xe là bắt buộc")
    // Regex mới cho xe máy (ví dụ: 29-G1-12345, 29-G1 123.45, 29-F1-1234)
    .regex(/^[0-9]{2}-[A-Z]{1}[0-9A-Z]{1}[- ][0-9]{3,4}(\.[0-9]{1,2})?$/, {
      message: "Định dạng biển số không hợp lệ (VD: 29-G1-12345, 29-G1 123.45, 29-F1-1234)",
    })
    .max(15, "Biển số quá dài"),
  year: z
    .number()
    .optional()
    .refine((val) => !val || /^\d{4}$/.test(val), {
      message: "Năm phải là 4 chữ số (1900-2025)",
    })
    .transform((val) => (val ? parseInt(val) : null))
    .refine((val) => !val || (val >= 1900 && val <= 2025), {
      message: "Năm từ 1900-2030",
    }),
  engine_type: z.string().max(30, "Loại động cơ quá dài").optional(),
  description: z.string().max(500, "Mô tả quá dài").optional(),

  // 👇 Thêm trường odo_reading
  odo_reading: z
    .number({
      required_error: "Số km là bắt buộc",
      invalid_type_error: "Số km phải là số hợp lệ",
    })
    .nonnegative("Số km không thể âm")
    .max(1000000, "Số km không hợp lệ (quá lớn)")
    .optional(),
});
