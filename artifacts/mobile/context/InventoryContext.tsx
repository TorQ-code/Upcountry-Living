import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ItemStatus = "In Stock" | "Listed" | "Sold";
export type ItemCondition = "Excellent" | "Good" | "Fair";
export type ItemCategory =
  | "Furniture"
  | "Decor"
  | "Lighting"
  | "Textiles"
  | "Art"
  | "Kitchen"
  | "Outdoor"
  | "Other";

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  purchasePrice: number;
  askingPrice: number;
  notes: string;
  status: ItemStatus;
  salePrice: number | null;
  photo: string | null;
  dateAdded: string;
  dateSold: string | null;
}

interface InventoryContextValue {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, patch: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => InventoryItem | undefined;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

const STORAGE_KEY = "ucl_inventory_v2";

function ago(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const SEED: InventoryItem[] = [
  {
    id: makeId(),
    name: 'Lodge Cast Iron Skillet, 10"',
    category: "Kitchen",
    condition: "Good",
    purchasePrice: 8,
    askingPrice: 38,
    status: "Sold",
    salePrice: 35,
    photo: null,
    notes: "Seasoned perfectly.",
    dateAdded: ago(45),
    dateSold: ago(12),
  },
  {
    id: makeId(),
    name: "Feedsack Patchwork Quilt",
    category: "Textiles",
    condition: "Good",
    purchasePrice: 22,
    askingPrice: 95,
    status: "Listed",
    salePrice: null,
    photo: null,
    notes: "Hand-stitched.",
    dateAdded: ago(30),
    dateSold: null,
  },
  {
    id: makeId(),
    name: "Milk Glass Hobnail Vase",
    category: "Decor",
    condition: "Excellent",
    purchasePrice: 4,
    askingPrice: 24,
    status: "Sold",
    salePrice: 22,
    photo: null,
    notes: "No chips.",
    dateAdded: ago(60),
    dateSold: ago(5),
  },
  {
    id: makeId(),
    name: "Barn Wood Frame, 8x10",
    category: "Decor",
    condition: "Good",
    purchasePrice: 6,
    askingPrice: 28,
    status: "In Stock",
    salePrice: null,
    photo: null,
    notes: "Reclaimed wood.",
    dateAdded: ago(10),
    dateSold: null,
  },
  {
    id: makeId(),
    name: "Enamelware Colander",
    category: "Kitchen",
    condition: "Excellent",
    purchasePrice: 12,
    askingPrice: 42,
    status: "Listed",
    salePrice: null,
    photo: null,
    notes: "Red speckle, no chips.",
    dateAdded: ago(20),
    dateSold: null,
  },
  {
    id: makeId(),
    name: "Brass Oil Lamp",
    category: "Lighting",
    condition: "Good",
    purchasePrice: 15,
    askingPrice: 55,
    status: "Sold",
    salePrice: 50,
    photo: null,
    notes: "Chimney intact.",
    dateAdded: ago(90),
    dateSold: ago(22),
  },
  {
    id: makeId(),
    name: "Blue Painted Step Stool",
    category: "Furniture",
    condition: "Fair",
    purchasePrice: 18,
    askingPrice: 65,
    status: "In Stock",
    salePrice: null,
    photo: null,
    notes: "Aged patina.",
    dateAdded: ago(15),
    dateSold: null,
  },
  {
    id: makeId(),
    name: "Salt Glaze Butter Crock",
    category: "Kitchen",
    condition: "Excellent",
    purchasePrice: 9,
    askingPrice: 34,
    status: "Sold",
    salePrice: 34,
    photo: null,
    notes: "Blue glaze, lid fits.",
    dateAdded: ago(55),
    dateSold: ago(3),
  },
  {
    id: makeId(),
    name: "Grain Sack Table Runner",
    category: "Textiles",
    condition: "Good",
    purchasePrice: 7,
    askingPrice: 32,
    status: "Listed",
    salePrice: null,
    photo: null,
    notes: "Original stripes.",
    dateAdded: ago(25),
    dateSold: null,
  },
  {
    id: makeId(),
    name: "Mason Jar Collection (6)",
    category: "Decor",
    condition: "Good",
    purchasePrice: 5,
    askingPrice: 22,
    status: "Sold",
    salePrice: 20,
    photo: null,
    notes: "Ball and Atlas mix.",
    dateAdded: ago(70),
    dateSold: ago(40),
  },
  {
    id: makeId(),
    name: "Wrought Iron Candle Holder",
    category: "Decor",
    condition: "Excellent",
    purchasePrice: 11,
    askingPrice: 38,
    status: "Listed",
    salePrice: null,
    photo: null,
    notes: "Scrollwork detail.",
    dateAdded: ago(8),
    dateSold: null,
  },
  {
    id: makeId(),
    name: "Galvanized Watering Can",
    category: "Outdoor",
    condition: "Good",
    purchasePrice: 14,
    askingPrice: 48,
    status: "In Stock",
    salePrice: null,
    photo: null,
    notes: "No leaks.",
    dateAdded: ago(35),
    dateSold: null,
  },
];

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setItems(JSON.parse(raw));
        } catch {
          setItems(SEED);
        }
      } else {
        setItems(SEED);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      }
    });
  }, []);

  const persist = useCallback((next: InventoryItem[]) => {
    setItems(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (item: InventoryItem) => {
      setItems((prev) => {
        const next = [item, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<InventoryItem>) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const getItem = useCallback(
    (id: string) => items.find((i) => i.id === id),
    [items]
  );

  return (
    <InventoryContext.Provider
      value={{ items, addItem, updateItem, deleteItem, getItem }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}

export function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function fmt$(n: number | null): string {
  if (n == null) return "—";
  return "$" + parseFloat(n.toString()).toFixed(2);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export const CATEGORIES: ItemCategory[] = [
  "Furniture",
  "Decor",
  "Lighting",
  "Textiles",
  "Art",
  "Kitchen",
  "Outdoor",
  "Other",
];

export const CONDITIONS: ItemCondition[] = ["Excellent", "Good", "Fair"];
