# Viz'eau

## Requirements

- Node.js 22 LTS or higher
- PostgreSQL 16.9 or higher

## How to run for development
1. Make sure your PostgreSQL server is running. If you haven't set up one, you can run `start_db.sh` to quickly start a PostgreSQL instance using Docker.
2. Create a `.env` file in the root directory of the project from the `.env.example` template and set the `APP_KEY`. It's a random string used for encryption, it can be anything in a development environment.
3. Install the dependencies by running:
    ```bash
    npm install
    ```
4. Run the database migrations to set up the database schema:
    ```bash
    node ace migration:run
    ```
5. Start the application:
    ```bash
    npm run dev
    ```
6. Open your browser and navigate to `http://localhost:3333` to access the application.

## How to run in production
First read this guide to learn how to build the production bundle, managing database migrations and app logs: https://docs.adonisjs.com/guides/getting-started/deployment

Deployments should be done automatically using CI/CD pipelines. 

A few notes about environment variables:
- `APP_KEY`: A random string used for encryption. In production, make sure this is at least 32 characters.
- `DB_*`: Database connection settings (host, port, user, password, database name). The default values are set to match the Docker setup, do not keep these.
- `NODE_ENV`: Should be 'production' in a production or staging environment.

The rest is business logic-dependent and out of the scope of this README.
