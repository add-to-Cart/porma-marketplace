import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cart from Firestore when user logs in
  useEffect(() => {
    if (user?.uid) {
      loadCartFromFirestore();
    } else {
      // Load from localStorage for guests
      loadCartFromLocalStorage();
    }
  }, [user?.uid]);

  // Save to Firestore whenever cart changes (for logged-in users)
  useEffect(() => {
    if (user?.uid && cart.length >= 0) {
      saveCartToFirestore();
    } else if (!user) {
      // Save to localStorage for guests
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, user?.uid]);

  const loadCartFromFirestore = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`http://localhost:3000/cart/${user.uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cart) {
          setCart(data.cart.items || []);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from Firestore:", error);
      loadCartFromLocalStorage(); // Fallback to localStorage
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      setCart([]);
    }
  };

  const saveCartToFirestore = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token || !user?.uid) return;

      await fetch(`http://localhost:3000/cart/${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: cart }),
      });
    } catch (error) {
      console.error("Failed to save cart to Firestore:", error);
    }
  };

  const addToCart = (product) => {
    const productWithNumericPrice = {
      ...product,
      basePrice: Number(product.basePrice) || 0,
    };
    const quantityToAdd = product.quantity || 1;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item,
        );
      }
      return [...prev, { ...productWithNumericPrice, quantity: quantityToAdd }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id);
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => {
    const basePrice = Number(item.basePrice) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + basePrice * quantity;
  }, 0);

  const deliveryFee = subtotal > 1000 ? 0 : 150;
  const total = subtotal + deliveryFee;
  const itemCount = cart.reduce(
    (count, item) => count + (Number(item.quantity) || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
