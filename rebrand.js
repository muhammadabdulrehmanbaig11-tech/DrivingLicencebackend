const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /DriveLicence Pro/g, replace: 'Teach Me Drive' },
  { search: /DriveLicencePro/g, replace: 'TeachMeDrive' },
  { search: /drivelicencepro\.co\.uk/g, replace: 'teachmedrive.co.uk' },
  { search: /drivelicence\.pro/g, replace: 'teachmedrive.co.uk' },
  { search: /drivelicencepro/g, replace: 'teachmedrive' },
];

const files = [
  'README.md',
  'frontend/src/components/Navbar.tsx',
  'frontend/src/components/Footer.tsx',
  'frontend/src/components/DashboardLayout.tsx',
  'frontend/src/app/terms/page.tsx',
  'frontend/src/app/privacy/page.tsx',
  'frontend/src/app/page.tsx',
  'frontend/src/app/layout.tsx',
  'frontend/src/app/globals.css',
  'frontend/src/app/contact/page.tsx',
  'frontend/src/app/about/page.tsx',
  'backend/prisma/schema.prisma',
  'backend/prisma/seed.ts'
];

for (const file of files) {
  const filePath = path.join('c:\\Users\\aszaf\\Documents\\Online Driving Licence', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    for (const {search, replace} of replacements) {
      if (search.test(content)) {
          content = content.replace(search, replace);
          updated = true;
      }
    }
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`No matches in ${file}`);
    }
  } else {
    console.log(`Not found: ${file}`);
  }
}
