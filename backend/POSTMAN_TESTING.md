# Postman Testing Guide

## Setup

1. **Base URL**: `http://localhost:3001/api`
2. **Default Owner Credentials**:
   - Email: `owner@utopiabyrim.com`
   - Password: `owner123`

---

## Step 1: Login (Get JWT Token)

### Request:
- **Method**: `POST`
- **URL**: `http://localhost:3001/api/auth/login`
- **Headers**: 
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "owner@utopiabyrim.com",
  "password": "owner123"
}
```

### Expected Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "owner@utopiabyrim.com",
    "name": "Utopia Owner",
    "role": "owner"
  }
}
```

### ⚠️ IMPORTANT: Save the Token!
1. Copy the `token` value from the response
2. In Postman, go to **Environments** → Create New Environment (or use existing)
3. Add variable: `token` = `paste_your_token_here`
4. Or manually copy it for each request that needs auth

---

## Step 2: Create a Category (Admin)

### Request:
- **Method**: `POST`
- **URL**: `http://localhost:3001/api/admin/categories`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE` (replace with token from Step 1)
- **Body** (raw JSON):
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products and gadgets",
  "isActive": true,
  "position": 0
}
```

### Expected Response:
```json
{
  "id": "uuid-here",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products and gadgets",
  "isActive": true,
  "position": 0,
  "createdAt": "2025-12-22T...",
  "updatedAt": "2025-12-22T..."
}
```

### 💡 Save the category `id` for later use!

---

## Step 3: Create Another Category (Optional)

### Request:
- **Method**: `POST`
- **URL**: `http://localhost:3001/api/admin/categories`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (raw JSON):
```json
{
  "name": "Clothing",
  "slug": "clothing",
  "description": "Clothing and apparel",
  "isActive": true,
  "position": 1
}
```

---

## Step 4: Get All Categories (Public - No Auth)

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/categories`
- **Headers**: None required

### Expected Response:
```json
[
  {
    "id": "...",
    "name": "Electronics",
    "slug": "electronics",
    ...
  },
  {
    "id": "...",
    "name": "Clothing",
    "slug": "clothing",
    ...
  }
]
```

---

## Step 5: Get Category by Slug (Public)

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/categories/electronics`
- **Headers**: None required

---

## Step 6: Create a Product (Admin)

### Request:
- **Method**: `POST`
- **URL**: `http://localhost:3001/api/admin/products`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (raw JSON):
```json
{
  "name": "Wireless Headphones",
  "slug": "wireless-headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "price": 99.99,
  "currency": "USD",
  "sku": "WH-001",
  "stockQuantity": 50,
  "isActive": true,
  "categoryIds": ["CATEGORY_ID_FROM_STEP_2"]
}
```

**⚠️ Replace `CATEGORY_ID_FROM_STEP_2` with the actual category ID from Step 2!**

### Expected Response:
```json
{
  "id": "product-uuid-here",
  "name": "Wireless Headphones",
  "slug": "wireless-headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "price": "99.99",
  "currency": "USD",
  "sku": "WH-001",
  "stockQuantity": 50,
  "isActive": true,
  "categories": [...],
  "images": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 💡 Save the product `id` for adding images!

---

## Step 7: Add Product Image (Admin)

### Request:
- **Method**: `POST`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID/images`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (raw JSON):
```json
{
  "url": "https://example.com/images/headphones-1.jpg",
  "altText": "Wireless Headphones Front View",
  "position": 0,
  "isPrimary": true
}
```

**⚠️ Replace `PRODUCT_ID` with the actual product ID from Step 6!**

### Add More Images:
```json
{
  "url": "https://example.com/images/headphones-2.jpg",
  "altText": "Wireless Headphones Side View",
  "position": 1,
  "isPrimary": false
}
```

---

## Step 8: Get All Products (Public)

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/products`
- **Headers**: None required

### With Filters (Query Parameters):
- **By Category**: `http://localhost:3001/api/products?category=electronics`
- **Search**: `http://localhost:3001/api/products?search=headphones`
- **Price Range**: `http://localhost:3001/api/products?min_price=50&max_price=150`
- **Sort**: `http://localhost:3001/api/products?sort=price:asc`
- **Combined**: `http://localhost:3001/api/products?category=electronics&min_price=50&sort=price:desc`

---

## Step 9: Get Product by Slug (Public)

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/products/wireless-headphones`
- **Headers**: None required

### Expected Response:
```json
{
  "id": "...",
  "name": "Wireless Headphones",
  "slug": "wireless-headphones",
  "description": "...",
  "price": "99.99",
  "categories": [...],
  "images": [
    {
      "id": "...",
      "url": "https://example.com/images/headphones-1.jpg",
      "altText": "Wireless Headphones Front View",
      "position": 0,
      "isPrimary": true
    }
  ],
  ...
}
```

---

## Step 10: Admin - Get All Products

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/admin/products`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

### With Filters:
- **By Category**: `http://localhost:3001/api/admin/products?category=electronics`
- **Search**: `http://localhost:3001/api/admin/products?search=headphones`
- **Active Only**: `http://localhost:3001/api/admin/products?is_active=true`
- **Stock Range**: `http://localhost:3001/api/admin/products?stock_min=10&stock_max=100`

---

## Step 11: Admin - Get Product by ID

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

---

## Step 12: Admin - Update Product

### Request:
- **Method**: `PATCH`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (raw JSON - only include fields to update):
```json
{
  "price": 89.99,
  "stockQuantity": 45,
  "description": "Updated description"
}
```

---

## Step 13: Admin - Update Product Image

### Request:
- **Method**: `PATCH`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID/images/IMAGE_ID`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (raw JSON):
```json
{
  "altText": "Updated alt text",
  "position": 2,
  "isPrimary": false
}
```

---

## Step 14: Admin - Get Product Images

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID/images`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

---

## Step 15: Admin - Delete Product Image

### Request:
- **Method**: `DELETE`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID/images/IMAGE_ID`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

### Expected Response:
```json
{
  "success": true
}
```

---

## Step 16: Admin - Delete Product

### Request:
- **Method**: `DELETE`
- **URL**: `http://localhost:3001/api/admin/products/PRODUCT_ID`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

### Expected Response:
```json
{
  "success": true
}
```

---

## Step 17: Admin - Update Category

### Request:
- **Method**: `PATCH`
- **URL**: `http://localhost:3001/api/admin/categories/CATEGORY_ID`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (raw JSON):
```json
{
  "name": "Updated Category Name",
  "isActive": false
}
```

---

## Step 18: Admin - Delete Category

### Request:
- **Method**: `DELETE`
- **URL**: `http://localhost:3001/api/admin/categories/CATEGORY_ID`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

### Expected Response:
```json
{
  "success": true
}
```

---

## Postman Tips

### 1. Use Environment Variables
Create a Postman Environment with:
- `base_url`: `http://localhost:3001/api`
- `token`: (set after login)

Then use: `{{base_url}}/auth/login` and `{{token}}` in Authorization header

### 2. Set Authorization Automatically
1. After login request, add this to **Tests** tab:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
}
```

2. In other requests, set Authorization to:
   - Type: `Bearer Token`
   - Token: `{{token}}`

### 3. Create a Collection
Organize requests into folders:
- **Auth** (Login)
- **Categories** (Public + Admin)
- **Products** (Public + Admin)
- **Media** (Product Images - Admin)

---

## Common Errors

### 401 Unauthorized
- Token expired or missing
- Check Authorization header: `Bearer YOUR_TOKEN`

### 403 Forbidden
- User role is not `owner` or `admin`
- Verify login response shows `"role": "owner"`

### 404 Not Found
- Check if ID/slug exists
- For public endpoints, ensure `isActive: true`

### 400 Bad Request
- Check validation errors in response body
- Ensure required fields are provided
- Verify data types (e.g., `price` is number, not string)

### 500 Internal Server Error
- Check backend console logs
- Verify database connection
- Check if TypeORM created tables (`synchronize: true`)

---

## Quick Test Checklist

- [ ] Login and get token
- [ ] Create category (admin)
- [ ] Get categories (public)
- [ ] Create product (admin)
- [ ] Add product image (admin)
- [ ] Get products (public)
- [ ] Get product by slug (public)
- [ ] Update product (admin)
- [ ] Update product image (admin)
- [ ] Delete product image (admin)
- [ ] Delete product (admin)

---

## Example Full Flow

1. **Login** → Save token
2. **Create Category** → Save category ID
3. **Create Product** → Use category ID, save product ID
4. **Add Image** → Use product ID
5. **Get Products** (public) → Verify product appears
6. **Get Product by Slug** (public) → Verify details with images
7. **Update Product** → Change price/stock
8. **Verify Update** → Get product again to confirm changes

---

## Step 19: Get Best Sellers (Public)

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/products/best-sellers`
- **Headers**: None required

### Query Parameters:
- `limit` (optional, default: 10) - Number of products to return
- `days` (optional) - Filter by last N days (e.g., 7, 30, 90). If omitted, returns all-time best sellers
- `categoryId` (optional) - Filter by category UUID

### Examples:

**Get top 10 all-time best sellers:**
```
GET http://localhost:3001/api/products/best-sellers?limit=10
```

**Get top 5 best sellers from last 30 days:**
```
GET http://localhost:3001/api/products/best-sellers?limit=5&days=30
```

**Get best sellers in a specific category (last 7 days):**
```
GET http://localhost:3001/api/products/best-sellers?categoryId=CATEGORY_UUID&days=7
```

**Get top 10 best sellers (all-time, no filters):**
```
GET http://localhost:3001/api/products/best-sellers
```

### Expected Response:
```json
[
  {
    "id": "product-uuid",
    "name": "Wireless Headphones",
    "slug": "wireless-headphones",
    "description": "High-quality wireless headphones",
    "price": 99.99,
    "currency": "USD",
    "sku": "WH-001",
    "stockQuantity": 50,
    "isActive": true,
    "soldQuantity": 150,
    "primaryImage": {
      "id": "image-uuid",
      "url": "https://example.com/images/headphones-1.jpg",
      "altText": "Wireless Headphones Front View",
      "isPrimary": true
    },
    "categories": [
      {
        "id": "category-uuid",
        "name": "Electronics",
        "slug": "electronics"
      }
    ]
  }
]
```

### Notes:
- `soldQuantity` is aggregated from `order_items` where the order status is `delivered` OR (`confirmed` + `paymentStatus = 'paid'`)
- **Public endpoint always excludes inactive products** (no way to override)
- Products are sorted by `soldQuantity` descending
- If no sales match the criteria, returns an empty array `[]`
- `soldQuantity` is always a number (defaults to 0 if no sales)
- Products with no images return `primaryImage: null` (no crash)

---

## Step 20: Admin - Get Best Sellers Report

### Request:
- **Method**: `GET`
- **URL**: `http://localhost:3001/api/admin/reports/best-sellers`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`

### Query Parameters:
- `limit` (optional, default: 10) - Number of products to return
- `page` (optional, default: 1) - Page number for pagination
- `days` (optional) - Filter by last N days. **Note:** Ignored if `dateFrom`/`dateTo` are provided (dateFrom/dateTo take priority)
- `dateFrom` (optional) - Start date (ISO format: `2025-01-01T00:00:00Z`). **Priority:** If both `days` and `dateFrom` are provided, `dateFrom`/`dateTo` are used
- `dateTo` (optional) - End date (ISO format: `2025-12-31T23:59:59Z`)
- `categoryId` (optional) - Filter by category UUID
- `includeInactive` (optional, default: false) - Include inactive products

### Examples:

**Get top 20 best sellers (all-time, admin view):**
```
GET http://localhost:3001/api/admin/reports/best-sellers?limit=20
```

**Get best sellers with custom date range (dateFrom/dateTo):**
```
GET http://localhost:3001/api/admin/reports/best-sellers?dateFrom=2025-01-01T00:00:00Z&dateTo=2025-12-31T23:59:59Z&limit=15
```

**Get best sellers from specific month (using dateFrom/dateTo):**
```
GET http://localhost:3001/api/admin/reports/best-sellers?dateFrom=2025-06-01T00:00:00Z&dateTo=2025-06-30T23:59:59Z&limit=10
```

**Get best sellers including inactive products:**
```
GET http://localhost:3001/api/admin/reports/best-sellers?includeInactive=true&limit=10
```

**Paginated results (page 2, 10 per page):**
```
GET http://localhost:3001/api/admin/reports/best-sellers?page=2&limit=10
```

**Date priority example (dateFrom/dateTo override days):**
```
# Even if days=30 is provided, dateFrom/dateTo will be used
GET http://localhost:3001/api/admin/reports/best-sellers?days=30&dateFrom=2025-01-01T00:00:00Z&dateTo=2025-01-31T23:59:59Z
```

### Expected Response:
Same format as public endpoint, but may include inactive products if `includeInactive=true`.

### Notes:
- Admin endpoint allows viewing inactive products (only when `includeInactive=true`)
- Supports pagination with `page` and `limit`
- More flexible date filtering with `dateFrom`/`dateTo` (ISO format)
- **Date filter priority:** If both `days` and `dateFrom`/`dateTo` are provided, `dateFrom`/`dateTo` take precedence (days is ignored)
- Same sales definition: `delivered` OR (`confirmed` + `paid`)


