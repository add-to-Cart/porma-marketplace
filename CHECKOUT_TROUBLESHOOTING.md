# Checkout Flow Debugging Guide

## Issue: Checkout page not working, redirecting back to marketplace

## Step-by-Step Troubleshooting

### 1. **Check Backend Server is Running**

```bash
# In a terminal, go to backend folder
cd backend

# Start the server
npm start
```

- You should see: `Server running on port 5000` or similar
- Make sure NO errors appear in the console

### 2. **Check Frontend Server is Running**

```bash
# In another terminal, go to client folder
cd client

# Start the dev server
npm run dev
```

- Should show something like: `VITE ... ready in ... ms`
- No errors in the console

### 3. **Test the Checkout Flow Manually**

#### Step A: Add Product to Cart

1. Go to `http://localhost:5173` (or your frontend URL)
2. Click on any product
3. Click "Add to Cart"
4. You should see a toast notification "Added to cart"
5. You should see a cart icon update in the navbar

#### Step B: Go to Cart Page

1. Click the Cart icon in navbar OR go to `/cart`
2. Verify items are showing with correct quantities and prices
3. You should see "Proceed to Checkout" button at the bottom

#### Step C: Click Proceed to Checkout

1. Click "Proceed to Checkout" button
2. **CRITICAL**: Check browser console (F12 → Console tab)
   - Look for any red error messages
   - Look for the console.log messages we added:
     - `"Submitting order: {..." (should show the order data)
     - Check that `buyerId`, `items`, `subtotal`, etc. are present

#### Step D: Fill Checkout Form

1. Enter following details:
   - **Full Name**: John Doe
   - **Email**: john@example.com (should be pre-filled)
   - **Phone**: 09123456789 (10-11 digits)
   - **Address**: 123 Main Street, Building A
   - **City**: Manila
   - **Province**: Metro Manila
   - **Zip Code**: 1000

2. Select Payment Method:
   - Choose "Cash on Delivery (COD)" for testing

#### Step E: Click "Place Order"

1. You should see button change to "Processing..."
2. **CRITICAL**: Watch the browser console for:
   - Look for POST request to `/orders` in Network tab (F12 → Network)
   - Should show response status 200 (success)
   - You should see console.log: `"Order created: {..." with the order data including `id`
   - You should see green toast: "Order placed successfully! Order #XXXXX"

3. After ~500ms, should be redirected to `/orders` page
4. You should see your order listed!

### 4. **If Checkout Page Doesn't Load**

Check these:

**A. Browser Console Errors (F12 → Console)**

- Look for red error messages
- Check if Checkout component is mounting
- Look for "Cannot read property..." errors

**B. Network Errors (F12 → Network tab)**

- Filter by "Fetch/XHR"
- Look for any failed requests with red X
- Check /orders endpoint response

**C. Router Issue**

- Make sure `/checkout` route exists in AppRoutes.jsx
- Verify it's inside MarketPlaceLayout
- Test by manually typing: `http://localhost:5173/checkout` in URL bar

### 5. **If Form Doesn't Submit**

**A. Form Validation Issues**

- Make sure all required fields are filled:
  - fullName ✓
  - phone ✓ (must be 10-11 digits)
  - address ✓
  - city ✓
  - province ✓
- Phone number validation: Must have 10-11 numeric digits
  - ✓ 09123456789
  - ✓ 09-123-456789
  - ✗ 091234567 (too short)

**B. Button Disabled**

- Check if button is in disabled state
- Click it should show toast error with the validation message

### 6. **If Redirect Back to Marketplace Happens**

**Possible Causes:**

1. **Empty Cart After Clearance**
   - The `if (orderItems.length === 0)` check redirects to cart
   - Should not happen if we cleared cart after successful order
2. **User Not Authenticated**
   - Check if user is still logged in
   - Verify `user` object exists in browser DevTools: Console → `user` (should show object, not null)
3. **API Error Not Being Caught**
   - Check Network tab for failed requests
   - Check response body for error message

### 7. **Debug Commands in Browser Console**

```javascript
// Check if user is logged in
// In your app's main page, open console and type:
console.log("User:", localStorage.getItem("user")); // or however auth is stored

// Check cart contents
// Look for any cart context logging

// Check if navigation worked
// Type: window.location.pathname
// Should show: /orders (or /checkout, /cart, etc.)
```

## What Each File Does

| File                 | Purpose                                 |
| -------------------- | --------------------------------------- |
| `Cart.jsx`           | Shows cart items, navigate to checkout  |
| `Checkout.jsx`       | Form for address, payment, order review |
| `OrdersPage.jsx`     | Shows user's placed orders              |
| `orderRoutes.js`     | API endpoints (/orders POST, GET, etc.) |
| `orderController.js` | Backend logic for creating orders       |

## Expected API Flow

```
Frontend: POST /api/orders
  ↓
Backend: orderController.createOrder()
  ↓
Save to Firestore
  ↓
Return: { id: "xxx", ...order }
  ↓
Frontend: Clear cart, navigate to /orders
  ↓
OrdersPage: Fetch user's orders, display
```

## Common Issues & Solutions

| Issue                    | Solution                                             |
| ------------------------ | ---------------------------------------------------- |
| Blank checkout page      | Check browser console for errors                     |
| Form not submitting      | Validate all required fields are filled              |
| "Invalid date" in orders | Backend is now serializing dates properly            |
| Stuck on "Processing..." | Check Network tab for hanging requests               |
| Can't see placed orders  | Make sure /orders page fetches using correct buyerId |

## Testing Checklist

- [ ] Backend npm start runs without errors
- [ ] Frontend npm run dev runs without errors
- [ ] Can add products to cart
- [ ] Cart page shows items correctly
- [ ] "Proceed to Checkout" button is visible and clickable
- [ ] Checkout page loads with form
- [ ] Can fill all form fields
- [ ] Can select payment method
- [ ] Order summary shows correct totals
- [ ] "Place Order" button can be clicked
- [ ] Form validates (try empty, try invalid phone)
- [ ] After successful submission, redirect to /orders
- [ ] New order appears in orders page
- [ ] Order details show address, payment method, items

## Still Having Issues?

1. Check the browser console (F12)
2. Check the backend server logs
3. Look at Network tab for API responses
4. Verify Firestore is accessible
5. Check if Firebase rules allow writing to orders collection
