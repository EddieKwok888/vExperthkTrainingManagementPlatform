const fs = require('fs');
const glob = require('fs').readdirSync('src/features/admin/components/modals').map(f => 'src/features/admin/components/modals/' + f);

const badProps = new Set([
  'currentCats', 'isSelected', 'isTabReadOnly', 'attPercentage', 'attended'
]);

glob.forEach(file => {
   let content = fs.readFileSync(file, 'utf8');
   const lines = content.split('\n');
   const newLines = lines.filter(line => {
       const propMatch = line.match(/^\s*([a-zA-Z0-9_$]+)\s*:\s*any\s*;/);
       if (propMatch && badProps.has(propMatch[1])) return false;
       const destrMatch = line.match(/^\s*([a-zA-Z0-9_$]+)\s*,$/);
       if (destrMatch && badProps.has(destrMatch[1])) return false;
       return true;
   });
   content = newLines.join('\n');
   
   if (file.includes('PromoModal')) {
       if (!content.includes('PROMO_CATEGORIES: any;')) {
          content = content.replace(/export interface PromoModalProps\s*\{/, "$&\n  PROMO_CATEGORIES: any;");
       }
       if (!content.includes('PROMO_CATEGORIES,')) {
          content = content.replace(/export function PromoModal\(\{/, "$&\n  PROMO_CATEGORIES,");
       }
   }
   if (file.includes('DeletePromoModal')) {
       if (!content.includes('PROMO_CATEGORIES: any;')) {
          content = content.replace(/export interface DeletePromoModalProps\s*\{/, "$&\n  PROMO_CATEGORIES: any;");
       }
       if (!content.includes('PROMO_CATEGORIES,')) {
          content = content.replace(/export function DeletePromoModal\(\{/, "$&\n  PROMO_CATEGORIES,");
       }
   }
   if (file.includes('SessionCreationModal')) {
       if (!content.includes('isWeekendOrHoliday: any;')) {
          content = content.replace(/export interface SessionCreationModalProps\s*\{/, "$&\n  isWeekendOrHoliday: any;");
       }
       if (!content.includes('isWeekendOrHoliday,')) {
          content = content.replace(/export function SessionCreationModal\(\{/, "$&\n  isWeekendOrHoliday,");
       }
   }

   // UserFormModal types
   if (file.includes('UserFormModal')) {
      content = content.replace(/Key/g, 'any');
   }

   fs.writeFileSync(file, content, 'utf8');
});

// AdminDashboard.tsx
let adContent = fs.readFileSync('src/features/admin/AdminDashboard.tsx', 'utf8');
badProps.forEach(bad => {
   const rx = new RegExp(`\\s+${bad}=\\{${bad}\\}`, 'g');
   adContent = adContent.replace(rx, '');
});

// Add isWeekendOrHoliday to SessionCreationModal
adContent = adContent.replace(/<SessionCreationModal\n/, "<SessionCreationModal\n              isWeekendOrHoliday={isWeekendOrHoliday}\n");
// Add PROMO_CATEGORIES to DeletePromoModal
adContent = adContent.replace(/<DeletePromoModal\n/, "<DeletePromoModal\n              PROMO_CATEGORIES={PROMO_CATEGORIES}\n");

fs.writeFileSync('src/features/admin/AdminDashboard.tsx', adContent, 'utf8');
console.log('Final fixes applied');
