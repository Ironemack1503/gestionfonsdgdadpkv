const { writeAoAToFile } = require('../tools_dist/src/lib/safeXlsx.cjs');

(async () => {
  const wsData = [
    ['Test Wrapper Export CJS'],
    ['Generated on', new Date().toISOString()],
    [],
    ['Header1', 'Header2', 'Header3'],
    ['Row1-Col1', 123, 45.67],
    ['Row2-Col1', 456, 89.01],
  ];

  try {
    await writeAoAToFile(wsData, 'test_wrapper_export_cjs.xlsx', 'TestSheet', [{ wch: 20 }, { wch: 15 }, { wch: 15 }]);
    console.log('✅ Wrapper CJS export test succeeded: test_wrapper_export_cjs.xlsx created');
  } catch (err) {
    console.error('❌ Wrapper CJS export test failed:', err);
    process.exitCode = 1;
  }
})();
