import { resourceModels } from './models';

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

export async function ensureDefaultContent() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const appTimeZone = process.env.APP_TIME_ZONE || 'Asia/Karachi';
  const dateKey = getDateKeyForTimeZone(appTimeZone);

  if ((await resourceModels.settings.countDocuments()) === 0) {
    await resourceModels.settings.create({
      masjidName: 'Jami Masjid Noori & Madrasa',
      madrasaName: 'Noori Madrasa',
      address: 'Korangi No. 1, Karachi, Pakistan',
      phone: '+92 300 1234567',
      notice: 'Please give donation according to your ability and support the masjid and madrasa activities.',
      prayerMarquee: 'Prayer times are managed live from the admin panel.'
    });
  }

  await resourceModels['prayer-times'].findOneAndUpdate(
    { dateKey },
    {
      dateKey,
      fajr: '05:10',
      zohar: '12:35',
      asr: '16:25',
      maghrib: '18:40',
      isha: '20:00',
      juma: '13:30'
    },
    { upsert: true, new: true }
  );

  if ((await resourceModels['hero-slides'].countDocuments()) === 0) {
    await resourceModels['hero-slides'].create({
      title: 'Jami Masjid Noori & Madrasa',
      subtitle: 'Korangi No. 1, Karachi',
      imageUrl: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1600&q=80',
      order: 1,
      active: true
    });
  }

  if ((await resourceModels['income-records'].countDocuments()) === 0) {
    await resourceModels['income-records'].create({
      title: 'Juma Collection',
      source: 'Main Hall',
      amount: 65000,
      month,
      year,
      note: 'Sample entry'
    });
  }

  if ((await resourceModels['expense-records'].countDocuments()) === 0) {
    await resourceModels['expense-records'].create({
      title: 'Electricity Bill',
      category: 'Utilities',
      amount: 21000,
      month,
      year,
      note: 'Sample entry'
    });
  }

  if ((await resourceModels['shop-records'].countDocuments()) === 0) {
    await resourceModels['shop-records'].create({
      shopName: 'Books Shop',
      ownerName: 'Sample Owner',
      contactNumber: '+92 300 0000000',
      buyDate: new Date(),
      buyRate: 14000,
      debtAmount: 0,
      monthlyRent: 12000,
      monthsDue: 0,
      paymentStatus: 'Clear',
      note: 'Sample entry'
    });
  }

  if ((await resourceModels.donations.countDocuments()) === 0) {
    await resourceModels.donations.create({
      donorName: 'Anonymous',
      type: 'General',
      amount: 12000,
      month,
      year,
      note: 'Sample entry'
    });
  }

  if ((await resourceModels['fitrah-records'].countDocuments()) === 0) {
    await resourceModels['fitrah-records'].create({
      familyName: 'Khan Family',
      membersCount: 6,
      amount: 9000,
      year,
      note: 'Sample entry'
    });
  }

  if ((await resourceModels.projects.countDocuments()) === 0) {
    await resourceModels.projects.create({
      title: 'Wuzu Area Renovation',
      description: 'Renovation work for improved water and drainage system.',
      status: 'Incomplete',
      targetAmount: 250000,
      collectedAmount: 82000
    });
  }

  if ((await resourceModels.gallery.countDocuments()) === 0) {
    await resourceModels.gallery.create({
      title: 'Main Prayer Hall',
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1530041539828-114de669390e?auto=format&fit=crop&w=1200&q=80',
      caption: 'Sample gallery item',
      order: 1
    });
  }
}
