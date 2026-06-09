const fs = require('fs');

const validVars = new Set(JSON.parse(fs.readFileSync('valid_vars.json', 'utf8')));
const icons = ['MonitorPlay', 'Loader2', 'Plus', 'Database', 'ExternalLink', 'LayoutDashboard', 'BookOpen', 'CalendarIcon', 'Users', 'CreditCard', 'Clock', 'MessageSquare', 'CheckCircle', 'XCircle', 'Download', 'FileText', 'Upload', 'GraduationCap', 'BarChart2', 'BarChart3', 'TrendingUp', 'ShieldAlert', 'Building2', 'MapPin', 'CalendarRange', 'Share2', 'ArrowLeftRight', 'ClipboardList', 'Search', 'UserPlus', 'Mail', 'Phone', 'Award', 'ShieldCheck', 'Briefcase', 'KeyRound', 'Copy', 'Edit2', 'Trash2', 'ChevronLeft', 'ChevronDown', 'ChevronUp', 'Sparkles', 'Star', 'AlertTriangle', 'History'];

let adminDashboardContent = fs.readFileSync('src/features/admin/AdminDashboard.tsx', 'utf8');

const generate = (jsonFile) => {
  if (!fs.existsSync(jsonFile)) return;
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const { componentName, props, block } = data;
  
  // Filter props
  const finalProps = props.filter(p => validVars.has(p) && !icons.includes(p));
  finalProps.sort();
  
  // Figure out which icons are used
  const usedIcons = props.filter(p => icons.includes(p) || p === 'Calendar').map(p => p === 'Calendar' ? 'Calendar as CalendarIcon' : p);
  
  // Create Modal code
  const modalCode = `import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { Textarea } from '../../../../components/ui/textarea';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../../components/ui/card';
${usedIcons.length > 0 ? `import { ${[...new Set(usedIcons)].join(', ')} } from 'lucide-react';` : ''}

// Note: Using 'any' for speed and to avoid TS errors.
export interface ${componentName}Props {
${finalProps.map(p => `  ${p}: any;`).join('\n')}
}

export function ${componentName}({
${finalProps.map(p => `  ${p},`).join('\n')}
}: ${componentName}Props) {
  return (
    ${block.split('\n').join('\n    ')}
  );
}
`;

  fs.writeFileSync(`src/features/admin/components/modals/${componentName}.tsx`, modalCode, 'utf8');
  console.log(`Generated ${componentName}.tsx`);
  
  // Replace in AdminDashboard.tsx
  const propsPass = finalProps.map(p => `${p}={${p}}`).join('\n              ');
  const replaceStr = `<${componentName}\n              ${propsPass}\n            />`;
  
  adminDashboardContent = adminDashboardContent.replace(block, replaceStr);
  
  // Add lazy import to AdminDashboard.tsx
  const lazyImport = `const ${componentName} = React.lazy(() => import('./components/modals/${componentName}').then(m => ({ default: m.${componentName} })));\n`;
  if (!adminDashboardContent.includes(`components/modals/${componentName}'`)) {
    // find a place to put it
    const lastLazy = adminDashboardContent.lastIndexOf('const CategoryManagerModal = React.lazy');
    if (lastLazy !== -1) {
      adminDashboardContent = adminDashboardContent.substring(0, lastLazy) + lazyImport + adminDashboardContent.substring(lastLazy);
    }
  }
};

const modalJsons = fs.readdirSync('.').filter(f => f.endsWith('_modal.json'));
modalJsons.forEach(generate);

fs.writeFileSync('src/features/admin/AdminDashboard.tsx', adminDashboardContent, 'utf8');
console.log('Updated AdminDashboard.tsx');

