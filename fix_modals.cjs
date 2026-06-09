const fs = require('fs');

const modalsPath = 'src/features/admin/components/modals/';
const getFiles = (dir) => fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => dir + f);

const modals = getFiles(modalsPath);

modals.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove unused blind imports
  content = content.replace(/import { Switch } from '.*?switch';\n/, '');
  content = content.replace(/import { Badge } from '.*?badge';\n/, '');
  content = content.replace(/import { ScrollArea } from '.*?scroll-area';\n/, '');

  // For SessionEditModal and SessionCreationModal, fix UI imports
  if (content.includes('Command')) {
    content = `import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '../../../../components/ui/command';\n` + content;
  }
  if (content.includes('PopoverContent')) {
    content = `import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover';\n` + content;
  }
  if (content.includes(' toast(') || content.includes('toast.')) {
    content = `import { toast } from 'sonner';\n` + content;
  }
  if (content.includes('cn(')) {
    content = `import { cn } from '../../../../lib/utils';\n` + content;
  }
  if (content.includes('formatHkDate(')) {
    content = `import { formatHkDate } from '../../../../lib/utils';\n` + content;
  }
  
  const additionalProps = [];
  if (file.includes('UserFormModal') && content.includes('UserRole')) content = content.replace(/UserRole/g, 'any');
  if (file.includes('UserFormModal') && content.includes('UserStatus')) content = content.replace(/UserStatus/g, 'any');
  
  if (file.includes('SessionEditModal')) {
    additionalProps.push('isWeekendOrHoliday');
  }
  
  if (file.includes('UserDeleteModal')) {
     content = content.replace(/from 'lucide-react';/, ', ShieldAlert } from \'lucide-react\';');
  }
  if (file.includes('SessionCreationModal')) {
     if (!content.includes('AlertTriangle')) content = content.replace(/from 'lucide-react';/, ', AlertTriangle } from \'lucide-react\';');
  }
  if (file.includes('SessionEditModal')) {
     if (!content.includes('ChevronLeft')) content = content.replace(/from 'lucide-react';/, ', ChevronLeft } from \'lucide-react\';');
     if (!content.includes('CheckCircle')) content = content.replace(/from 'lucide-react';/, ', CheckCircle } from \'lucide-react\';');
     if (!content.includes('AlertTriangle')) content = content.replace(/from 'lucide-react';/, ', AlertTriangle } from \'lucide-react\';');
  }
  if (file.includes('UserViewModal')) {
     const icons = ['Mail', 'Phone', 'CalendarIcon', 'ShieldAlert', 'Award', 'Download', 'FileText', 'Users', 'Link'];
     icons.forEach(i => {
       if (!content.includes(`import {`) || !content.includes(i)) content = content.replace(/} from 'lucide-react';/, `, ${i=== 'Link' ? 'ExternalLink as Link' : i} } from 'lucide-react';`);
     });
  }

  // add props to interface, destructuring
  if (additionalProps.length > 0) {
     const propAdd = additionalProps.map(p => `  ${p}: any;`).join('\n');
     content = content.replace(/export interface .*?Props \{/, `$& \n${propAdd}`);
     const destrAdd = additionalProps.map(p => `  ${p},`).join('\n');
     content = content.replace(/export function .*?\(\{/, `$& \n${destrAdd}`);
  }

  fs.writeFileSync(file, content, 'utf8');
});

// Update AdminDashboard
let adContent = fs.readFileSync('src/features/admin/AdminDashboard.tsx', 'utf8');
adContent = adContent.replace(/<SessionEditModal\n/, `<SessionEditModal\n              isWeekendOrHoliday={isWeekendOrHoliday}\n`);

fs.writeFileSync('src/features/admin/AdminDashboard.tsx', adContent, 'utf8');
console.log('Fixed Modals');
