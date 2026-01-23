import { createContext, useContext, useState, useCallback } from "react";

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);

  const selectProductForEdit = useCallback((product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProduct(null);
    setShowProductForm(false);
  }, []);

  const addProductToList = useCallback((product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const updateProductInList = useCallback((productId, updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProduct : p)),
    );
  }, []);

  const value = {
    selectedProduct,
    setSelectedProduct,
    selectProductForEdit,
    clearSelection,
    products,
    setProducts,
    addProductToList,
    updateProductInList,
    showProductForm,
    setShowProductForm,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductContext must be used within ProductProvider");
  }
  return context;
}
