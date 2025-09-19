import { z, ZodSchema } from "zod";

/**
 * ====================================
 * Item schema
 * ====================================
 */
export const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  images: z.array(z.string()).default([]),
  description: z.string().min(1, "Description is required"),
  price: z.preprocess(
    (val) =>
      typeof val === "string" || typeof val === "number"
        ? Number(val)
        : undefined,
    z.number().positive("Price must be positive")
  ),
  rate: z.enum(["hour", "day"], {
    errorMap: () => ({ message: "Rate must be one of: hour, day, month" }),
  }),
  isFree: z.boolean(),
  status: z.enum(["available", "notAvailable"], {
    errorMap: () => ({
      message: "Status must be one of: available or unavailable",
    }),
  }),
});

/**
 * ====================================
 * Report schema
 * ====================================
 */
export const ReportSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(1, "Description cannot be empty")
    .max(10000000, "Description cannot exceed 10000000 characters"),
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

/**
 * ====================================
 * contact schema
 * ====================================
 */
export const contactSchema = z.object({
  address: z.string().min(1, "Address is required"),
  phone: z.string().regex(/^\+?\d{10,15}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  zalo: z.string().url("Invalid Zalo URL").optional().or(z.literal("")),
  iframe: z.string().optional().or(z.literal("")),
});
