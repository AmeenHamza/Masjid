import { AdminUser } from '@/models/AdminUser';
import { PrayerTimes } from '@/models/PrayerTimes';
import { IncomeRecord } from '@/models/IncomeRecord';
import { ExpenseRecord } from '@/models/ExpenseRecord';
import { ShopRecord } from '@/models/ShopRecord';
import { Donation } from '@/models/Donation';
import { RamadanDonation } from '@/models/RamadanDonation';
import { RamadanExpense } from '@/models/RamadanExpense';
import { FitrahRecord } from '@/models/FitrahRecord';
import { Project } from '@/models/Project';
import { GalleryItem } from '@/models/GalleryItem';
import { HeroSlide } from '@/models/HeroSlide';
import { MasjidSettings } from '@/models/MasjidSettings';
import { adminLoginSchema, donationSchema, expenseRecordSchema, fitrahRecordSchema, galleryItemSchema, heroSlideSchema, incomeRecordSchema, prayerTimesSchema, projectSchema, ramadanDonationSchema, ramadanExpenseSchema, settingsSchema, shopRecordSchema } from './validators';

export const resourceMap = {
  'prayer-times': { model: PrayerTimes, schema: prayerTimesSchema, title: 'Prayer Times' },
  'income-records': { model: IncomeRecord, schema: incomeRecordSchema, title: 'Income Records' },
  'expense-records': { model: ExpenseRecord, schema: expenseRecordSchema, title: 'Expense Records' },
  'shop-records': { model: ShopRecord, schema: shopRecordSchema, title: 'Shop Records' },
  donations: { model: Donation, schema: donationSchema, title: 'Donations' },
  'ramadan-donations': { model: RamadanDonation, schema: ramadanDonationSchema, title: 'Ramadan Donations' },
  'ramadan-expenses': { model: RamadanExpense, schema: ramadanExpenseSchema, title: 'Ramadan Expenses' },
  'fitrah-records': { model: FitrahRecord, schema: fitrahRecordSchema, title: 'Fitrah Records' },
  projects: { model: Project, schema: projectSchema, title: 'Projects' },
  gallery: { model: GalleryItem, schema: galleryItemSchema, title: 'Gallery' },
  'hero-slides': { model: HeroSlide, schema: heroSlideSchema, title: 'Hero Slides' },
  settings: { model: MasjidSettings, schema: settingsSchema, title: 'Settings' }
} as const;

export const authResource = {
  model: AdminUser,
  schema: adminLoginSchema,
  title: 'Admin Login'
} as const;

export type ResourceKey = keyof typeof resourceMap;
