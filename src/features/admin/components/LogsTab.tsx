import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Search, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../../../types';
import { formatHkDate } from '../../../lib/utils';

interface LogsTabProps {
  logSearchTerm: string;
  setLogSearchTerm: (val: string) => void;
  logMonth: string;
  setLogMonth: (val: string) => void;
  setIsDeleteLogsModalOpen: (val: boolean) => void;
  auditLogs: any[];
  allUsers: User[];
  handleExportCSV: (data: any[], filename: string) => void;
}

export const LogsTab = React.memo(function LogsTab({
  logSearchTerm,
  setLogSearchTerm,
  logMonth,
  setLogMonth,
  setIsDeleteLogsModalOpen,
  auditLogs,
  allUsers,
  handleExportCSV,
}: LogsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Whenever logs filter parameters change, reset back to page 1
  React.useEffect(() => {
    setCurrentPage(1);
  }, [logSearchTerm, logMonth]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => {
      let lDate = '';
      if (l.createdAt?.toDate) {
        const d = l.createdAt.toDate();
        lDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (typeof l.createdAt === 'string') {
        lDate = l.createdAt.slice(0, 7);
      } else if (typeof l.createdAt === 'number') {
        const d = new Date(l.createdAt);
        lDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (logMonth && lDate !== logMonth) return false;
      
      if (logSearchTerm) {
        const search = logSearchTerm.toLowerCase();
        const u = allUsers.find(user => user.email === l.userEmail);
        const displayName = (u ? u.name : l.userEmail) || l.userEmail || '';
        const dateStr = formatHkDate(l.createdAt, true) || '';
        const resString = (l.resource || '').toLowerCase();
        const actString = (l.action || '').toLowerCase();
        
        let tempDetails = '';
        if (l.details) {
          Object.entries(l.details).forEach(([key, val]) => {
            if (key.toLowerCase().includes('id') || key === 'createdAt' || key === 'updatedAt' || key === 'password') return;
            tempDetails += ` ${key} ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`;
          });
        }
        tempDetails = tempDetails.toLowerCase();

        if (!dateStr.toLowerCase().includes(search) &&
            !displayName.toLowerCase().includes(search) &&
            !resString.includes(search) &&
            !actString.includes(search) &&
            !tempDetails.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, allUsers, logSearchTerm, logMonth]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>Security and audit trail (last 1000 entries)</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search logs..." 
              value={logSearchTerm}
              onChange={(e) => setLogSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Input 
            type="month"
            value={logMonth}
            onChange={(e) => setLogMonth(e.target.value)}
            className="w-40 h-8 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => setIsDeleteLogsModalOpen(true)} className="gap-2 h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const formattedForExport = filteredLogs.map(l => {
              const formattedResource = (l.resource || 'System').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              const formattedAction = (l.action || 'Action').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              
              let formattedDetails = 'No additional details';
              if (l.details && Object.keys(l.details).length > 0) {
                const parts: string[] = [];
                Object.entries(l.details).forEach(([key, value]) => {
                  if (key.toLowerCase().includes('id') || key === 'createdAt' || key === 'updatedAt' || key === 'password') return;
                  const niceKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  parts.push(`${niceKey}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
                });
                if (parts.length > 0) formattedDetails = parts.join(' • ');
              }

              const u = allUsers.find(user => user.email === l.userEmail);
              const displayName = u ? u.name : l.userEmail;

              return {
                Timestamp: formatHkDate(l.createdAt, true),
                Action: formattedAction,
                Username: displayName,
                Resource: formattedResource,
                Details: formattedDetails
              };
            });
            handleExportCSV(formattedForExport, 'audit_logs');
          }} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map(l => {
              const formattedResource = (l.resource || 'System').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              const formattedAction = (l.action || 'Action').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              
              let formattedDetails = 'No additional details';
              if (l.details && Object.keys(l.details).length > 0) {
                const parts: string[] = [];
                Object.entries(l.details).forEach(([key, value]) => {
                  if (key.toLowerCase().includes('id') || key === 'createdAt' || key === 'updatedAt' || key === 'password') return;
                  const niceKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  parts.push(`${niceKey}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
                });
                if (parts.length > 0) formattedDetails = parts.join(' • ');
              }

              const u = allUsers.find(user => user.email === l.userEmail);
              const displayName = u ? u.name : l.userEmail;

              return (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap text-slate-500">{formatHkDate(l.createdAt, true)}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider bg-slate-100 text-slate-700">
                      {formattedAction}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700">{displayName}</TableCell>
                  <TableCell className="text-sm text-slate-600 font-medium">
                    {formattedResource}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-md overflow-hidden text-ellipsis whitespace-nowrap" title={formattedDetails}>
                    {formattedDetails}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredLogs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">No logs found.</TableCell></TableRow>}
          </TableBody>
        </Table>

        {filteredLogs.length > 10 && (
          <div className="flex justify-end p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 outline-none font-medium cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <option key={page} value={page}>{page}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 font-medium">of {totalPages}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

