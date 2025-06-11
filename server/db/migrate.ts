import pgDefault from 'pg'; // Use default import
import fs from 'fs/promises';
import path from 'path';

const { Pool } = pgDefault; // Destructure Pool from the default import

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  console.log('Connected to database for migrations.');

  try {
    const migrationsDir = path.join(process.cwd(), 'drizzle'); // process.cwd() gives root
    console.log(`Looking for migrations in: ${migrationsDir}`);

    // Check if migrations directory exists
    try {
      await fs.access(migrationsDir);
    } catch (error) {
      console.log('No migrations directory found. Assuming no migrations to run.');
      return;
    }

    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sorts alphabetically, which works for timestamp-based naming

    if (migrationFiles.length === 0) {
      console.log('No SQL migration files found in migrations directory.');
      return;
    }

    console.log('Found migration files:', migrationFiles);

    // Optional: Create a migrations tracking table if it doesn't exist
    // This helps in tracking which migrations have been applied.
    // For simplicity, this example executes all files every time.
    // A more robust solution would track applied migrations in a DB table.
    // Drizzle Kit's enterprise features (drizzle-ORM Studio) or other tools handle this.
    // For now, we'll just run them. If a migration fails due to already being applied,
    // the transaction should roll back that specific file's changes.

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = await fs.readFile(filePath, 'utf-8');
      console.log(`Applying migration: ${file}`);
      try {
        await client.query(sqlContent); // Execute the SQL content
        console.log(`Successfully applied ${file}`);
      } catch (err) {
        console.error(`Error applying migration ${file}:`, err);
        // Decide if you want to stop on error or continue
        throw new Error(`Failed to apply migration ${file}. Halting.`);
      }
    }

    console.log('All migrations applied successfully.');

  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
}

runMigrations();
