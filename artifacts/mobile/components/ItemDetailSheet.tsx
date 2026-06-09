import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  fmtDate,
  fmt$,
  InventoryItem,
  useInventory,
} from "@/context/InventoryContext";

interface Props {
  item: InventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onPostToSite?: (item: InventoryItem) => void;
}

function Badge({
  status,
  colors,
}: {
  status: string;
  colors: ReturnType<typeof useColors>;
}) {
  let bg = colors.surface;
  let color = colors.mutedForeground;
  if (status === "Listed") {
    bg = colors.accentBg;
    color = colors.accent;
  } else if (status === "Sold") {
    bg = colors.greenBg;
    color = colors.green;
  }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 }}>
        {status}
      </Text>
    </View>
  );
}

export default function ItemDetailSheet({ item, visible, onClose, onPostToSite }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateItem, deleteItem } = useInventory();
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [notes, setNotes] = useState("");
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    if (item) {
      setNotes(item.notes ?? "");
      setSalePrice("");
    }
  }, [item]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleMarkSold = useCallback(() => {
    const p = parseFloat(salePrice);
    if (!p || p <= 0) {
      Alert.alert("Enter sale price", "Please enter a valid sale price.");
      return;
    }
    if (!item) return;
    updateItem(item.id, {
      status: "Sold",
      salePrice: p,
      dateSold: new Date().toISOString(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [salePrice, item, updateItem, onClose]);

  const handleToggleListed = useCallback(() => {
    if (!item) return;
    const next = item.status === "Listed" ? "In Stock" : "Listed";
    updateItem(item.id, { status: next });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [item, updateItem, onClose]);

  const handleSaveNotes = useCallback(() => {
    if (!item) return;
    updateItem(item.id, { notes });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [item, notes, updateItem, onClose]);

  const handleDelete = useCallback(() => {
    if (!item) return;
    Alert.alert("Delete item", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteItem(item.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onClose();
        },
      },
    ]);
  }, [item, deleteItem, onClose]);

  if (!item) return null;

  const isSold = item.status === "Sold";
  const effectivePrice = isSold ? (item.salePrice ?? 0) : item.askingPrice;
  const margin = effectivePrice - item.purchasePrice;
  const marginPos = margin >= 0;

  const s = styles(colors);

  const grid = [
    { label: "Category", value: item.category },
    { label: "Condition", value: item.condition },
    { label: "Paid", value: fmt$(item.purchasePrice) },
    { label: "Asking", value: fmt$(item.askingPrice) },
    { label: "Status", value: null, badge: item.status },
    {
      label: isSold ? "Actual Profit" : "Potential Profit",
      value: `${marginPos ? "+" : ""}$${Math.abs(margin).toFixed(2)}`,
      valueColor: marginPos ? colors.green : colors.destructive,
    },
    { label: "Added", value: fmtDate(item.dateAdded) },
    ...(item.dateSold ? [{ label: "Sold", value: fmtDate(item.dateSold) }] : []),
    ...(item.salePrice ? [{ label: "Sale Price", value: fmt$(item.salePrice) }] : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <Animated.View
        style={[s.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 }]}
      >
        <View style={s.handle} />
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            {item.photo && (
              <Image source={{ uri: item.photo }} style={s.photo} resizeMode="cover" />
            )}

            <View style={s.grid}>
              {grid.map((row, i) => (
                <View key={i} style={s.gridCell}>
                  <Text style={s.gridLabel}>{row.label}</Text>
                  {row.badge ? (
                    <Badge status={row.badge} colors={colors} />
                  ) : (
                    <Text style={[s.gridValue, row.valueColor ? { color: row.valueColor } : {}]}>
                      {row.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <Text style={s.fieldLabel}>Notes</Text>
            <TextInput
              style={s.textarea}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Notes about condition, history…"
              placeholderTextColor={colors.mutedForeground}
            />

            {!isSold && (
              <>
                <Text style={[s.fieldLabel, { marginTop: 14 }]}>Sale Price to Mark Sold</Text>
                <TextInput
                  style={s.input}
                  value={salePrice}
                  onChangeText={setSalePrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </>
            )}

            <View style={s.actions}>
              {!isSold && (
                <View style={s.actionRow}>
                  <TouchableOpacity style={[s.btn, s.btnAccent, { flex: 1 }]} onPress={handleMarkSold}>
                    <Text style={[s.btnText, { color: "#fff" }]}>Mark Sold</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1 }]} onPress={handleToggleListed}>
                    <Text style={s.btnTextOutline}>
                      {item.status === "Listed" ? "Unlist" : "Mark Listed"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={[s.btn, s.btnOutline, s.btnFull]}
                onPress={() => { onPostToSite?.(item); onClose(); }}
              >
                <Feather name="external-link" size={14} color={colors.mid} style={{ marginRight: 6 }} />
                <Text style={s.btnTextOutline}>Post to Site</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnOutline, s.btnFull]} onPress={handleSaveNotes}>
                <Feather name="save" size={14} color={colors.mid} style={{ marginRight: 6 }} />
                <Text style={s.btnTextOutline}>Save Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnGhost, s.btnFull]} onPress={handleDelete}>
                <Text style={{ color: colors.destructive, fontSize: 13, fontWeight: "500" }}>
                  Delete item
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      maxHeight: "92%",
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: c.borderDk,
      borderRadius: 99,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: c.text,
      fontFamily: "Inter_600SemiBold",
    },
    closeBtn: {
      padding: 4,
      marginLeft: 8,
    },
    body: {
      paddingHorizontal: 16,
    },
    photo: {
      width: "100%",
      height: 200,
      borderRadius: 6,
      marginBottom: 14,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 16,
    },
    gridCell: {
      width: "46%",
    },
    gridLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: c.mutedForeground,
      marginBottom: 3,
      fontFamily: "Inter_500Medium",
    },
    gridValue: {
      fontSize: 14,
      fontWeight: "500",
      color: c.text,
      fontFamily: "Inter_500Medium",
    },
    fieldLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color: c.mutedForeground,
      marginBottom: 6,
      fontFamily: "Inter_500Medium",
    },
    textarea: {
      borderWidth: 1,
      borderColor: c.borderDk,
      borderRadius: 4,
      padding: 12,
      fontSize: 15,
      color: c.text,
      fontFamily: "Inter_400Regular",
      minHeight: 72,
      textAlignVertical: "top",
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderDk,
      borderRadius: 4,
      padding: 13,
      fontSize: 17,
      color: c.text,
      fontFamily: "Inter_400Regular",
    },
    actions: {
      marginTop: 16,
      gap: 8,
      paddingBottom: 8,
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    btnAccent: {
      backgroundColor: c.accent,
      borderWidth: 1,
      borderColor: c.accent,
    },
    btnOutline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: c.borderDk,
    },
    btnGhost: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    btnFull: {
      width: "100%",
    },
    btnText: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontFamily: "Inter_600SemiBold",
    },
    btnTextOutline: {
      fontSize: 13,
      fontWeight: "500",
      color: c.mid,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontFamily: "Inter_500Medium",
    },
  });
