import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const serializeProducts = await AsyncStorage.getItem('@GoMarketplace');

      if (serializeProducts) {
        console.log('load products -> ', JSON.parse(serializeProducts));
        setProducts(JSON.parse(serializeProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(prod => prod.id === product.id);

      if (!productExists) {
        const newProducts = [...products, { ...product, quantity: 1 }];

        await AsyncStorage.setItem(
          '@GoMarketplace',
          JSON.stringify(newProducts),
        );
        return setProducts(newProducts);
      }

      const newProducts = products.map(prod => {
        if (prod.id !== product.id) return prod;

        return { ...prod, quantity: prod.quantity + 1 };
      });

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(newProducts));

      return setProducts(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id !== id) return product;

        return { ...product, quantity: product.quantity + 1 };
      });

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(newProducts));

      return setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findedProduct = products.find(product => product.id === id);

      let newProducts;

      if (findedProduct?.quantity === 1) {
        newProducts = products.filter(product => product.id !== id);
      } else {
        newProducts = products.map(product => {
          if (product.id !== id) return product;

          return { ...product, quantity: product.quantity - 1 };
        });
      }

      await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(newProducts));

      return setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
