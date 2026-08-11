import { z } from 'zod';

export const prayerTimesSchema = z.object({
  dateKey: z.string().min(1),
  fajr: z.string().min(1),
  zohar: z.string().min(1),
  asr: z.string().min(1),
  maghrib: z.string().optional(),
  isha: z.string().min(1),
  juma: z.string().optional(),
  notes: z.string().optional()
});

export const incomeRecordSchema = z.object({
  title: z.string().min(1),
  source: z.string().min(1),
  date: z.string().optional(),
  amount: z.number().min(0),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  note: z.string().optional()
});

export const expenseRecordSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  date: z.string().optional(),
  amount: z.number().min(0),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  note: z.string().optional()
});

export const madrasaRecordSchema = z.object({
  title: z.string().min(1),
  studentCount: z.number().int().min(0),
  teacherCount: z.number().int().min(0),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  note: z.string().optional()
});

export const mosqueBeddingSchema = z.object({
  itemName: z.string().min(1),
  category: z.enum(['Bedding', 'Foundation', 'Expansion', 'Repairs', 'Other']),
  quantity: z.number().int().min(0),
  note: z.string().optional()
});

const staffAttendanceStatus = z.enum(['Present', 'Absent']).default('Absent');

export const staffRecordSchema = z.object({
  staffName: z.string().min(1),
  // Role is a free string to support admin-defined custom roles in addition
  // to Imam / Muazzin / Khadim.
  role: z.string().min(1),
  dateKey: z.coerce.date().default(() => new Date()),
  fajrAttendance: staffAttendanceStatus,
  zoharAttendance: staffAttendanceStatus,
  asrAttendance: staffAttendanceStatus,
  maghribAttendance: staffAttendanceStatus,
  ishaAttendance: staffAttendanceStatus,
  note: z.string().optional()
});

export const customRoleSchema = z.object({
  name: z.string().min(1).max(60)
});

export const shopRecordSchema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string().min(1),
  contactNumber: z.string().optional(),
  buyDate: z.coerce.date(),
  date: z.string().optional(),
  buyRate: z.number().min(0).optional(),
  debtAmount: z.number().min(0).optional(),
  monthlyRent: z.number().min(0),
  monthsDue: z.coerce.number().int().min(0).optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  paymentStatus: z.enum(['Clear', 'Due', 'Partial']).optional(),
  paymentAmount: z.number().min(0).optional(),
  previousBalance: z.number().min(0).optional(),
  serialNumber: z.string().optional(),
  rentHistory: z.record(z.string(), z.any()).optional(),
  note: z.string().optional()
});

export const donationSchema = z.object({
  donorName: z.string().min(1),
  type: z.enum(['Friday', 'Box', 'Ramadan', 'Fitrah', 'General', 'Project']),
  date: z.string().optional(),
  amount: z.number().min(0),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  note: z.string().optional()
});

export const ramadanDonationSchema = z.object({
  donorName: z.string().min(1),
  date: z.string().optional(),
  amount: z.number().min(0),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  note: z.string().optional()
});

export const ramadanExpenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().min(0),
  date: z.string().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  note: z.string().optional()
});

export const fitrahRecordSchema = z.object({
  familyName: z.string().min(1),
  membersCount: z.number().int().min(1),
  amount: z.number().min(0),
  year: z.number().int(),
  note: z.string().optional()
});

export const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['Complete', 'Incomplete', 'Upcoming']),
  targetAmount: z.number().min(0).default(0),
  collectedAmount: z.number().min(0).default(0),
  imageUrl: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export const galleryItemSchema = z.object({
  title: z.string().min(1),
  mediaType: z.enum(['image', 'video']),
  url: z.string().url(),
  // .url().optional() only allows undefined, not an empty string, so a form
  // field left blank (submitted as '') would fail validation - allow '' too.
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  caption: z.string().optional(),
  order: z.number().int().default(0)
});

export const heroSlideSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  imageUrl: z.string().url(),
  // Same as thumbnailUrl above: leaving "Link URL" blank in the admin form
  // submits '', which .url().optional() alone would reject.
  linkUrl: z.string().url().optional().or(z.literal('')),
  order: z.number().int().default(0),
  active: z.boolean().default(true)
});

export const settingsSchema = z.object({
  masjidName: z.string().min(1),
  madrasaName: z.string().optional(),
  address: z.string().min(1),
  phone: z.string().min(1),
  notice: z.string().optional(),
  prayerMarquee: z.string().optional(),
  logoUrl: z.string().url().optional(),
  heroHeading: z.string().optional(),
  heroSubheading: z.string().optional()
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
