# Wake Cake Backend

Production-ready Node.js, Express.js, MySQL REST API for Wake Cake bakery e-commerce.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Start the API:

```bash
npm run dev
```

## Default Roles

The schema seeds two roles:

- `Admin`
- `Customer`

To create an admin user, register normally and update the user's `role_id` to the Admin role in MySQL, or create the admin record directly.

## API Docs

See [docs/API.md](docs/API.md).

## Postman

Import [docs/postman_collection.json](docs/postman_collection.json).
