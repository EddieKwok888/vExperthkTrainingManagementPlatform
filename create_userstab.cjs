const fs = require('fs');

const path = 'src/features/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "          {(activeTab === 'staff' || activeTab === 'students') && (";
const endStr = "          {activeTab === 'logs' && (";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  let extracted = content.substring(startIndex + startStr.length, endIndex);
  
  // Cut out the last `\n          )}\n` from extracted
  const lastBracketIndex = extracted.lastIndexOf(')}');
  if (lastBracketIndex !== -1) {
    extracted = extracted.substring(0, lastBracketIndex) + extracted.substring(lastBracketIndex + 2);
  }

  const usersTabCode = `import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ArrowLeftRight, Download, Edit2, KeyRound, Mail, Plus, Search, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { ReadOnlyAlert } from './ReadOnlyAlert';

export interface UsersTabProps {
  activeTab: string;
  getPermission: (module: string) => string;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  filteredUsers: any[];
  setUserForm: (val: any) => void;
  setIsUserModalOpen: (val: boolean) => void;
  handleExportCSV: (data: any[], type: string) => void;
  handleSort: (key: string) => void;
  sortConfig: { key: string, direction: 'asc' | 'desc' };
  setSelectedUser: (user: any) => void;
  handlePasswordReset: (email: string) => void;
  setUserToDelete: (user: any) => void;
  setIsDeleteUserModalOpen: (val: boolean) => void;
  schoolInfo: any;
}

export function UsersTab({
  activeTab, getPermission, searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
  filteredUsers, setUserForm, setIsUserModalOpen, handleExportCSV, handleSort, sortConfig, setSelectedUser,
  handlePasswordReset, setUserToDelete, setIsDeleteUserModalOpen, schoolInfo
}: UsersTabProps) {
  return (
    ${extracted}
  );
}
`;

  fs.writeFileSync('src/features/admin/components/UsersTab.tsx', usersTabCode, 'utf8');

  const replacement = `          {(activeTab === 'staff' || activeTab === 'students') && (
            <UsersTab 
              activeTab={activeTab}
              getPermission={getPermission}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              filteredUsers={filteredUsers}
              setUserForm={setUserForm}
              setIsUserModalOpen={setIsUserModalOpen}
              handleExportCSV={handleExportCSV}
              handleSort={handleSort}
              sortConfig={sortConfig}
              setSelectedUser={setSelectedUser}
              handlePasswordReset={handlePasswordReset}
              setUserToDelete={setUserToDelete}
              setIsDeleteUserModalOpen={setIsDeleteUserModalOpen}
              schoolInfo={schoolInfo}
            />
          )}

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('Successfully extracted UsersTab');
}
