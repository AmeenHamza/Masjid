import { signAuthToken } from '../src/lib/jwt';
import { authCookieName } from '../src/lib/auth';

const BASE = 'http://localhost:3010';
let passed = 0;
let failed = 0;
const cleanup: { collection: string; id: string }[] = [];

function assert(condition: boolean, label: string, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

async function main() {
  const token = await signAuthToken({ id: '507f1f77bcf86cd799439011', email: 'test-runner@masjid.local', role: 'admin' });
  const cookie = `${authCookieName()}=${token}`;

  async function api(path: string, init: RequestInit = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Cookie: cookie, ...(init.headers ?? {}) }
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  async function cycle(collection: string, createPayload: Record<string, unknown>, patchPayload: Record<string, unknown>) {
    console.log(`\n=== ${collection}: create -> update -> delete ===`);
    const create = await api(`/api/admin/${collection}`, { method: 'POST', body: JSON.stringify(createPayload) });
    assert(create.status === 201, `${collection}: POST create succeeds`, create.body);
    const id = create.body?.item?._id;
    if (!id) return;
    cleanup.push({ collection, id });

    const patch = await api(`/api/admin/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(patchPayload) });
    assert(patch.status === 200, `${collection}: PATCH update succeeds`, patch.body);

    const del = await api(`/api/admin/${collection}/${id}`, { method: 'DELETE' });
    assert(del.status === 200, `${collection}: DELETE succeeds`, del.body);
    cleanup.pop();
  }

  console.log('=== Edge cases: auth & validation ===');
  {
    const noAuth = await fetch(`${BASE}/api/admin/shop-records`);
    assert(noAuth.status === 401, 'Unauthenticated request rejected with 401', noAuth.status);
    const unknown = await api('/api/admin/not-a-real-collection');
    assert(unknown.status === 404, 'Unknown collection returns 404', unknown.status);
  }

  console.log('\n=== Shop billing: arrears carry-forward fix (regression check) ===');
  {
    const shopName = 'ZZZTEST-DEPLOY-CHECK-arrears';
    const may = await api('/api/admin/shop-records', {
      method: 'POST',
      body: JSON.stringify({ shopName, ownerName: 'ZZZTEST', buyDate: '2026-01-01', monthlyRent: 5000, month: 5, year: 2026, date: '2026-05-05', paymentAmount: 0 })
    });
    if (may.body?.item?._id) cleanup.push({ collection: 'shop-records', id: may.body.item._id });
    const june = await api('/api/admin/shop-records', {
      method: 'POST',
      body: JSON.stringify({ shopName, ownerName: 'ZZZTEST', buyDate: '2026-01-01', monthlyRent: 5000, month: 6, year: 2026, date: '2026-06-05', paymentAmount: 0 })
    });
    if (june.body?.item?._id) cleanup.push({ collection: 'shop-records', id: june.body.item._id });
    const july = await api('/api/admin/shop-records', {
      method: 'POST',
      body: JSON.stringify({ shopName, ownerName: 'ZZZTEST', buyDate: '2026-01-01', monthlyRent: 5000, month: 7, year: 2026, date: '2026-07-05', paymentAmount: 0 })
    });
    if (july.body?.item?._id) cleanup.push({ collection: 'shop-records', id: july.body.item._id });
    assert(july.body?.item?.debtAmount === 15000, 'No arrears double-counting: July debt is 15000, not 20000', july.body?.item?.debtAmount);
  }

  console.log('\n=== Staff: attendance defaults + delete building block ===');
  {
    const rec = await api('/api/admin/staff-records', {
      method: 'POST',
      body: JSON.stringify({ staffName: 'ZZZTEST-DEPLOY-CHECK-Staff', role: 'Khadim', dateKey: '2026-08-10', fajrAttendance: 'Present', zoharAttendance: 'Present', asrAttendance: 'Present', maghribAttendance: 'Present', ishaAttendance: 'Present', note: '' })
    });
    assert(rec.status === 201 && rec.body?.item?.fajrAttendance === 'Present', 'New staff record saves as Present', rec.body);
    if (rec.body?.item?._id) {
      const del = await api(`/api/admin/staff-records/${rec.body.item._id}`, { method: 'DELETE' });
      assert(del.status === 200, 'Staff record deletes cleanly', del.body);
    }
  }

  console.log('\n=== Hero Slides: blank linkUrl regression check ===');
  await cycle('hero-slides', { title: 'ZZZTEST-DEPLOY-CHECK Slide', subtitle: '', imageUrl: 'https://example.com/hero.jpg', linkUrl: '', order: 0, active: true }, { active: false });

  await cycle('income-records', { title: 'ZZZTEST-DEPLOY-CHECK Income', source: 'ZZZTEST', date: '2026-08-05', amount: 1000, month: 8, year: 2026, note: '' }, { amount: 1500 });
  await cycle('expense-records', { title: 'ZZZTEST-DEPLOY-CHECK Expense', category: 'ZZZTEST', date: '2026-08-05', amount: 500, month: 8, year: 2026, note: '' }, { amount: 750 });
  await cycle('donations', { donorName: 'ZZZTEST-DEPLOY-CHECK Donor', type: 'Friday', date: '2026-08-05', amount: 2000, month: 8, year: 2026, note: '' }, { amount: 2500 });
  await cycle('ramadan-donations', { donorName: 'ZZZTEST-DEPLOY-CHECK', date: '2026-03-05', amount: 3000, month: 3, year: 2026, note: '' }, { amount: 3500 });
  await cycle('ramadan-expenses', { title: 'ZZZTEST-DEPLOY-CHECK', date: '2026-03-05', amount: 400, month: 3, year: 2026, note: '' }, { amount: 450 });
  await cycle('fitrah-records', { familyName: 'ZZZTEST-DEPLOY-CHECK', membersCount: 4, amount: 800, year: 2026, note: '' }, { membersCount: 5 });
  await cycle('madrasa-records', { title: 'ZZZTEST-DEPLOY-CHECK', studentCount: 20, teacherCount: 3, month: 8, year: 2026, note: '' }, { studentCount: 25 });
  await cycle('mosque-bedding', { itemName: 'ZZZTEST-DEPLOY-CHECK', category: 'Bedding', quantity: 5, note: '' }, { quantity: 10 });
  await cycle('projects', { title: 'ZZZTEST-DEPLOY-CHECK', description: 'ZZZTEST', status: 'Incomplete', targetAmount: 100000, collectedAmount: 0 }, { collectedAmount: 5000 });
  await cycle('gallery', { title: 'ZZZTEST-DEPLOY-CHECK', mediaType: 'image', url: 'https://example.com/test.jpg', caption: '', order: 0 }, { caption: 'updated' });

  console.log('\n=== Settings: first-time creation regression check ===');
  {
    const before = await api('/api/admin/settings');
    if (!before.body?.items?.length) {
      const create = await api('/api/admin/settings', { method: 'POST', body: JSON.stringify({ masjidName: 'ZZZTEST-DEPLOY-CHECK', address: 'ZZZTEST', phone: '0300-0000000' }) });
      assert(create.status === 201, 'First-time settings creation succeeds', create.body);
      if (create.body?.item?._id) {
        const del = await api(`/api/admin/settings/${create.body.item._id}`, { method: 'DELETE' });
        assert(del.status === 200, 'Settings cleanup delete succeeds', del.body);
      }
    } else {
      console.log('  Settings already exists (real data present) - skipping create test to avoid disturbing it');
    }
  }

  console.log('\n=== Cleanup ===');
  for (const { collection, id } of cleanup) {
    const res = await api(`/api/admin/${collection}/${id}`, { method: 'DELETE' });
    console.log(`  deleted ${collection}/${id}: ${res.status}`);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('TEST_RUNNER_FAILED', err);
  process.exit(1);
});
