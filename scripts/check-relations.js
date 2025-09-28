#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Content Relations System...\n');

// Check files existence
const filesToCheck = [
  'types/relations.ts',
  'hooks/use-relations.ts',
  'components/relations/RelationItem.tsx',
  'components/relations/RelationPickerModal.tsx',
  'components/relations/RelationField.tsx',
  'components/relations/RelationManager.tsx',
  'components/relations/RelationDefinitionManager.tsx',
  'components/relations/RelationDefinitionForm.tsx',
  'app/api/relations/definitions/route.ts',
  'app/api/relations/route.ts',
  'app/api/relations/[id]/route.ts',
  'app/api/schema/apply-relations/route.ts',
  'scripts/006_content_relations_schema.sql',
  'app/demo/relations/page.tsx'
];

console.log('📁 File Existence Check:');
console.log('========================');

let allFilesExist = true;
filesToCheck.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  const size = exists ? ` (${Math.round(fs.statSync(fullPath).size / 1024)}KB)` : '';
  console.log(`${status} ${file}${size}`);
  if (!exists) allFilesExist = false;
});

console.log('\n📊 System Status:');
console.log('=================');

if (allFilesExist) {
  console.log('✅ All files are present');
  console.log('✅ System is ready for testing');
} else {
  console.log('❌ Some files are missing');
  console.log('⚠️  Please check the missing files above');
}

console.log('\n🚀 Next Steps:');
console.log('===============');
console.log('1. Apply database schema:');
console.log('   npm run db:migrate');
console.log('');
console.log('2. Start development server:');
console.log('   npm run dev');
console.log('');
console.log('3. Visit demo page:');
console.log('   http://localhost:3000/demo/relations');
console.log('');
console.log('4. Test individual components in the demo tabs');
console.log('');

// Check for package.json scripts
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('📦 Available Scripts:');
    console.log('====================');
    Object.keys(packageJson.scripts || {}).forEach(script => {
      console.log(`   npm run ${script}`);
    });
  } catch (error) {
    console.log('⚠️  Could not read package.json scripts');
  }
}

console.log('\n🎯 Components Summary:');
console.log('======================');
console.log('• useRelations hooks - Data fetching and state management');
console.log('• RelationItem - Individual relation display');
console.log('• RelationPickerModal - Content selection modal');
console.log('• RelationField - Form field for relations');
console.log('• RelationManager - Multi-relation management');
console.log('• RelationDefinitionManager - Admin interface');
console.log('• RelationDefinitionForm - CRUD form for definitions');
console.log('');
console.log('🔗 API Endpoints:');
console.log('=================');
console.log('• GET/POST /api/relations/definitions - Manage definitions');
console.log('• GET/POST /api/relations - Manage relations');
console.log('• GET/PUT/DELETE /api/relations/[id] - Individual relations');
console.log('• POST /api/schema/apply-relations - Apply database schema');

console.log('\n✨ Ready to explore the relations system!');