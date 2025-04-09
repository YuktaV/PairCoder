/**
 * Custom snapshot resolver for PairCoder CLI tests
 */
module.exports = {
  testPathForConsistencyCheck: 'some/example.test.js',
  
  resolveSnapshotPath: (testPath, snapshotExtension) =>
    testPath.replace(/\.test\.js$/, snapshotExtension),
    
  resolveTestPath: (snapshotFilePath, snapshotExtension) =>
    snapshotFilePath.replace(snapshotExtension, '.test.js')
};
