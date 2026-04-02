const fs = require('fs');
const path = require('path');

// Files that NO LONGER need modal (all modal calls replaced with toast)
const noModalFiles = [
  'src/frontend/src/app/pages/attendance/page.tsx',
  'src/frontend/src/app/pages/employee-deductions/list/page.tsx',
  'src/frontend/src/app/pages/reports/page.tsx',
  'src/frontend/src/app/pages/clocklogs/list/page.tsx',
  'src/frontend/src/app/pages/payroll/calculate/page.tsx',
  'src/frontend/src/app/pages/branches/list/page.tsx',
  'src/frontend/src/app/pages/vacations/list/page.tsx',
  'src/frontend/src/app/pages/deductions/list/page.tsx',
  'src/frontend/src/app/pages/vacations/create/page.tsx',
];

for (const file of noModalFiles) {
  const fullPath = path.resolve(file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Remove useModal import line
  content = content.replace(/import \{ useModal \} from '@\/hooks\/useModal';\n?/g, '');
  
  // Remove const modal = useModal(); line
  content = content.replace(/  const modal = useModal\(\);\n?/g, '');
  content = content.replace(/const modal = useModal\(\);\n?/g, '');
  
  // Remove <modal.ModalComponent /> line (with optional whitespace)
  content = content.replace(/      <modal\.ModalComponent \/>\n?/g, '');
  content = content.replace(/    <modal\.ModalComponent \/>\n?/g, '');
  content = content.replace(/  <modal\.ModalComponent \/>\n?/g, '');
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('Cleaned: ' + file);
}
console.log('Done.');
