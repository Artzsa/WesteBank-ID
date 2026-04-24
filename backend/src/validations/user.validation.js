const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit'),
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    rt: z.string().optional(),
    village: z.string().optional(),
    district: z.string().optional(),
    regency: z.string().optional(),
    province: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PENGEPUL', 'WARGA']).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
});

const loginSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 digit')
  })
});

module.exports = {
  registerSchema,
  loginSchema
};
