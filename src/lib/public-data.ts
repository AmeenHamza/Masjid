import 'server-only';

import { connectToDatabase } from './db';
import { HeroSlide } from '@/models/HeroSlide';
import { MasjidSettings } from '@/models/MasjidSettings';
import { PrayerTimes } from '@/models/PrayerTimes';
import { Project } from '@/models/Project';
import { GalleryItem } from '@/models/GalleryItem';
import { IncomeRecord } from '@/models/IncomeRecord';
import { ExpenseRecord } from '@/models/ExpenseRecord';
import { Donation } from '@/models/Donation';
import { ShopRecord } from '@/models/ShopRecord';
import { FitrahRecord } from '@/models/FitrahRecord';

export type SiteSettings = {
  masjidName: string;
  madrasaName: string;
  address: string;
  phone: string;
  prayerMarquee: string;
  notice?: string;
  logoUrl?: string;
  heroHeading?: string;
  heroSubheading?: string;
};

const fallbackSettings: SiteSettings = {
  masjidName: 'جامع مسجد نورانی و مدرسہ',
  madrasaName: 'جامع مسجد نورانی و مدرسہ',
  address: 'کورنگی نمبر-1، کراچی',
  phone: '+92 300 1234567',
  prayerMarquee: 'نماز کے اوقات ایڈمن پینل سے دستیاب ہیں',
  notice: 'مسجد اور مدرسہ کی انتظامیہ سے رابطہ کریں'
};

function getDateKeyForTimeZone(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function getCurrentDateKey() {
  const appTimeZone = process.env.APP_TIME_ZONE || 'Asia/Karachi';
  return getDateKeyForTimeZone(appTimeZone);
}

function isDatabaseConfigured() {
  return Boolean(process.env.MONGO_URI);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isDatabaseConfigured()) {
    return fallbackSettings;
  }

  try {
    await connectToDatabase();
    const settings = await MasjidSettings.findOne().lean<SiteSettings | null>();
    return settings ?? fallbackSettings;
  } catch {
    return fallbackSettings;
  }
}

export async function getHeroSlides() {
  const fallbackSlides = [
    {
      title: 'جامع مسجد نورانی و مدرسہ',
      subtitle: 'کورنگی نمبر-1، کراچی',
      imageUrl: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1600&q=80',
      order: 1,
      active: true
    }
  ];

  if (!isDatabaseConfigured()) {
    return fallbackSlides;
  }

  try {
    await connectToDatabase();
    const slides = await HeroSlide.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
    return slides.length > 0 ? slides : fallbackSlides;
  } catch {
    return fallbackSlides;
  }
}

export async function getTodayPrayerTimes() {
  const todayKey = getCurrentDateKey();
  const fallbackPrayerTimes = {
    dateKey: todayKey,
    fajr: '5:15',
    zohar: '12:30',
    asr: '4:15',
    maghrib: '6:55',
    isha: '8:15',
    juma: '1:30'
  };

  if (!isDatabaseConfigured()) {
    return fallbackPrayerTimes;
  }

  try {
    await connectToDatabase();
    const prayerTimes = await PrayerTimes.findOne({ dateKey: todayKey }).lean();
    return prayerTimes ?? fallbackPrayerTimes;
  } catch {
    return fallbackPrayerTimes;
  }
}

export async function getSummaryMetrics() {
  if (!isDatabaseConfigured()) {
    return {
      totalIncome: 0,
      yearlyExpense: 0,
      totalDonation: 0,
      activeProjects: 0
    };
  }

  try {
    await connectToDatabase();
    const [incomeAgg, expenseAgg, donationAgg, projectCount] = await Promise.all([
      IncomeRecord.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      ExpenseRecord.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Donation.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Project.countDocuments({ status: 'Incomplete' })
    ]);

    return {
      totalIncome: incomeAgg[0]?.total ?? 0,
      yearlyExpense: expenseAgg[0]?.total ?? 0,
      totalDonation: donationAgg[0]?.total ?? 0,
      activeProjects: projectCount
    };
  } catch {
    return {
      totalIncome: 0,
      yearlyExpense: 0,
      totalDonation: 0,
      activeProjects: 0
    };
  }
}

export async function getProjects() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await connectToDatabase();
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    return projects;
  } catch {
    return [];
  }
}

export async function getGallery() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await connectToDatabase();
    const items = await GalleryItem.find().sort({ order: 1, createdAt: -1 }).lean();
    return items;
  } catch {
    return [];
  }
}

export async function getIncomeRecords() {
  if (!isDatabaseConfigured()) return [];

  try {
    await connectToDatabase();
    return await IncomeRecord.find().sort({ createdAt: -1 }).limit(200).lean();
  } catch {
    return [];
  }
}

export async function getExpenseRecords() {
  if (!isDatabaseConfigured()) return [];

  try {
    await connectToDatabase();
    return await ExpenseRecord.find().sort({ createdAt: -1 }).limit(200).lean();
  } catch {
    return [];
  }
}

export async function getShopRecords() {
  if (!isDatabaseConfigured()) return [];

  try {
    await connectToDatabase();
    return await ShopRecord.find().sort({ createdAt: -1 }).limit(200).lean();
  } catch {
    return [];
  }
}

export async function getDonationRecords() {
  if (!isDatabaseConfigured()) return [];

  try {
    await connectToDatabase();
    return await Donation.find().sort({ createdAt: -1 }).limit(200).lean();
  } catch {
    return [];
  }
}

export async function getFitrahRecords() {
  if (!isDatabaseConfigured()) return [];

  try {
    await connectToDatabase();
    return await FitrahRecord.find().sort({ createdAt: -1 }).limit(200).lean();
  } catch {
    return [];
  }
}
