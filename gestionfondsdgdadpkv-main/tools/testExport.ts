import { writeAoAToFile } from '../src/lib/safeXlsx';

async function runTest() {
  const wsData = [
    ['Test Export'],
    ['Generated on', new Date().toISOString()],
    [],
    ['Header1', 'Header2', 'Header3'],
    ['Row1-Col1', 123, 45.67],
    ['Row2-Col1', 456, 89.01],
  ];

  try {
    await writeAoAToFile(wsData, 'test_export.xlsx', 'TestSheet', [{ wch: 20 }, { wch: 15 }, { wch: 15 }]);
    console.log('✅ Excel export test succeeded: test_export.xlsx created');
  } catch (err) {
    console.error('❌ Excel export test failed:', err);
    process.exitCode = 1;
  }
}

runTest();
