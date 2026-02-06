import { writeAoAToFile } from '../tools_dist/src/lib/safeXlsx.mjs';

async function run() {
  const wsData = [
    ['Test Wrapper Export'],
    ['Generated on', new Date().toISOString()],
    [],
    ['Header1', 'Header2', 'Header3'],
    ['Row1-Col1', 123, 45.67],
    ['Row2-Col1', 456, 89.01],
  ];

  try {
    await writeAoAToFile(wsData, 'test_wrapper_export.xlsx', 'TestSheet', [{ wch: 20 }, { wch: 15 }, { wch: 15 }]);
    console.log('✅ Wrapper export test succeeded: test_wrapper_export.xlsx created');
  } catch (err) {
    console.error('❌ Wrapper export test failed:', err);
    process.exitCode = 1;
  }
}

run();
