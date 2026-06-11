# API Testing Guide

## Prerequisites
- Backend running on `http://localhost:3001`
- All routes are under `/api` prefix

## Step 1: Login to Get JWT Token

**Default Owner Credentials:**
- Email: `owner@utopiabyrim.com`
- Password: `owner123`

### PowerShell (Windows):
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"owner@utopiabyrim.com","password":"owner123"}'
$token = $response.token
Write-Host "Token: $token"
```

### cURL:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@utopiabyrim.com\",\"password\":\"owner123\"}"
```

**Save the `token` value from the response!**

---

## Step 2: Create a Category (Admin)

### PowerShell:
```powershell
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$body = @{
    name = "Electronics"
    slug = "electronics"
    description = "Electronic products"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/categories" -Method POST -Headers $headers -Body $body
```

### cURL:
```bash
curl -X POST http://localhost:3001/api/admin/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Electronics\",\"slug\":\"electronics\",\"description\":\"Electronic products\",\"isActive\":true}"
```

**Save the category `id` from the response!**

---

## Step 3: Create Another Category (Optional)

```powershell
$body = @{
    name = "Clothing"
    slug = "clothing"
    description = "Clothing and apparel"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/categories" -Method POST -Headers $headers -Body $body
```

---

## Step 4: Create a Product (Admin)

### PowerShell:
```powershell
$body = @{
    name = "Wireless Headphones"
    slug = "wireless-headphones"
    description = "High-quality wireless headphones"
    price = 99.99
    currency = "USD"
    sku = "WH-001"
    stockQuantity = 50
    isActive = $true
    categoryIds = @("CATEGORY_ID_FROM_STEP_2")
} | ConvertTo-Json

$product = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/products" -Method POST -Headers $headers -Body $body
Write-Host "Product ID: $($product.id)"
```

### cURL:
```bash
curl -X POST http://localhost:3001/api/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Wireless Headphones\",\"slug\":\"wireless-headphones\",\"description\":\"High-quality wireless headphones\",\"price\":99.99,\"currency\":\"USD\",\"sku\":\"WH-001\",\"stockQuantity\":50,\"isActive\":true,\"categoryIds\":[\"CATEGORY_ID_HERE\"]}"
```

**Save the product `id` from the response!**

---

## Step 5: Add Product Images (Admin)

### PowerShell:
```powershell
$productId = "PRODUCT_ID_FROM_STEP_4"

# Add first image (primary)
$body1 = @{
    url = "https://example.com/images/headphones-1.jpg"
    altText = "Wireless Headphones Front View"
    position = 0
    isPrimary = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/products/$productId/images" -Method POST -Headers $headers -Body $body1

# Add second image
$body2 = @{
    url = "https://example.com/images/headphones-2.jpg"
    altText = "Wireless Headphones Side View"
    position = 1
    isPrimary = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/products/$productId/images" -Method POST -Headers $headers -Body $body2
```

### cURL:
```bash
curl -X POST http://localhost:3001/api/admin/products/PRODUCT_ID/images \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com/images/headphones-1.jpg\",\"altText\":\"Wireless Headphones Front View\",\"position\":0,\"isPrimary\":true}"
```

---

## Step 6: Test Public Endpoints (No Auth Required)

### Get All Categories:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/categories" -Method GET
```

### Get All Products:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/products" -Method GET
```

### Get Product by Slug:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/products/wireless-headphones" -Method GET
```

### Get Products with Filters:
```powershell
# Filter by category
Invoke-RestMethod -Uri "http://localhost:3001/api/products?category=electronics" -Method GET

# Search products
Invoke-RestMethod -Uri "http://localhost:3001/api/products?search=headphones" -Method GET

# Price range
Invoke-RestMethod -Uri "http://localhost:3001/api/products?min_price=50&max_price=150" -Method GET

# Sort by price
Invoke-RestMethod -Uri "http://localhost:3001/api/products?sort=price:asc" -Method GET
```

---

## Step 7: Test Admin Endpoints

### Get All Admin Categories:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/categories" -Method GET -Headers $headers
```

### Get All Admin Products:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/products" -Method GET -Headers $headers
```

### Get Product Images:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/products/$productId/images" -Method GET -Headers $headers
```

### Update Product:
```powershell
$body = @{
    price = 89.99
    stockQuantity = 45
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/admin/products/$productId" -Method PATCH -Headers $headers -Body $body
```

---

## Expected Responses

### Login Response:
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

### Category Response:
```json
{
  "id": "uuid-here",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products",
  "isActive": true,
  "position": 0,
  "createdAt": "2025-12-22T...",
  "updatedAt": "2025-12-22T..."
}
```

### Product Response:
```json
{
  "id": "uuid-here",
  "name": "Wireless Headphones",
  "slug": "wireless-headphones",
  "description": "High-quality wireless headphones",
  "price": "99.99",
  "currency": "USD",
  "sku": "WH-001",
  "stockQuantity": 50,
  "isActive": true,
  "categories": [...],
  "images": [...],
  "createdAt": "2025-12-22T...",
  "updatedAt": "2025-12-22T..."
}
```

---

## Troubleshooting

### 401 Unauthorized:
- Check if token is valid and not expired
- Ensure `Authorization: Bearer TOKEN` header is included

### 403 Forbidden:
- Ensure user role is `owner` or `admin`
- Check if `RolesGuard` is applied correctly

### 404 Not Found:
- Verify the ID/slug exists in database
- Check if `isActive` is true for public endpoints

### 400 Bad Request:
- Check DTO validation errors in response
- Ensure required fields are provided
- Verify data types match (e.g., `price` is number, not string)

