import { z } from "zod";
import { roles } from "@/lib/domain/auth";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").trim(),
  email: z.email("Enter a valid email address.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
  role: z.enum(roles).default("staff"),
  cooperativeName: z.string().min(3, "Nama koperasi minimal 3 karakter.").trim(),
  cooperativeLegalName: z.string().trim().optional(),
  cooperativeRegistrationNumber: z.string().trim().optional(),
  cooperativeAddress: z.string().min(5, "Alamat koperasi perlu lebih lengkap.").trim(),
  cooperativeCity: z.string().min(2, "Kota/kabupaten wajib diisi.").trim(),
  cooperativeProvince: z.string().min(2, "Provinsi wajib diisi.").trim(),
  cooperativeContactPhone: z.string().min(6, "Nomor kontak wajib diisi.").trim(),
  commodityFocus: z.string().min(2, "Komoditas utama wajib diisi.").trim(),
});
