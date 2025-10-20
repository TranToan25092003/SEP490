import { z, ZodSchema } from "zod";

export const vehicleSchema = z.object({
  name: z.string().min(1, "Tên xe là bắt buộc").max(50, "Tên xe quá dài"),
  brand: z.string().min(1, "Hãng xe là bắt buộc").max(50, "Hãng xe quá dài"),
  license_plate: z
    .string()
    .min(1, "Biển số xe là bắt buộc")
    .regex(/^[0-9]{2}[A-Z]{1,2}[-][0-9]{3,6}$/, {
      message: "Định dạng biển số không hợp lệ (VD: 51A-12345)",
    })
    .max(12, "Biển số quá dài"),
  year: z
    .string()
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
});

/**
 * ====================================
 * generic validate
 * ====================================
 */
export const validateWithZodSchema = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((error) => {
      return error.message;
    });
    throw new Error(errors.join(", "));
  }

  return result.data;
};
