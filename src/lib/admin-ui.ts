export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'url' | 'date' | 'checkbox' | 'media-upload' | 'time';

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  options?: Array<{ label: string; value: string }>;
  accept?: string;
};

export type ResourceConfig = {
  key: string;
  title: string;
  apiPath: string;
  fields: FieldConfig[];
  searchKeys: string[];
};

const apiBase = '/api';

export const adminResources: ResourceConfig[] = [
  {
    key: 'prayer-times',
    title: 'Prayer Times',
    apiPath: `${apiBase}/admin/prayer-times`,
    searchKeys: ['dateKey', 'notes'],
    fields: [
      { name: 'dateKey', label: 'Date Key', type: 'date' },
      { name: 'fajr', label: 'Fajr', type: 'time' },
      { name: 'zohar', label: 'Zohar', type: 'time' },
      { name: 'asr', label: 'Asr', type: 'time' },
      { name: 'maghrib', label: 'Maghrib', type: 'time' },
      { name: 'isha', label: 'Isha', type: 'time' },
      { name: 'juma', label: 'Juma', type: 'time' },
      { name: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    key: 'income-records',
    title: 'Income Records',
    apiPath: `${apiBase}/admin/income-records`,
    searchKeys: ['title', 'source', 'note'],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'source', label: 'Source', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'expense-records',
    title: 'Expense Records',
    apiPath: `${apiBase}/admin/expense-records`,
    searchKeys: ['title', 'category', 'note'],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'shop-records',
    title: 'Shop Records',
    apiPath: `${apiBase}/admin/shop-records`,
    searchKeys: ['shopName', 'ownerName', 'contactNumber', 'note'],
    fields: [
      { name: 'shopName', label: 'Shop Name', type: 'text' },
      { name: 'ownerName', label: 'Owner Name', type: 'text' },
      { name: 'contactNumber', label: 'Contact Number', type: 'text' },
      { name: 'buyDate', label: 'Buy Date', type: 'date' },
      { name: 'buyRate', label: 'Buy Rate (Rs)', type: 'number' },
      { name: 'debtAmount', label: 'Debt Amount', type: 'number' },
      { name: 'monthlyRent', label: 'Monthly Rent (Rs)', type: 'number' },
      {
        name: 'monthsDue',
        label: 'Rent Due After Months',
        type: 'select',
        options: [
          { label: 'No', value: '0' },
          { label: '1 Month', value: '1' },
          { label: '3 Months', value: '3' },
          { label: '6 Months', value: '6' },
          { label: '12 Months', value: '12' }
        ]
      },
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: [{ label: 'Clear', value: 'Clear' }, { label: 'Due', value: 'Due' }, { label: 'Partial', value: 'Partial' }] },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'donations',
    title: 'Donations',
    apiPath: `${apiBase}/admin/donations`,
    searchKeys: ['donorName', 'note'],
    fields: [
      { name: 'donorName', label: 'Donor Name', type: 'text' },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { label: 'Friday', value: 'Friday' },
          { label: 'Box', value: 'Box' },
          { label: 'Ramadan', value: 'Ramadan' },
          { label: 'Fitrah', value: 'Fitrah' },
          { label: 'General', value: 'General' },
          { label: 'Project', value: 'Project' }
        ]
      },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'ramadan-donations',
    title: 'Ramadan Donations',
    apiPath: `${apiBase}/admin/ramadan-donations`,
    searchKeys: ['donorName', 'note'],
    fields: [
      { name: 'donorName', label: 'Donor Name', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'ramadan-expenses',
    title: 'Ramadan Expenses',
    apiPath: `${apiBase}/admin/ramadan-expenses`,
    searchKeys: ['title', 'note'],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'month', label: 'Month', type: 'number' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'fitrah-records',
    title: 'Fitrah Records',
    apiPath: `${apiBase}/admin/fitrah-records`,
    searchKeys: ['familyName', 'note'],
    fields: [
      { name: 'familyName', label: 'Family Name', type: 'text' },
      { name: 'membersCount', label: 'Members Count', type: 'number' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'year', label: 'Year', type: 'number' },
      { name: 'note', label: 'Note', type: 'textarea' }
    ]
  },
  {
    key: 'projects',
    title: 'Projects',
    apiPath: `${apiBase}/admin/projects`,
    searchKeys: ['title', 'description'],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: [
        { label: 'Complete', value: 'Complete' },
        { label: 'Incomplete', value: 'Incomplete' },
        { label: 'Upcoming', value: 'Upcoming' }
      ] },
      { name: 'targetAmount', label: 'Target Amount', type: 'number' },
      { name: 'collectedAmount', label: 'Collected Amount', type: 'number' },
      { name: 'imageUrl', label: 'Upload Image', type: 'media-upload', accept: 'image/*' }
    ]
  },
  {
    key: 'gallery',
    title: 'Gallery',
    apiPath: `${apiBase}/admin/gallery`,
    searchKeys: ['title', 'caption'],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'mediaType', label: 'Media Type', type: 'select', options: [{ label: 'Image', value: 'image' }, { label: 'Video', value: 'video' }] },
      { name: 'url', label: 'Upload Media', type: 'media-upload', accept: 'image/*' },
      { name: 'caption', label: 'Caption', type: 'textarea' },
      { name: 'order', label: 'Order', type: 'number' }
    ]
  },
  {
    key: 'hero-slides',
    title: 'Hero Slides',
    apiPath: `${apiBase}/admin/hero-slides`,
    searchKeys: ['title', 'subtitle'],
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'linkUrl', label: 'Link URL', type: 'url' },
      { name: 'order', label: 'Order', type: 'number' },
      { name: 'active', label: 'Active', type: 'checkbox' }
    ]
  },
  {
    key: 'settings',
    title: 'Settings',
    apiPath: `${apiBase}/admin/settings`,
    searchKeys: ['masjidName', 'address'],
    fields: [
      { name: 'masjidName', label: 'Masjid Name', type: 'text' },
      { name: 'madrasaName', label: 'Madrasa Name', type: 'text' },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'notice', label: 'Notice', type: 'textarea' },
      { name: 'prayerMarquee', label: 'Prayer Marquee', type: 'textarea' },
      { name: 'logoUrl', label: 'Logo URL', type: 'url' },
      { name: 'heroHeading', label: 'Hero Heading', type: 'text' },
      { name: 'heroSubheading', label: 'Hero Subheading', type: 'textarea' }
    ]
  }
];

export function getResourceConfig(key: string) {
  return adminResources.find((resource) => resource.key === key);
}
