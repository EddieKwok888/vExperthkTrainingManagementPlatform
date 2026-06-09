import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';

interface SettingsTabProps {
  schoolInfo: {
    name: string;
    logo_url?: string;
    address: string;
    phone: string;
    email?: string;
    invoice_prefix: string;
    terms_conditions: string;
    rooms?: string;
  };
  setSchoolInfo: (info: any) => void;
  handleSaveSchoolInfo: () => void;
  readOnly?: boolean;
}

export function SettingsTab({
  schoolInfo,
  setSchoolInfo,
  handleSaveSchoolInfo,
  readOnly = false,
}: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Settings</CardTitle>
        <CardDescription>Customize school information for invoices and receipts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">School Name</label>
            <Input 
              value={schoolInfo.name} 
              onChange={e => setSchoolInfo({...schoolInfo, name: e.target.value})}
              placeholder="e.g. Training Academy"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">School Logo</label>
            <div className="flex items-center gap-4">
              {schoolInfo.logo_url && (
                <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <img src={schoolInfo.logo_url} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSchoolInfo({...schoolInfo, logo_url: reader.result as string});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Official Address</label>
            <Input 
              value={schoolInfo.address} 
              onChange={e => setSchoolInfo({...schoolInfo, address: e.target.value})}
              placeholder="Full address for invoices"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Phone</label>
            <Input 
              value={schoolInfo.phone} 
              onChange={e => setSchoolInfo({...schoolInfo, phone: e.target.value})}
              placeholder="+852 XXXX XXXX"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sales Email</label>
            <Input 
              value={schoolInfo.email || ''} 
              onChange={e => setSchoolInfo({...schoolInfo, email: e.target.value})}
              placeholder="sales@example.com"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Invoice Prefix</label>
            <Input 
              value={schoolInfo.invoice_prefix} 
              onChange={e => setSchoolInfo({...schoolInfo, invoice_prefix: e.target.value})}
              placeholder="e.g. INV"
              disabled={readOnly}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Invoice Terms & Conditions</label>
          <Textarea 
            value={schoolInfo.terms_conditions} 
            onChange={e => setSchoolInfo({...schoolInfo, terms_conditions: e.target.value})}
            className="min-h-[100px]"
            placeholder="Enter center fee terms, policies, etc."
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Rooms & Capacity (comma separated)</label>
          <Textarea 
            value={schoolInfo.rooms || ''} 
            onChange={e => setSchoolInfo({...schoolInfo, rooms: e.target.value})}
            className="min-h-[100px]"
            placeholder="e.g. Room 101 (20), Room 102 (30), Main Hall (100)"
            disabled={readOnly}
          />
          <p className="text-xs text-slate-500">List of rooms available for classes with capacity. Separate by commas (e.g. Room A (20), Room B (30)).</p>
        </div>
        
        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={handleSaveSchoolInfo} className="bg-blue-600 hover:bg-blue-700 font-semibold text-sm">
              Save Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
