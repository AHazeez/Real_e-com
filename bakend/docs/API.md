# Wake Cake API Documentation

Base URL: `{{API_BASE_URL}}`

Authentication uses JWT bearer tokens:

```http
Authorization: Bearer <token>
```

## Auth

### Register

`POST /auth/register`

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "password123",
  "phone": "9999999999"
}
```

### Login

`POST /auth/login`

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

### Logout

`POST /auth/logout`

Requires authentication. Stateless logout returns success; the client should discard the token.

## Products

### Add Product

`POST /products`

Admin only. Use `multipart/form-data`.

Fields: `name`, `description`, `price`, `category`, `category_id`, `stock_quantity`, `reorder_level`, `status`, `image`.

### Get Products

`GET /products`

### Get Product Details

`GET /products/:id`

### Update Product

`PUT /products/:id`

Admin only. Supports `multipart/form-data` and partial updates.

### Delete Product

`DELETE /products/:id`

Admin only.

## Categories

### Add Category

`POST /categories`

Admin only.

```json
{
  "category_name": "Cakes"
}
```

### Get Categories

`GET /categories`

### Update Category

`PUT /categories/:id`

Admin only.

### Delete Category

`DELETE /categories/:id`

Admin only.

## Customers

### Profile And Order History

`GET /customers/profile`

### Update Profile

`PUT /customers/profile`

```json
{
  "name": "Customer Name",
  "phone": "9999999999",
  "address_line1": "Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India"
}
```

## Cart

### Add To Cart

`POST /cart`

```json
{
  "product_id": 1,
  "quantity": 2
}
```

### View Cart

`GET /cart`

### Update Quantity

`PUT /cart/:id`

```json
{
  "quantity": 3
}
```

### Remove Item

`DELETE /cart/:id`

## Orders

### Place Order

`POST /orders`

Creates an order from the authenticated user's cart, reduces inventory, creates order items, creates a payment row, and clears the cart.

```json
{
  "delivery_address": "Customer delivery address",
  "notes": "Write on cake: Happy Birthday",
  "payment_method": "COD"
}
```

### View Orders

`GET /orders`

Customers see their own orders. Admins see all orders.

### View Order

`GET /orders/:id`

### Update Order Status

`PUT /orders/:id`

Admin only.

```json
{
  "status": "Baking"
}
```

Allowed statuses: `Pending`, `Confirmed`, `Baking`, `Ready`, `Delivered`, `Cancelled`.

## Inventory

### Track Stock And Low Stock

`GET /inventory`

Admin only. Returns `low_stock` flag when `stock_quantity <= reorder_level`.

### Update Stock

`PUT /inventory/:id`

Admin only.

```json
{
  "stock_quantity": 25,
  "reorder_level": 5
}
```

## Admin Dashboard

`GET /admin/stats`

Admin only.

Returns:

```json
{
  "total_products": 10,
  "total_orders": 20,
  "total_customers": 15,
  "total_revenue": 5000,
  "low_stock_count": 2
}
```

## Reports

Admin only.

- `GET /reports/daily`
- `GET /reports/weekly`
- `GET /reports/monthly`

Each report includes sales totals and top-selling products for the period.

## Security Notes

- Passwords are hashed with bcrypt.
- SQL queries use mysql2 prepared statements.
- JWT middleware protects private routes.
- Role middleware enforces Admin and Customer access.
- `helmet`, `cors`, rate limiting, payload limits, and centralized error handling are enabled.
- Environment variables are loaded from `.env`.
