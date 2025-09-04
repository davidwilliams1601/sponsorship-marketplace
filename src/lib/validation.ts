import { z } from 'zod';

export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods');

export const userTypeSchema = z.enum(['admin', 'club', 'business'], {
  errorMap: () => ({ message: 'User type must be admin, club, or business' })
});

export const sponsorshipTitleSchema = z.string()
  .min(1, 'Title is required')
  .max(200, 'Title must not exceed 200 characters')
  .regex(/^[\w\s\-.,!?()]+$/, 'Title contains invalid characters');

export const sponsorshipDescriptionSchema = z.string()
  .min(10, 'Description must be at least 10 characters')
  .max(2000, 'Description must not exceed 2000 characters');

export const amountSchema = z.number()
  .positive('Amount must be greater than 0')
  .max(1000000, 'Amount must not exceed £1,000,000')
  .multipleOf(0.01, 'Amount must be a valid currency amount');

export const messageContentSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(1000, 'Message must not exceed 1000 characters')
  .regex(/^[\s\S]*$/, 'Message contains invalid characters');

export const phoneSchema = z.string()
  .optional()
  .refine((val) => !val || /^(\+44|0)[1-9]\d{8,9}$/.test(val), {
    message: 'Please enter a valid UK phone number'
  });

export const postcodeSchema = z.string()
  .optional()
  .refine((val) => !val || /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(val), {
    message: 'Please enter a valid UK postcode'
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  type: userTypeSchema,
  phone: phoneSchema,
  postcode: postcodeSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  postcode: postcodeSchema,
});

export const sponsorshipCreateSchema = z.object({
  title: sponsorshipTitleSchema,
  description: sponsorshipDescriptionSchema,
  amount: amountSchema,
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must not exceed 100 characters'),
});

export const offerCreateSchema = z.object({
  amount: amountSchema,
  message: messageContentSchema.optional(),
  terms: z.string().max(1000, 'Terms must not exceed 1000 characters').optional(),
});

export const messageCreateSchema = z.object({
  content: messageContentSchema,
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

export function validateFile(file: File, maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
  }
  
  return { valid: true };
}

export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type SponsorshipCreateData = z.infer<typeof sponsorshipCreateSchema>;
export type OfferCreateData = z.infer<typeof offerCreateSchema>;
export type MessageCreateData = z.infer<typeof messageCreateSchema>;