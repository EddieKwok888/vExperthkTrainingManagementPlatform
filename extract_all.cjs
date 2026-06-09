const fs = require('fs');

const extractModal = (openVarName, componentName, fileName) => {
  const path = 'src/features/admin/AdminDashboard.tsx';
  let content = fs.readFileSync(path, 'utf8');

  let openIdx = content.indexOf(`<Dialog open={${openVarName}}`);
  if (openIdx === -1) {
    console.error(`Could not find ${openVarName}`);
    return;
  }
  
  let searchIdx = openIdx;
  let nesting = 0;
  let closeIdx = -1;
  while (true) {
    const nextOpen = content.indexOf('<Dialog', searchIdx + 1);
    const nextClose = content.indexOf('</Dialog>', searchIdx + 1);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      if (content[nextOpen + 7] === ' ' || content[nextOpen + 7] === '>') nesting++;
      searchIdx = nextOpen;
    } else {
      nesting--;
      if (nesting === -1) { closeIdx = nextClose; break; }
      searchIdx = nextClose;
    }
  }

  if (closeIdx === -1) return;
  const dialogBlock = content.substring(openIdx, closeIdx + '</Dialog>'.length);
  
  // Extract words
  const words = [...new Set([...dialogBlock.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g)].map(m => m[1]))];
  
  // Exclude known React/UI/Lucide components and JS keywords
  const exclude = new Set([
     'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter',
     'Button', 'Input', 'Label', 'Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem',
     'Textarea', 'Switch', 'Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow',
     'Card', 'CardContent', 'CardHeader', 'CardTitle', 'CardDescription', 'CardFooter',
     'Badge', 'ScrollArea', 'Tabs', 'TabsList', 'TabsTrigger', 'TabsContent',
     'className', 'variant', 'size', 'onClick', 'onChange', 'value', 'placeholder', 'type', 'id', 'key',
     'htmlFor', 'checked', 'onCheckedChange', 'disabled', 'open', 'onOpenChange',
     'map', 'filter', 'reduce', 'length', 'includes', 'push', 'join', 'split',
     'Math', 'Date', 'String', 'Number', 'Boolean', 'Array', 'Object', 'JSON', 'console',
     'import', 'export', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'undefined',
     'React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef',
     // Icons
     'Plus', 'Trash2', 'Edit2', 'Search', 'Download', 'FileText', 'Users', 'CalendarIcon', 'Clock', 'MapPin',
     'ShieldCheck', 'ShieldAlert', 'Mail', 'Phone', 'Award', 'Building2', 'CheckCircle', 'XCircle',
     'AlertTriangle', 'Info', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronDown', 'MoreVertical',
     'RefreshCw', 'Save', 'LogOut', 'Settings', 'UserPlus', 'Copy', 'ExternalLink', 'Image as ImageIcon', 'Upload',
     'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'a', 'img', 'svg', 'path', 'strong', 'em', 'ul', 'li', 'br',
  ]);

  const possibleProps = words.filter(w => !exclude.has(w) && !w.match(/^[A-Z_]+$/) && !w.startsWith('sm:') && !w.startsWith('md:') && !w.startsWith('lg:') && !w.startsWith('xl:'));
  
  fs.writeFileSync(fileName + '.json', JSON.stringify({ componentName, props: possibleProps, block: dialogBlock }, null, 2));
  console.log(`Extracted ${componentName} to ${fileName}.json`);
};

extractModal('isDeleteUserModalOpen', 'UserDeleteModal', 'user_delete_modal');
extractModal('isUserModalOpen', 'UserFormModal', 'user_form_modal');
extractModal('isUserViewModalOpen', 'UserViewModal', 'user_view_modal');
extractModal('sessionModalOpen', 'SessionEditModal', 'session_edit_modal');
extractModal('deleteConfirmOpen', 'DeleteConfirmModal', 'delete_confirm_modal');
extractModal('sessionCreationModalOpen', 'SessionCreationModal', 'session_creation_modal');
extractModal('isCertModalOpen', 'CertificateModal', 'certificate_modal');
extractModal('isAttendanceModalOpen', 'AttendanceModal', 'attendance_modal');
extractModal('isSessionAttendanceModalOpen', 'SessionAttendanceModal', 'session_attendance_modal');
extractModal('isManualHoursModalOpen', 'ManualHoursModal', 'manual_hours_modal');
extractModal('isDeleteLogsModalOpen', 'DeleteLogsModal', 'delete_logs_modal');
extractModal('isPromoModalOpen', 'PromoModal', 'promo_modal');
extractModal('isDeletePromoModalOpen', 'DeletePromoModal', 'delete_promo_modal');
