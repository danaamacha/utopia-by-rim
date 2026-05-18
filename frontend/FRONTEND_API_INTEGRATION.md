# Frontend API Integration Guide

## Overview
Frontend is now integrated with the NestJS backend API. All API calls are centralized and automatically handle authentication tokens.

## API Base URL
- Default: `http://localhost:3002/api`
- Can be overridden with `VITE_API_BASE` environment variable

## File Structure

### Core API Files
- `src/api/api.js` - Centralized API helper with auth token management
- `src/api/auth.js` - Authentication endpoints (login, register, logout)
- `src/api/products.js` - Products & categories endpoints
- `src/api/cart.js` - Cart management endpoints (requires auth)
- `src/api/orders.js` - Orders & checkout endpoints (requires auth)
- `src/api/contact.js` - Contact form submission

### Updated Components
- `src/auth/AuthContext.jsx` - Now uses backend API for login/register
- `src/components/ProtectedRoute.jsx` - Route protection using `isAuthenticated`
- `src/pages/Home.jsx` - Fetches best sellers from API
- `src/pages/Contact.jsx` - Submits contact form to backend
- `src/pages/Shop.jsx` - Fetches products from API

## Usage Examples

### 1. Authentication

```javascript
import { useAuth } from "../auth/AuthContext";

function MyComponent() {
  const { login, logout, isAuthenticated, user } = useAuth();

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password");
      // User is now logged in, token stored automatically
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### 2. Fetching Products

```javascript
import { getProducts, getBestSellers } from "../api/products";

// Get all products
const products = await getProducts();

// Get products with filters
const filtered = await getProducts({
  category: "electronics",
  search: "headphones",
  min_price: 50,
  max_price: 200,
  sort: "price:asc"
});

// Get best sellers
const bestSellers = await getBestSellers({ limit: 10, days: 30 });
```

### 3. Cart Operations (Requires Auth)

```javascript
import { getCart, addToCart, updateCartItem, removeCartItem } from "../api/cart";
import { useAuth } from "../auth/AuthContext";

function CartComponent() {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

  async function loadCart() {
    try {
      const data = await getCart();
      setCart(data);
    } catch (error) {
      console.error("Failed to load cart:", error);
    }
  }

  async function handleAddToCart(productId, quantity = 1) {
    try {
      await addToCart(productId, quantity);
      await loadCart(); // Refresh cart
    } catch (error) {
      alert(error.message || "Failed to add to cart");
    }
  }
}
```

### 4. Checkout (Requires Auth)

```javascript
import { checkout } from "../api/orders";
import { useNavigate } from "react-router-dom";

function CheckoutForm() {
  const navigate = useNavigate();

  const handleCheckout = async (formData) => {
    try {
      const order = await checkout({
        fullName: formData.fullName,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        paymentMethod: "COD" // or "MANUAL"
      });

      // Redirect to order confirmation
      navigate(`/order-confirmation?orderId=${order.id}`);
    } catch (error) {
      alert(error.message || "Checkout failed");
    }
  };
}
```

### 5. Contact Form

```javascript
import { submitContact } from "../api/contact";

async function handleSubmit(formData) {
  try {
    await submitContact({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message
    });
    alert("Message sent successfully!");
  } catch (error) {
    alert(error.message || "Failed to send message");
  }
}
```

## Error Handling

### Automatic 401 Handling
When a 401 Unauthorized response is received:
1. Token is automatically cleared
2. User is logged out
3. `auth:logout` event is dispatched
4. AuthContext listens and updates state

### Manual Error Handling
```javascript
try {
  const data = await getProducts();
} catch (error) {
  // error.message contains the error message from backend
  console.error("API Error:", error.message);
  // Show user-friendly message
  alert(error.message || "Something went wrong");
}
```

## Protected Routes

```javascript
import ProtectedRoute from "../components/ProtectedRoute";

// In App.jsx or router config
<Route
  path="/account/orders"
  element={
    <ProtectedRoute>
      <Orders />
    </ProtectedRoute>
  }
/>
```

## Environment Variables

Create `.env` file in frontend root:
```env
VITE_API_BASE=http://localhost:3002/api
```

## Testing

1. **Start Backend**: `cd backend && npm run start:dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Test Login**: Use `owner@utopiabyrim.com` / `owner123`
4. **Test Products**: Visit `/shop` - products should load from API
5. **Test Cart**: Login, add items, view cart
6. **Test Checkout**: Complete checkout flow

## Notes

- All API calls automatically include `Authorization: Bearer <token>` header when user is authenticated
- Token is stored in `localStorage` with key `auth_token`
- Backend base URL is configurable via environment variable
- Error messages are user-friendly and displayed via alerts (can be upgraded to toast notifications)


