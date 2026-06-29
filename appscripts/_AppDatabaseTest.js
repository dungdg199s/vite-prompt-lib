function testAppDatabase() {
  const db = AppDatabase.Db;

  // Test Workspaces table
  const workspacesTable = db.table('workspaces-test');
  const workspaceRecord = {
    name: 'Test Workspace',
    description: 'A workspace for testing',
    shareMode: 'private',
    shareWith: [],
  };
  const createdWorkspace = workspacesTable.create(workspaceRecord);
  Logger.log('Created Workspace:' + JSON.stringify(createdWorkspace));

  createdWorkspace.name = 'update name';

  const createdWorkspace1 = workspacesTable.create(createdWorkspace);

  Logger.log('Updated Workspace:' + JSON.stringify(createdWorkspace1));
}
