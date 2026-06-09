const fs = require('fs');

const path = 'src/features/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "          {activeTab === 'overview' && (() => {";
const endStr = "          {activeTab === 'finance' && (";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  let extracted = content.substring(startIndex + startStr.length, endIndex);
  
  // Cut out the last `\n          )}\n` from extracted
  const lastBracketIndex = extracted.lastIndexOf(')}');
  if (lastBracketIndex !== -1) {
    extracted = extracted.substring(0, lastBracketIndex) + extracted.substring(lastBracketIndex + 2);
  }

  const overviewTabCode = `import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Users, BookOpen, Clock, CalendarIcon } from 'lucide-react';
import { ReadOnlyAlert } from './ReadOnlyAlert';

export interface OverviewTabProps {
  getPermission: (module: string) => string;
  users: any[];
  courses: any[];
  sessions: any[];
}

export function OverviewTab({
  getPermission, users, courses, sessions
}: OverviewTabProps) {
  return (
    ${extracted}
  );
}
`;

  fs.writeFileSync('src/features/admin/components/OverviewTab.tsx', overviewTabCode, 'utf8');

  const replacement = `          {activeTab === 'overview' && (
            <OverviewTab 
              getPermission={getPermission}
              users={users}
              courses={courses}
              sessions={sessions}
            />
          )}

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('Successfully extracted OverviewTab');
}
