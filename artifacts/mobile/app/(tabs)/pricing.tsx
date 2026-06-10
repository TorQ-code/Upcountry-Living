import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { fmt$ } from "@/context/InventoryContext";
import { useColors } from "@/hooks/useColors";
import { compDates, getComps } from "@/constants/comps";

const PLATS = ["eBay", "eBay", "Etsy", "eBay", "Facebook Mkt"];
const DATES = compDates();

interface PriceResult {
  comps: { p: number; c: string }[];
  low: number;
  mid: number;
  high: number;
}

export default function PricingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PriceResult | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleUsePrice = useCallback((mid: number) => {
    router.push({
      pathname: "/(tabs)",
      params: { prefillAskPrice: String(mid), prefillKey: String(Date.now()) },
    });
  }, [router]);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    const comps = getComps(q);
    const sorted = [...comps].sort((a, b) => a.p - b.p);
    const low = sorted[0]?.p ?? 0;
    const high = sorted[sorted.length - 1]?.p ?? 0;
    const mid = Math.round(comps.reduce((s, c) => s + c.p, 0) / comps.length);
    setResult({ comps, low, mid, high });
    inputRef.current?.blur();
  };

  const c = colors;
  const s = styles(c);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[s.container, { paddingTop: topPad }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>Pricing Tool</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[s.subtitle, { color: c.mutedForeground }]}>
          Research what similar items sell for
        </Text>

        <View style={[s.card]}>
          <View style={s.searchRow}>
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. cast iron skillet, milk glass vase…"
              placeholderTextColor={c.mutedForeground}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={s.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
              <Feather name="search" size={16} color="#fff" />
              <Text style={s.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          {!result && (
            <View style={s.emptyState}>
              <Feather name="tag" size={32} color={c.borderDk} />
              <Text style={[s.emptyText, { color: c.mutedForeground }]}>
                Search for an item to see recent sold prices.
              </Text>
            </View>
          )}

          {result && (
            <>
              {/* Price Range */}
              <View style={[s.rangeGrid, { backgroundColor: c.border }]}>
                {[
                  { label: "Low", value: "$" + result.low },
                  { label: "Mid (Best)", value: "$" + result.mid, highlight: true },
                  { label: "High", value: "$" + result.high },
                ].map((cell) => (
                  <View key={cell.label} style={[s.rangeCell, { backgroundColor: c.card }]}>
                    <Text style={[s.rangeLbl, { color: c.mutedForeground }]}>{cell.label}</Text>
                    <Text style={[s.rangeVal, { color: cell.highlight ? c.accent : c.text }]}>
                      {cell.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Results Table */}
              <View style={[s.table, { borderColor: c.border }]}>
                <View style={[s.tableHead, { backgroundColor: c.surface }]}>
                  {["Item", "Date", "Cond.", "Platform", "Price"].map((h) => (
                    <Text key={h} style={[s.th, { color: c.mutedForeground }]}>{h}</Text>
                  ))}
                </View>
                {result.comps.map((comp, i) => (
                  <View
                    key={i}
                    style={[s.tableRow, { borderBottomColor: c.border }, i === result.comps.length - 1 ? { borderBottomWidth: 0 } : {}]}
                  >
                    <Text style={[s.td, { flex: 2, color: c.mid }]} numberOfLines={1}>
                      {query.charAt(0).toUpperCase() + query.slice(1)}
                    </Text>
                    <Text style={[s.td, { color: c.mutedForeground }]}>{DATES[i]}</Text>
                    <Text style={[s.td, { color: c.mutedForeground }]}>{comp.c}</Text>
                    <Text style={[s.td, { color: c.mutedForeground }]}>{PLATS[i % PLATS.length]}</Text>
                    <Text style={[s.td, { color: c.text, fontFamily: "Inter_500Medium" }]}>
                      {fmt$(comp.p)}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[s.useBtn, { backgroundColor: c.accent }]}
                onPress={() => handleUsePrice(result.mid)}
                activeOpacity={0.85}
              >
                <Feather name="arrow-left" size={14} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.useBtnText}>Use Mid Price in Capture — ${result.mid}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
      color: c.text,
    },
    scroll: { flex: 1 },
    content: { padding: 16 },
    subtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginBottom: 14,
    },
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      padding: 14,
    },
    searchRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.borderDk,
      borderRadius: 4,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 15,
      color: c.text,
      fontFamily: "Inter_400Regular",
    },
    searchBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.text,
      borderRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 6,
    },
    searchBtnText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    emptyState: { alignItems: "center", gap: 10, paddingVertical: 32 },
    emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular" },
    rangeGrid: {
      flexDirection: "row",
      gap: 1,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 14,
    },
    rangeCell: { flex: 1, padding: 14, alignItems: "center" },
    rangeLbl: {
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontFamily: "Inter_500Medium",
      marginBottom: 4,
    },
    rangeVal: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    table: {
      borderWidth: 1,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 14,
    },
    tableHead: {
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e8e6e2",
    },
    th: {
      flex: 1,
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      fontFamily: "Inter_500Medium",
    },
    tableRow: {
      flexDirection: "row",
      paddingHorizontal: 8,
      paddingVertical: 9,
      borderBottomWidth: 1,
    },
    td: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    useBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 4,
    },
    useBtnText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });
