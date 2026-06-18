'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ShopItem = {
  _id: string;
  shopName: string;
  monthlyRent: number;
  ownerName: string;
};

export default function RentCollectPage() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [selectedShopId, setSelectedShopId] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState('Clear');
  const [note, setNote] = useState('');

  // 1. Database se saari shops automatic load karna
  useEffect(() => {
    fetch('/api/admin/shop-records')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.ok) {
          setShops(resData.items || []);
        } else {
          toast.error('Shops fetch karne mein masla hua');
        }
        setLoadingShops(false);
      })
      .catch(() => {
        toast.error('Network error: Shops load nahi ho saki');
        setLoadingShops(false);
      });
  }, []);

  // 2. Dropdown change hone par rent amount auto-fill karna
  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    const targetShop = shops.find((s) => s._id === shopId);
    if (targetShop) {
      setRentAmount(targetShop.monthlyRent.toString());
    } else {
      setRentAmount('');
    }
  };

  // 3. Form Submit karke dynamic API route par bhej rha hai data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return toast.error('Meherbani karke ek Shop select karein');

    setIsSubmitting(true);
    const selectedShop = shops.find((s) => s._id === selectedShopId);

    try {
      const res = await fetch('/api/admin/rent-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: selectedShopId,
          shopName: selectedShop?.shopName,
          rentAmount: Number(rentAmount),
          month,
          year,
          receivedDate,
          paymentStatus,
          note
        })
      });

      const resData = await res.json();
      if (resData.ok) {
        toast.success('Rent Record kamyabi se save ho gaya!');
        // Form reset karne ke liye
        setSelectedShopId('');
        setRentAmount('');
        setNote('');
      } else {
        toast.error(resData.message || 'Record save nahi ho saka');
      }
    } catch {
      toast.error('Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingShops) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <Card className="p-6 border-emerald-200 bg-white shadow-md">
        <h2 className="text-2xl font-bold text-emerald-900 mb-6">Monthly Rent Collection</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shop Selector Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Shop (Automatic List)</label>
            <select
              value={selectedShopId}
              onChange={(e) => handleShopChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 bg-white text-black"
              required
            >
              <option value="">-- Choose Shop --</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id} className="text-black">
                  {shop.shopName} — ({shop.ownerName})
                </option>
              ))}
            </select>
          </div>

          {/* Rent Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (Rs)</label>
            <input
              type="number"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 text-black"
              required
            />
          </div>

          {/* Month & Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 bg-white text-black"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 text-black"
                required
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Date</label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 text-black"
              required
            />
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 bg-white text-black"
            >
              <option value="Clear">Clear</option>
              <option value="Partial">Partial</option>
              <option value="Due">Due</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note / Remarks</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500 h-20 text-black"
              placeholder="Koi makhsoos note..."
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-md transition duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" /> Saving...
              </span>
            ) : (
              'Save Rent Record'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}