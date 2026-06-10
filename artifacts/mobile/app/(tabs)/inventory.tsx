import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ItemDetailSheet from "@/components/ItemDetailSheet";
import PostConfirmSheet from "@/components/PostConfirmSheet";
import {
  fmt$,
  CATEGORIES,
  InventoryItem,
  ItemCategory,
  ItemStatus,
  useInventory,
} from "@/context/InventoryContext";
import { useColors } from "@/hooks/useColors";

type SortKey = "date-desc" | "date-asc" | "price-desc" | "margin-desc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Newest", value: "date-desc" },
  { label: "Oldest", value: "date-asc" },
  { label: "Price ↓", value: "price-desc" },
  { label: "Best Margin", value: "margin-desc" },
];

const CAT_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Furniture: "airplay",
  Decor: "feather",
  Lighting: "zap",
  Textiles: "layers",
  Art: "image",
  Kitchen: "coffee",
  Outdoor: "sun",
  Other: "box",
};

function Badge({ status, colors }: { status: ItemStatus; colors: ReturnType<typeof useColors> }) {
  let bg = colors.surface;
  let color = colors.mutedForeground;
  if (status === "Listed") { bg = colors.accentBg; color = colors.accent; }
  else if (status === "Sold") { bg = colors.greenBg; color = colors.green; }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Inter_600SemiBold" }}>
        {status}
      </Text>
    </View>
  );
}

function ItemRow({ item, onPress, colors }: { item: InventoryItem; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  const icon = CAT_ICONS[item.category] ?? "box";
  return (
    <TouchableOpacity style={[rs.row, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[rs.thumb, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <Feather name={icon} size={22} color={colors.borderDk} />
        )}
      </View>
      <View style={rs.info}>
        <Text style={[rs.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[rs.sub, { color: colors.mutedForeground }]}>{item.category} · {item.condition}</Text>
      </View>
      <View style={rs.right}>
        <Text style={[rs.price, { color: colors.text }]}>{fmt$(item.askingPrice)}</Text>
        <Badge status={item.status} colors={colors} />
      </View>
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 72 },
  thumb: { width: 52, height: 52, borderRadius: 3, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: "500", fontFamily: "Inter_500Medium", marginBottom: 3 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  price: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items } = useInventory();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ItemCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [postItem, setPostItem] = useState<InventoryItem | null>(null);
  const [postVisible, setPostVisible] = useState(false);

  const filtered = useMemo(() => {
    let result = [...items];
    const q = search.toLowerCase().trim();
    if (q) result = result.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    if (catFilter) result = result.filter((i) => i.category === catFilter);
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    result.sort((a, b) => {
      if (sort === "date-desc") return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      if (sort === "date-asc") return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      if (sort === "price-desc") return b.askingPrice - a.askingPrice;
      if (sort === "margin-desc") return (b.askingPrice - b.purchasePrice) - (a.askingPrice - a.purchasePrice);
      return 0;
    });
    return result;
  }, [items, search, catFilter, statusFilter, sort]);

  const selectedItem = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const c = colors;
  const s = styles(c);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => setShowFilters((v) => !v)} style={s.filterBtn}>
          <Feather name="sliders" size={18} color={showFilters ? c.accent : c.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { borderBottomColor: c.border }]}>
        <Feather name="search" size={16} color={c.mutedForeground} style={{ marginLeft: 12 }} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search items…"
          placeholderTextColor={c.mutedForeground}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={[s.filtersPanel, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
          <Text style={[s.filterSectionLabel, { color: c.mutedForeground }]}>Category</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={["", ...CATEGORIES] as (ItemCategory | "")[]}
            keyExtractor={(item) => item}
            style={{ marginBottom: 10 }}
            renderItem={({ item: cat }) => {
              const active = catFilter === cat;
              return (
                <TouchableOpacity
                  onPress={() => setCatFilter(cat)}
                  style={[s.pill, { backgroundColor: active ? c.accent : c.card, borderColor: active ? c.accent : c.borderDk }]}
                >
                  <Text style={[s.pillText, { color: active ? "#fff" : c.mid }]}>{cat || "All"}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <Text style={[s.filterSectionLabel, { color: c.mutedForeground }]}>Status</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {(["", "In Stock", "Listed", "Sold"] as (ItemStatus | "")[]).map((st) => {
              const active = statusFilter === st;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setStatusFilter(st)}
                  style={[s.pill, { backgroundColor: active ? c.accent : c.card, borderColor: active ? c.accent : c.borderDk }]}
                >
                  <Text style={[s.pillText, { color: active ? "#fff" : c.mid }]}>{st || "All"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[s.filterSectionLabel, { color: c.mutedForeground }]}>Sort</Text>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
            {SORT_OPTIONS.map((opt) => {
              const active = sort === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  style={[s.pill, { backgroundColor: active ? c.accent : c.card, borderColor: active ? c.accent : c.borderDk }]}
                >
                  <Text style={[s.pillText, { color: active ? "#fff" : c.mid }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Count */}
      <View style={s.countRow}>
        <Text style={[s.countText, { color: c.mutedForeground }]}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Feather name="box" size={40} color={c.borderDk} />
          <Text style={[s.emptyText, { color: c.mutedForeground }]}>
            {items.length === 0 ? "Add your first item in Capture." : "No items match your filters."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View>
              {index > 0 && <View style={{ height: 1, backgroundColor: c.border }} />}
              <ItemRow item={item} onPress={() => setSelectedId(item.id)} colors={colors} />
            </View>
          )}
          style={s.list}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 }}
          scrollEnabled={!!filtered.length}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ItemDetailSheet
        item={selectedItem}
        visible={!!selectedId}
        onClose={() => setSelectedId(null)}
        onPostToSite={(item) => { setPostItem(item); setPostVisible(true); }}
      />
      <PostConfirmSheet
        item={postItem}
        visible={postVisible}
        onClose={() => setPostVisible(false)}
        onConfirm={() => setPostVisible(false)}
      />
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.borderDk,
      backgroundColor: c.headerBg,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 2,
      textTransform: "uppercase",
      color: c.text,
    },
    filterBtn: { padding: 6 },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      backgroundColor: c.card,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      fontSize: 15,
      color: c.text,
      fontFamily: "Inter_400Regular",
    },
    filtersPanel: {
      padding: 14,
      borderBottomWidth: 1,
    },
    filterSectionLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontFamily: "Inter_500Medium",
      marginBottom: 6,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
    },
    pillText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    countRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    countText: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontFamily: "Inter_500Medium",
    },
    list: { flex: 1 },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 14,
      textAlign: "center",
      fontFamily: "Inter_400Regular",
    },
  });
