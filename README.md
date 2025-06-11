# Project Title (Replace with actual project title)

This project uses Node.js, Express, TypeScript, and Drizzle ORM with PostgreSQL.

## Development Setup

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- PostgreSQL server (local installation or Docker)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    ```

### Database Setup

1.  **Ensure PostgreSQL is running.**
    You can use a local PostgreSQL installation or run it via Docker. Example using Docker:
    ```bash
    docker run --name my-postgres-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_USER=myuser -e POSTGRES_DB=mydb -p 5432:5432 -d postgres
    ```
    Adjust user, password, and database name as needed.

2.  **Configure Environment Variables:**
    Create a `.env` file in the root of the project by copying `.env.example` (if it exists) or creating a new one.
    Add your `DATABASE_URL` to the `.env` file:
    ```env
    DATABASE_URL="postgresql://myuser:mysecretpassword@localhost:5432/mydb"
    ```
    Replace `myuser`, `mysecretpassword`, `localhost`, `5432`, and `mydb` with your actual PostgreSQL connection details.

3.  **Generate Database Migrations:**
    The first time, and any time you change the database schema in `server/db/schema.ts`, you need to generate migration files:
    ```bash
    npm run db:generate
    ```
    This will create SQL files in the `./drizzle` directory based on your schema.

4.  **Run Database Migrations:**
    To apply the generated (or new) migrations to your database:
    ```bash
    npm run db:migrate
    ```
    This script executes the SQL files in the `./drizzle` directory.

5.  **Seed the Database:**
    To populate the database with initial data:
    ```bash
    npm run db:seed
    ```
    This script uses the `seedDatabase` method in `DrizzleStorage` to insert seed data.

### Running the Application

-   **Development mode (with hot reloading):**
    ```bash
    npm run dev
    ```

-   **Production mode (after building):**
    ```bash
    npm run build
    npm start
    ```

## Available Scripts

-   `npm run dev`: Starts the development server using `tsx`.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts the production server.
-   `npm run check`: Runs TypeScript type checking.
-   `npm run db:generate`: Generates SQL migration files from `server/db/schema.ts`.
-   `npm run db:migrate`: Applies pending migrations to the database.
-   `npm run db:seed`: Seeds the database with initial data.
-   `npm run db:push`: (If using `drizzle-kit push` for rapid prototyping) Pushes schema changes directly to the DB. Note: `db:generate` and `db:migrate` provide a more robust migration workflow.

## Project Structure (Overview)

-   `server/`: Contains backend server code.
    -   `db/`: Database related files.
        -   `schema.ts`: Drizzle ORM schema definitions for tables.
        -   `migrate.ts`: Script to run migrations.
        -   `seed.ts`: Script to seed the database.
    -   `storage.ts`: Contains `DrizzleStorage` for database interactions.
    -   `routes.ts`: API route definitions.
    -   `index.ts`: Main server entry point.
-   `shared/`: Code shared between frontend (if any) and backend (e.g., Zod schemas for validation).
-   `drizzle/`: Contains generated SQL migration files.
-   `drizzle.config.ts`: Configuration for Drizzle Kit.
-   `.env`: Environment variables (DATABASE_URL, JWT_SECRET, etc.). Should not be committed.
-   `package.json`: Project dependencies and scripts.
-   `tsconfig.json`: TypeScript configuration.
