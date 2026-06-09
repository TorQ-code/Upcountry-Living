import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { daysBetween, fmt$, useInventory } from "@/context/InventoryContext";
import { useColors } from "@/hooks/useColors";

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, clearItems } = useInventory();

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all inventory items. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: () => clearItems(),
        },
      ]
    );
  };

  const stats = useMemo(() => {
    const sold = items.filter((i) => i.status === "Sold");
    const invested = items.reduce((s, i) => s + i.purchasePrice, 0);
    const revenue = sold.reduce((s, i) => s + (i.salePrice ?? 0), 0);
    const costSold = sold.reduce((s, i) => s + i.purchasePrice, 0);
    const pl = revenue - costSold;

    const hot = sold
      .map((i) => ({
        name: i.name,
        profit: (i.salePrice ?? 0) - i.purchasePrice,
        pct: i.purchasePrice
          ? Math.round((((i.salePrice ?? 0) - i.purchasePrice) / i.purchasePrice) * 100)
          : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const cold = items
      .filter((i) => i.status !== "Sold")
      .map((i) => ({
        name: i.name,
        days: daysBetween(i.dateAdded, new Date().toISOString()) ?? 0,
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    // Last 6 months bar chart
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { label: d.toLocaleDateString("en-US", { month: "short" }), y: d.getFullYear(), m: d.getMonth() };
    });
    const mData = months.map((mo) => {
      const ms = sold.filter((i) => {
        if (!i.dateSold) return false;
        const d = new Date(i.dateSold);
        return d.getFullYear() === mo.y && d.getMonth() === mo.m;
      });
      return {
        label: mo.label,
        rev: ms.reduce((s, i) => s + (i.salePrice ?? 0), 0),
        cost: ms.reduce((s, i) => s + i.purchasePrice, 0),
      };
    });
    const maxBar = Math.max(...mData.map((d) => Math.max(d.rev, d.cost)), 1);

    // Category profit
    const catMap: Record<string, number> = {};
    sold.forEach((i) => {
      catMap[i.category] = (catMap[i.category] ?? 0) + ((i.salePrice ?? 0) - i.purchasePrice);
    });
    const maxCat = Math.max(...Object.values(catMap), 1);
    const catBars = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    // Days to sell by category
    const dMap: Record<string, number[]> = {};
    sold.forEach((i) => {
      const d = daysBetween(i.dateAdded, i.dateSold ?? new Date().toISOString());
      if (d !== null) {
        if (!dMap[i.category]) dMap[i.category] = [];
        dMap[i.category].push(d);
      }
    });
    const daysToSell = Object.entries(dMap).map(([cat, ds]) => ({
      cat,
      avg: ds.reduce((s, d) => s + d, 0) / ds.length,
    }));

    return { sold, invested, revenue, pl, hot, cold, mData, maxBar, catBars, maxCat, daysToSell };
  }, [items]);

  const c = colors;
  const s = styles(c);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const statCells = [
    { label: "Items", value: String(items.length), color: c.text },
    { label: "Invested", value: fmt$(stats.invested), color: c.text },
    { label: "Revenue", value: fmt$(stats.revenue), color: c.text },
    { label: "Net P&L", value: (stats.pl >= 0 ? "+" : "") + fmt$(stats.pl), color: stats.pl >= 0 ? c.green : c.destructive },
    { label: "Sold", value: String(stats.sold.length), color: c.green },
    { label: "Avg Profit", value: stats.sold.length ? fmt$(stats.pl / stats.sold.length) : "—", color: c.accent },
  ];

  return (
    <ScrollView
      style={[s.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.pageHead}>
        <Text style={[s.pageTitle, { color: c.text }]}>Analytics</Text>
        <Text style={[s.pageSub, { color: c.mutedForeground }]}>
          If you're not tracking it, you're not growing it.
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={[s.statsGrid, { backgroundColor: c.border }]}>
        {statCells.map((cell, i) => (
          <View key={i} style={[s.statCell, { backgroundColor: c.card }]}>
            <Text style={[s.statVal, { color: cell.color }]}>{cell.value}</Text>
            <Text style={[s.statLbl, { color: c.mutedForeground }]}>{cell.label}</Text>
          </View>
        ))}
      </View>

      {/* Hot Items */}
      <View style={[s.card, { marginTop: 14 }]}>
        <View style={s.cardLabelRow}>
          <View style={[s.dot, { backgroundColor: c.accent }]} />
          <Text style={[s.cardLabel, { color: c.mutedForeground }]}>Top Earners</Text>
        </View>
        {stats.hot.length === 0 ? (
          <Text style={[s.emptyMsg, { color: c.mutedForeground }]}>No sold items yet</Text>
        ) : (
          stats.hot.map((item, n) => (
            <View key={n} style={[s.rankRow, { borderBottomColor: c.border }]}>
              <View style={[s.rankN, { backgroundColor: c.accent }]}>
                <Text style={s.rankNText}>{n + 1}</Text>
              </View>
              <Text style={[s.rankName, { color: c.mid }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[s.rankStat, { color: c.mutedForeground }]}>
                +${item.profit.toFixed(0)} ({item.pct}%)
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Cold Items */}
      <View style={[s.card, { marginTop: 12 }]}>
        <View style={s.cardLabelRow}>
          <View style={[s.dot, { backgroundColor: c.borderDk }]} />
          <Text style={[s.cardLabel, { color: c.mutedForeground }]}>Slow Movers</Text>
        </View>
        {stats.cold.length === 0 ? (
          <Text style={[s.emptyMsg, { color: c.mutedForeground }]}>All sold!</Text>
        ) : (
          stats.cold.map((item, n) => (
            <View key={n} style={[s.rankRow, { borderBottomColor: c.border }]}>
              <View style={[s.rankN, { backgroundColor: c.surface }]}>
                <Text style={[s.rankNText, { color: c.mutedForeground }]}>{n + 1}</Text>
              </View>
              <Text style={[s.rankName, { color: c.mid }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[s.rankStat, { color: c.mutedForeground }]}>{item.days}d</Text>
            </View>
          ))
        )}
      </View>

      {/* Bar Chart */}
      <View style={[s.card, { marginTop: 12 }]}>
        <Text style={[s.cardLabel, { color: c.mutedForeground }]}>Revenue vs. Cost — Last 6 Mo</Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 4, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />
            <Text style={[s.legendText, { color: c.mutedForeground }]}>Revenue</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.borderDk }} />
            <Text style={[s.legendText, { color: c.mutedForeground }]}>Cost</Text>
          </View>
        </View>
        <View style={s.barChart}>
          {stats.mData.map((d, i) => (
            <View key={i} style={s.barGroup}>
              <View style={s.bars}>
                <View
                  style={[s.bar, { height: (d.rev / stats.maxBar) * 80, backgroundColor: c.accent }]}
                />
                <View
                  style={[s.bar, { height: (d.cost / stats.maxBar) * 80, backgroundColor: c.borderDk }]}
                />
              </View>
              <Text style={[s.barLabel, { color: c.mutedForeground }]}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category Profit */}
      <View style={[s.card, { marginTop: 12 }]}>
        <Text style={[s.cardLabel, { color: c.mutedForeground }]}>Profit by Category</Text>
        {stats.catBars.length === 0 ? (
          <Text style={[s.emptyMsg, { color: c.mutedForeground }]}>No sales yet</Text>
        ) : (
          <View style={{ marginTop: 8, gap: 12 }}>
            {stats.catBars.map(([cat, val]) => (
              <View key={cat}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={[s.catBarLabel, { color: c.mutedForeground }]}>{cat}</Text>
                  <Text style={[s.catBarLabel, { color: c.mutedForeground }]}>${val.toFixed(0)}</Text>
                </View>
                <View style={[s.catTrack, { backgroundColor: c.surface }]}>
                  <View
                    style={[s.catFill, { width: `${(val / stats.maxCat) * 100}%`, backgroundColor: c.accent }]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Days to Sell */}
      <View style={[s.card, { marginTop: 12 }]}>
        <Text style={[s.cardLabel, { color: c.mutedForeground }]}>Avg Days to Sell</Text>
        {stats.daysToSell.length === 0 ? (
          <Text style={[s.emptyMsg, { color: c.mutedForeground }]}>No sold items yet</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {stats.daysToSell.map(({ cat, avg }) => (
              <View key={cat} style={[s.daysChip, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[s.daysChipBold, { color: c.text }]}>{cat}</Text>
                <Text style={[s.daysChipSub, { color: c.mutedForeground }]}> · {avg.toFixed(0)}d</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Clear data */}
      <TouchableOpacity
        onPress={handleClearData}
        style={{ margin: 16, marginTop: 8, padding: 14, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: "center" }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
          Clear All Data
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pageHead: { padding: 16, paddingBottom: 8 },
    pageTitle: { fontSize: 22, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    pageSub: { fontSize: 13, marginTop: 2, fontFamily: "Inter_400Regular" },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 1,
      marginHorizontal: 16,
      borderRadius: 4,
      overflow: "hidden",
    },
    statCell: {
      width: "33%",
      flexGrow: 1,
      padding: 14,
      alignItems: "center",
    },
    statVal: { fontSize: 20, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    statLbl: { fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter_500Medium" },
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      padding: 14,
      marginHorizontal: 16,
    },
    cardLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    cardLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.9,
      fontFamily: "Inter_500Medium",
      marginBottom: 10,
    },
    emptyMsg: { fontSize: 13, fontFamily: "Inter_400Regular" },
    rankRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    rankN: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    rankNText: { fontSize: 10, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    rankName: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
    rankStat: { fontSize: 12, fontFamily: "Inter_400Regular" },
    legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
    barChart: { flexDirection: "row", gap: 6, alignItems: "flex-end", height: 90 },
    barGroup: { flex: 1, alignItems: "center", gap: 4 },
    bars: { flexDirection: "row", gap: 2, alignItems: "flex-end", width: "100%" },
    bar: { flex: 1, borderRadius: 1, minHeight: 3 },
    barLabel: { fontSize: 9, letterSpacing: 0.3, fontFamily: "Inter_400Regular" },
    catBarLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
    catTrack: { height: 5, borderRadius: 99, overflow: "hidden" },
    catFill: { height: "100%", borderRadius: 99 },
    daysChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderRadius: 3,
    },
    daysChipBold: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    daysChipSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  });
