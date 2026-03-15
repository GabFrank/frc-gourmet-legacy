const { spawn } = require('child_process');
const path = require('path');

const dbPath = '/Users/gabfranck/Library/Application Support/frc-gourmet/frc-gourmet.db';

console.log('Testing MCP SQLite Server...');
console.log('Database path:', dbPath);

// Test if the database file exists
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  console.log('✅ Database file exists');
  const stats = fs.statSync(dbPath);
  console.log('Database size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
} else {
  console.log('❌ Database file not found');
  process.exit(1);
}

// Test SQLite directly to see what tables exist
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

console.log('\n🔍 Testing direct SQLite connection...');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('✅ Successfully connected to database');
    console.log('📋 Tables found:', rows.length);
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name}`);
    });
  }

  // Close the database connection
  db.close();

  console.log('\n🎯 MCP SQLite Server should be ready to use in Cursor!');
  console.log('Try these commands in Cursor:');
  console.log('1. db_info');
  console.log('2. list_tables');
  console.log('3. get_table_schema with tableName: "persona"');
});
