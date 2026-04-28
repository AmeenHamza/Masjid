import mongoose, { Schema } from 'mongoose';

const auditFields = {
  addedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
};

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const prayerTimesSchema = new Schema(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    fajr: { type: String, required: true },
    zohar: { type: String, required: true },
    asr: { type: String, required: true },
    maghrib: { type: String, required: true },
    isha: { type: String, required: true },
    juma: { type: String },
    notes: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const incomeRecordSchema = new Schema(
  {
    title: { type: String, required: true },
    source: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const expenseRecordSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const shopRecordSchema = new Schema(
  {
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    contactNumber: { type: String },
    buyDate: { type: Date, required: true },
    buyRate: { type: Number, required: true, min: 0 },
    debtAmount: { type: Number, required: true, min: 0 },
    monthlyRent: { type: Number, required: true, min: 0 },
    monthsDue: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: { type: String, required: true, enum: ['Clear', 'Due', 'Partial'], default: 'Clear' },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const donationSchema = new Schema(
  {
    donorName: { type: String, required: true },
    type: { type: String, enum: ['Friday', 'Box', 'Ramadan', 'Fitrah', 'General', 'Project'], required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const ramadanDonationSchema = new Schema(
  {
    donorName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const ramadanExpenseSchema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const fitrahSchema = new Schema(
  {
    familyName: { type: String, required: true },
    membersCount: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    year: { type: Number, required: true },
    note: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Complete', 'Incomplete', 'Upcoming'], default: 'Incomplete' },
    targetAmount: { type: Number, default: 0 },
    collectedAmount: { type: Number, default: 0 },
    imageUrl: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const gallerySchema = new Schema(
  {
    title: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    caption: { type: String },
    order: { type: Number, default: 0 },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const heroSlideSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

const settingsSchema = new Schema(
  {
    masjidName: { type: String, required: true },
    madrasaName: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    notice: { type: String },
    prayerMarquee: { type: String },
    logoUrl: { type: String },
    heroHeading: { type: String },
    heroSubheading: { type: String },
    ...auditFields
  },
  { timestamps: true, versionKey: false }
);

function getModel(name: string, schema: Schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

export const AdminUser = getModel('AdminUser', adminUserSchema);

export const resourceModels = {
  'prayer-times': getModel('PrayerTimes', prayerTimesSchema),
  'income-records': getModel('IncomeRecord', incomeRecordSchema),
  'expense-records': getModel('ExpenseRecord', expenseRecordSchema),
  'shop-records': getModel('ShopRecord', shopRecordSchema),
  donations: getModel('Donation', donationSchema),
  'ramadan-donations': getModel('RamadanDonation', ramadanDonationSchema),
  'ramadan-expenses': getModel('RamadanExpense', ramadanExpenseSchema),
  'fitrah-records': getModel('FitrahRecord', fitrahSchema),
  projects: getModel('Project', projectSchema),
  gallery: getModel('GalleryItem', gallerySchema),
  'hero-slides': getModel('HeroSlide', heroSlideSchema),
  settings: getModel('MasjidSettings', settingsSchema)
} as const;

export type ResourceKey = keyof typeof resourceModels;
