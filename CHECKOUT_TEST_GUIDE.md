# Complete Checkout & Orders Flow Setup Guide

## What Was Implemented

A complete e-commerce checkout experience like Shopee/Lazada with:

1. ✅ **Cart Page** - View items, adjust quantities
2. ✅ **Checkout Page** - Complete order form with:
   - Delivery address (Full Name, Phone, Email, Address, City, Province, Zip)
   - Payment method selection (COD, Bank Transfer, GCash)
   - Order summary with items and totals
   - Form validation
3. ✅ **Orders Page** - View all placed orders with:
   - Order details and status
   - Delivery tracking
   - Item information
   - Payment method display
   - Delivery address shown

---

## How to Test (Step by Step)

### **STEP 1: Start Both Servers**

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

Expected output:

```
Server running on port 5000
Connected to Firestore
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

Expected output:

```
VITE v... ready in ... ms
➜  Local:   http://localhost:5173/
```

---

### **STEP 2: Add Product to Cart**

1. Open browser: `http://localhost:5173`
2. Click on any product card
3. Click "Add to Cart" button
4. See green toast: "Added to cart"
5. Verify cart badge updates in navbar

---

### **STEP 3: Go to Cart Page**

**Method A:** Click cart icon in navbar
**Method B:** Go to `http://localhost:5173/cart`

You should see:

- ✓ Product image
- ✓ Product name
- ✓ Quantity controls (+/-)
- ✓ Price per item
- ✓ Subtotal
- ✓ Delivery fee (shows "FREE" if over ₱1,000)
- ✓ **Total amount**
- ✓ Authentication status message
- ✓ **"Proceed to Checkout" button**

---

### **STEP 4: Click "Proceed to Checkout"**

1. Click the blue "Proceed to Checkout" button
2. **Browser should navigate to `/checkout`**
3. You should see:
   - "Checkout" page header
   - "Complete your order" subtitle
   - **LEFT SIDE**: Order form
   - **RIGHT SIDE**: Order summary

---

### **STEP 5: Fill Out the Checkout Form**

#### **Delivery Information Section:**

| Field     | Example Value           | Notes                          |
| --------- | ----------------------- | ------------------------------ |
| Full Name | Juan Dela Cruz          | Required                       |
| Email     | juan@example.com        | Pre-filled, Required           |
| Phone     | 09123456789             | Must be 10-11 digits, Required |
| Address   | 123 Main St, Building A | Required                       |
| City      | Manila                  | Required                       |
| Province  | Metro Manila            | Required                       |
| Zip Code  | 1000                    | Optional                       |

#### **Payment Method Section:**

Select ONE:

- [ ] **Cash on Delivery (COD)** ← Choose this for testing
- [ ] Bank Transfer (requires QR upload later)
- [ ] GCash (requires QR upload later)

---

### **STEP 6: Verify Order Summary (Right Side)**

You should see:

- ✓ Order items preview (expandable)
- ✓ Item count
- ✓ Each item with: image, name, quantity, price
- ✓ Subtotal
- ✓ Delivery fee (or "FREE")
- ✓ **Total amount** (large, blue, prominent)
- ✓ Estimated delivery time
- ✓ "Edit Cart" button

---

### **STEP 7: Click "Place Order"**

1. Scroll down to see the blue "Place Order" button
2. Click it
3. **WATCH CAREFULLY:**
   - Button should change to "Processing..."
   - Don't click again!
   - Wait 2-3 seconds

---

### **STEP 8: After Order Placed**

You should see:

1. ✓ Green toast: "Order placed successfully! Order #XXXXX"
2. ✓ Page redirects to `/orders`
3. ✓ OrdersPage loads with your new order

---

## What Should Appear in Orders Page

Your placed order should show:

**Order Card Header (collapsed):**

- Order ID: `#XXXXXXXX`
- Date: `Jan 24, 2026`
- Status badge: "Pending" (yellow)
- Total: `₱X,XXX`

**Order Details (click to expand):**

### Delivery Progress

- Processing → Packed → Shipped → Out for Delivery → Delivered

### Items Ordered

- Product image
- Product name
- Quantity and unit price
- Total for that item

### Price Breakdown

- Subtotal: `₱X,XXX`
- Delivery Fee: `₱XXX` or `FREE`
- **Total: ₱X,XXX**

### Payment Method

- Shows: "Cash on Delivery (COD)"
- (No QR section needed for COD)

### Delivery Address

- Full Name
- Phone
- Email
- Complete Address
- City, Province, Zip

---

## Troubleshooting

### **"Proceed to Checkout" button doesn't work**

**Check #1:** Are you logged in?

- Look for "Welcome back, [name]" message
- If not, click login first

**Check #2:** Does your cart have items?

- Cart must not be empty
- Button should be enabled (not grayed out)

**Check #3:** Browser console errors?

- Press F12
- Go to Console tab
- Look for red error messages
- Screenshot and share them

---

### **Checkout page shows "Your cart is empty"**

**Cause:** Cart was cleared or not syncing

**Fix:**

1. Go back to cart: `/cart`
2. Add a product again
3. Click "Proceed to Checkout" again

---

### **Can't fill out the form / form won't submit**

**Check #1:** Are all required fields filled?

- Red asterisks show required fields
- Phone must be 10-11 digits

**Check #2:** Validation errors?

- Wait for toast message
- It will tell you what's wrong

**Check #3:** Network issue?

- Open F12 → Network tab
- Look for requests to `POST /orders`
- Check if response shows 200 or error

---

### **After clicking "Place Order", nothing happens**

**Check #1:** Look at Network tab (F12)

- Wait for the POST /orders request to complete
- Check response status (should be 200)
- Check response body for errors

**Check #2:** Check Console tab

- Look for: `console.log("Submitting order:...`
- Look for: `console.log("Order created:...`
- Look for any red error messages

**Check #3:** Check if page is stuck

- Try waiting 5 seconds
- Try refreshing (F5)
- Check if you're logged in

---

### **Got redirected back to marketplace**

**Possible Causes:**

1. Cart was empty (should show message though)
2. Not logged in (should redirect to login)
3. Order creation failed (check console for error)
4. Firestore rules rejecting write (check Firebase console)

**Debug:**

1. Open browser console (F12)
2. Look for error messages
3. Check Network tab for failed requests
4. Check backend server logs for errors

---

### **Can see orders page but no orders showing**

**Check #1:** Are orders being fetched?

- Page should show "Loading your orders..." briefly
- Then show list of orders
- If blank with "No orders yet" message → orders not saved

**Check #2:** Firestore data?

- Go to Firebase Console
- Navigate to Firestore Database
- Check "orders" collection
- Should see documents with your buyerId

---

## File Structure Reference

```
✓ client/src/pages/Checkout.jsx       ← Checkout form page
✓ client/src/pages/Cart.jsx            ← Cart page
✓ client/src/pages/OrdersPage.jsx      ← Orders listing & details
✓ client/src/api/orders.js             ← API calls
✓ client/src/AppRoutes.jsx             ← Route definitions
✓ backend/controllers/orderController.js   ← Order creation logic
✓ backend/routes/orderRoutes.js        ← API endpoints
```

---

## Quick Test Checklist

Use this to verify everything works:

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can add product to cart
- [ ] Cart page shows all items correctly
- [ ] "Proceed to Checkout" button is visible
- [ ] Can navigate to checkout page
- [ ] Checkout form displays correctly
- [ ] Can fill all form fields
- [ ] Can select payment method
- [ ] Order summary shows correct total
- [ ] Form validation works (try leaving fields empty)
- [ ] Phone number validation works (try 8 digits)
- [ ] Can click "Place Order"
- [ ] Order submits successfully
- [ ] Redirected to /orders page
- [ ] New order appears in list
- [ ] Order shows delivery address
- [ ] Order shows payment method
- [ ] Order shows items with correct prices
- [ ] Date displays correctly (no "Invalid date")

---

## Expected Final Result

**Cart → Checkout → Orders Flow Works Like:**

1. ✅ Add product(s) to cart from marketplace
2. ✅ Click "Proceed to Checkout"
3. ✅ Fill delivery address form
4. ✅ Select payment method
5. ✅ Review order summary
6. ✅ Click "Place Order"
7. ✅ See success message
8. ✅ Redirected to Orders page
9. ✅ See newly placed order with all details
10. ✅ Can expand order to see full details

---

## Need Help?

1. Check the browser console (F12 → Console) for error messages
2. Check the Network tab (F12 → Network) for failed API calls
3. Check backend server logs for errors
4. Verify Firebase/Firestore is working:
   - Go to Firebase Console
   - Check if database is accessible
   - Check collection rules

---

**Last Updated:** January 24, 2026
