'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { shopService } from '@/services/shopService';

type Tab = 'general' | 'pricing' | 'printers';

function GeneralSettings({ shop, onSave, saving }: any) {
  const [form, setForm] = useState({
    name: shop.name || '',
    location: shop.location || '',
    contact: shop.contact || '',
    openTime: shop.settings?.operatingHours?.open || '09:00',
    closeTime: shop.settings?.operatingHours?.close || '21:00',
    queueCapacity: shop.settings?.queueCapacity || 50,
    autoAcceptOrders: shop.settings?.autoAcceptOrders ?? true,
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [activeDays, setActiveDays] = useState<string[]>(shop.settings?.operatingHours?.days || ['Mon','Tue','Wed','Thu','Fri','Sat']);

  const handleSubmit = () => {
    onSave({
      name: form.name,
      location: form.location,
      contact: form.contact,
      settings: {
        operatingHours: { open: form.openTime, close: form.closeTime, days: activeDays },
        queueCapacity: Number(form.queueCapacity),
        autoAcceptOrders: form.autoAcceptOrders,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-medium">Shop Details</h3>
        {[
          { label: 'Shop Name', key: 'name', type: 'text' },
          { label: 'Location', key: 'location', type: 'text' },
          { label: 'Contact Number', key: 'contact', type: 'tel' },
        ].map(field => (
          <div key={field.key}>
            <label className="text-sm font-medium mb-1 block">{field.label}</label>
            <input
              type={field.type}
              value={(form as any)[field.key]}
              onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-medium">Operating Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Opening Time</label>
            <input type="time" value={form.openTime}
              onChange={e => setForm(prev => ({ ...prev, openTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Closing Time</label>
            <input type="time" value={form.closeTime}
              onChange={e => setForm(prev => ({ ...prev, closeTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Working Days</label>
          <div className="flex gap-2 flex-wrap">
            {days.map(day => (
              <button
                key={day} type="button"
                onClick={() => setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  activeDays.includes(day)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-medium">Queue Settings</h3>
        <div>
          <label className="text-sm font-medium mb-1 block">Max Queue Capacity</label>
          <input type="number" min="10" max="200" value={form.queueCapacity}
            onChange={e => setForm(prev => ({ ...prev, queueCapacity: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Auto-accept orders</p>
            <p className="text-xs text-muted-foreground">Automatically add paid orders to queue</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, autoAcceptOrders: !prev.autoAcceptOrders }))}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.autoAcceptOrders ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.autoAcceptOrders ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit} disabled={saving}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function PricingSettings({ rules, onSave, saving }: any) {
  const printTypes = [
    { colorMode: 'bw', sides: 'single', label: 'B&W Single Side' },
    { colorMode: 'bw', sides: 'duplex', label: 'B&W Duplex' },
    { colorMode: 'color', sides: 'single', label: 'Color Single Side' },
    { colorMode: 'color', sides: 'duplex', label: 'Color Duplex' },
  ];

  const defaults: Record<string, number> = { 'bw-single': 2, 'bw-duplex': 3, 'color-single': 10, 'color-duplex': 20 };

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    printTypes.forEach(pt => {
      const key = `${pt.colorMode}-${pt.sides}`;
      const rule = rules.find((r: any) => r.colorMode === pt.colorMode && r.sides === pt.sides);
      init[key] = rule ? Number(rule.pricePerPage) : defaults[key];
    });
    return init;
  });

  const handleSave = () => {
    const rulesPayload = printTypes.map(pt => ({
      colorMode: pt.colorMode,
      sides: pt.sides,
      pricePerPage: prices[`${pt.colorMode}-${pt.sides}`],
    }));
    onSave(rulesPayload);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-medium">Price Per Page (₹)</h3>
        <p className="text-xs text-muted-foreground">Set the price per page for each print type. Changes apply to all new orders immediately.</p>
        {printTypes.map(pt => {
          const key = `${pt.colorMode}-${pt.sides}`;
          return (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{pt.label}</p>
                <p className="text-xs text-muted-foreground">per page</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹</span>
                <input
                  type="number" min="0.5" max="100" step="0.5"
                  value={prices[key]}
                  onChange={e => setPrices(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-20 px-2 py-1 rounded-lg border border-border bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSave} disabled={saving}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Update Pricing'}
      </button>
    </div>
  );
}

function PrintersSettings({ printers, onAdd, onUpdate, onDelete }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrinter, setNewPrinter] = useState({ name: '', supportsColor: false, supportsDuplex: false });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newPrinter.name.trim()) return;
    setAdding(true);
    await onAdd(newPrinter);
    setNewPrinter({ name: '', supportsColor: false, supportsDuplex: false });
    setShowAddForm(false);
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {printers.length === 0 && !showAddForm && (
        <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
          No printers added yet
        </div>
      )}

      {printers.map((printer: any) => (
        <div key={printer.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{printer.name}</p>
            <div className="flex gap-2 mt-1">
              {printer.supportsColor && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">Color</span>}
              {printer.supportsDuplex && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">Duplex</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate(printer.id, { isOnline: !printer.isOnline })}
              className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                printer.isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {printer.isOnline ? 'Online' : 'Offline'}
            </button>
            <button
              onClick={() => onDelete(printer.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-xs"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input
            type="text" placeholder="Printer name (e.g. HP LaserJet M1005)"
            value={newPrinter.name}
            onChange={e => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-4">
            {[
              { key: 'supportsColor', label: 'Supports Color' },
              { key: 'supportsDuplex', label: 'Supports Duplex' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(newPrinter as any)[opt.key]}
                  onChange={e => setNewPrinter(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                  className="rounded"
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding || !newPrinter.name.trim()}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {adding ? 'Adding...' : 'Add Printer'}
            </button>
            <button onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          + Add Printer
        </button>
      )}
    </div>
  );
}

export default function ShopSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [shop, setShop] = useState<any>(null);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.shopId) return;
    Promise.all([
      shopService.getShop(user.shopId),
      shopService.getPricingRules(user.shopId),
      shopService.getPrinters(user.shopId),
    ]).then(([shopRes, pricingRes, printersRes]) => {
      setShop(shopRes.data);
      setPricingRules(pricingRes.data);
      setPrinters(printersRes.data);
    }).finally(() => setLoading(false));
  }, [user?.shopId]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'pricing', label: 'Pricing Rules' },
    { key: 'printers', label: 'Printers' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Shop Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your shop configuration</p>
        </div>

        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Settings saved successfully
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'general' && shop && (
              <GeneralSettings
                shop={shop}
                onSave={async (data: any) => {
                  setSaving(true);
                  await shopService.updateShop(user!.shopId!, data);
                  setShop({ ...shop, ...data });
                  setSaving(false);
                  showSaved();
                }}
                saving={saving}
              />
            )}

            {activeTab === 'pricing' && (
              <PricingSettings
                rules={pricingRules}
                onSave={async (rules: any) => {
                  setSaving(true);
                  const res = await shopService.updatePricingRules(user!.shopId!, rules);
                  setPricingRules(res.data);
                  setSaving(false);
                  showSaved();
                }}
                saving={saving}
              />
            )}

            {activeTab === 'printers' && (
              <PrintersSettings
                printers={printers}
                shopId={user?.shopId || ''}
                onAdd={async (data: any) => {
                  const res = await shopService.addPrinter(user!.shopId!, data);
                  setPrinters(prev => [...prev, res.data]);
                }}
                onUpdate={async (printerId: string, data: any) => {
                  await shopService.updatePrinter(user!.shopId!, printerId, data);
                  setPrinters(prev => prev.map(p => p.id === printerId ? { ...p, ...data } : p));
                }}
                onDelete={async (printerId: string) => {
                  await shopService.deletePrinter(user!.shopId!, printerId);
                  setPrinters(prev => prev.filter(p => p.id !== printerId));
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
