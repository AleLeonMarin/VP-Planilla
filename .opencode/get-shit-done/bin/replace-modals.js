const fs = require('fs');
const path = require('path');

const files = [
  'src/frontend/src/app/pages/payroll/[id]/page.tsx',
  'src/frontend/src/app/pages/attendance/page.tsx',
  'src/frontend/src/app/pages/employee-deductions/list/page.tsx',
  'src/frontend/src/app/pages/reports/page.tsx',
  'src/frontend/src/app/pages/clocklogs/list/page.tsx',
  'src/frontend/src/app/pages/payroll/calculate/page.tsx',
  'src/frontend/src/app/pages/payroll/list/page.tsx',
  'src/frontend/src/app/pages/branches/list/page.tsx',
  'src/frontend/src/app/pages/vacations/list/page.tsx',
  'src/frontend/src/app/pages/deductions/list/page.tsx',
  'src/frontend/src/app/pages/vacations/create/page.tsx',
];

for (const file of files) {
  const fullPath = path.resolve(file);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Replace modal.showSuccess('title', 'message') with toast.success('message')
  content = content.replace(/modal\.showSuccess\(\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g, "toast.success('$2')");
  
  // Replace modal.showSuccess('title', `template`) with toast.success(`template`)
  content = content.replace(/modal\.showSuccess\(\s*['"]([^'"]+)['"],\s*(`[^`]+`)\s*\)/g, 'toast.success($2)');
  
  // Replace modal.showError('title', 'message') with toast.error('message')
  content = content.replace(/modal\.showError\(\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g, "toast.error('$2')");
  
  // Replace modal.showError('title', err instanceof Error ? err.message : 'fallback')
  content = content.replace(/modal\.showError\(\s*['"]([^'"]+)['"],\s*(err instanceof Error \? err\.message : ['"][^'"]+['"])\s*\)/g, 'toast.error($2)');
  
  // Replace modal.showWarning('title', 'message') with toast.warning('message')
  content = content.replace(/modal\.showWarning\(\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g, "toast.warning('$2')");
  
  // Replace modal.showError('title', error instanceof Error ? error.message : 'fallback')
  content = content.replace(/modal\.showError\(\s*['"]([^'"]+)['"],\s*(error instanceof Error \? error\.message : ['"][^'"]+['"])\s*\)/g, 'toast.error($2)');
  
  // Replace modal.showError with toast.error for remaining patterns
  content = content.replace(/modal\.showError\(\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g, "toast.error('$2')");
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('Processed: ' + file);
}
console.log('Done.');
