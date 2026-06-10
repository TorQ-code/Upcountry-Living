import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostConfirmSheet from "@/components/PostConfirmSheet";
import {
  CATEGORIES,
  CONDITIONS,
  fmt$,
  InventoryItem,
  ItemCategory,
  ItemCondition,
  makeId,
  useInventory,
} from "@/context/InventoryContext";
import { useColors } from "@/hooks/useColors";
import { getComps } from "@/constants/comps";

const COMP_DATES = ["May 28", "May 20", "May 12", "Apr 30", "Apr 18"];

function SegmentPicker<T extends string>({
  options,
  value,
  onChange,
  colors,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 0 }}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 99,
                backgroundColor: active ? colors.accent : colors.card,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.borderDk,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: active ? "#fff" : colors.mid,
                  fontFamily: "Inter_500Medium",
                }}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function CaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addItem } = useInventory();

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Decor");
  const [condition, setCondition] = useState<ItemCondition>("Good");
  const [paidPrice, setPaidPrice] = useState("");
  const [askPrice, setAskPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [compQ, setCompQ] = useState("");
  const [compResult, setCompResult] = useState<{
    dates: string[];
    comps: { p: number; c: string }[];
    avg: number;
    suggest: number;
  } | null>(null);

  const [postItem, setPostItem] = useState<InventoryItem | null>(null);
  const [postVisible, setPostVisible] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const pickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libPerm.granted) {
        Alert.alert("Permission needed", "Please allow camera or photo library access.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: false,
      });
      if (!res.canceled && res.assets[0]) {
        setPhoto(res.assets[0].uri);
      }
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: false,
    });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0].uri);
    }
  }, []);

  const clearPhoto = useCallback(() => setPhoto(null), []);

  const lookupComps = useCallback(() => {
    const q = (compQ || name).trim();
    if (!q) {
      showToast("Enter item name first", "err");
      return;
    }
    const comps = getComps(q);
    const avg = comps.reduce((s, c) => s + c.p, 0) / comps.length;
    const suggest = Math.round(avg * 1.05);
    setCompResult({ dates: COMP_DATES, comps, avg, suggest });
  }, [compQ, name, showToast]);

  const buildItem = useCallback((): InventoryItem | null => {
    if (!name.trim()) {
      showToast("Item name required", "err");
      return null;
    }
    return {
      id: makeId(),
      name: name.trim(),
      category,
      condition,
      purchasePrice: parseFloat(paidPrice) || 0,
      askingPrice: parseFloat(askPrice) || 0,
      notes,
      status: "In Stock",
      salePrice: null,
      photo,
      dateAdded: new Date().toISOString(),
      dateSold: null,
    };
  }, [name, category, condition, paidPrice, askPrice, notes, photo, showToast]);

  const clearForm = useCallback(() => {
    setName(""); setPaidPrice(""); setAskPrice(""); setNotes("");
    setCompQ(""); setCompResult(null); setPhoto(null);
    setCategory("Decor"); setCondition("Good");
  }, []);

  const handleSave = useCallback(() => {
    const item = buildItem();
    if (!item) return;
    addItem(item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`"${item.name}" saved`);
    clearForm();
  }, [buildItem, addItem, showToast, clearForm]);

  const handleSaveAndPost = useCallback(() => {
    const item = buildItem();
    if (!item) return;
    addItem(item);
    setPostItem(item);
    setPostVisible(true);
    clearForm();
  }, [buildItem, addItem, clearForm]);

  const s = styles(colors);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          Upcountry <Text style={{ color: colors.accent }}>Living</Text>
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo */}
          <TouchableOpacity
            style={[s.photoZone, photo ? s.photoZoneFilled : {}]}
            onPress={pickPhoto}
            activeOpacity={0.8}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={s.photoImg} contentFit="cover" />
            ) : (
              <View style={s.photoPlaceholder}>
                <Feather name="camera" size={32} color={colors.borderDk} />
                <Text style={[s.photoText, { color: colors.mutedForeground }]}>
                  Tap to photograph item
                </Text>
                <Text style={[s.photoHint, { color: colors.borderDk }]}>
                  Camera or photo library
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {photo && (
            <TouchableOpacity onPress={clearPhoto} style={s.removePhoto}>
              <Feather name="x" size={12} color={colors.mutedForeground} />
              <Text style={[s.removePhotoText, { color: colors.mutedForeground }]}>
                Remove photo
              </Text>
            </TouchableOpacity>
          )}

          {/* Form */}
          <View style={[s.card, { marginTop: 12 }]}>
            <Text style={s.fieldLabel}>Item Name *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Cast Iron Skillet…"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Category</Text>
            <SegmentPicker
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              colors={colors}
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Condition</Text>
            <SegmentPicker
              options={CONDITIONS}
              value={condition}
              onChange={setCondition}
              colors={colors}
            />

            <View style={[s.fieldRow, { marginTop: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Paid ($)</Text>
                <TextInput
                  style={s.input}
                  value={paidPrice}
                  onChangeText={setPaidPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Asking ($)</Text>
                <TextInput
                  style={s.input}
                  value={askPrice}
                  onChangeText={setAskPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Notes</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Condition, provenance, flaws…"
              placeholderTextColor={colors.mutedForeground}
              textAlignVertical="top"
            />
          </View>

          {/* Comp Research */}
          <View style={[s.card, { marginTop: 12 }]}>
            <Text style={[s.cardLabel, { color: colors.mutedForeground }]}>Comp Research</Text>
            <View style={s.compRow}>
              <TextInput
                style={[s.input, { flex: 1, minWidth: 0 }]}
                value={compQ}
                onChangeText={setCompQ}
                placeholder="Search eBay comps…"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="search"
                onSubmitEditing={lookupComps}
              />
              <TouchableOpacity style={s.btnOutline} onPress={lookupComps}>
                <Text style={[s.btnOutlineText, { color: colors.mid }]}>Look up</Text>
              </TouchableOpacity>
            </View>
            {compResult && (
              <View style={[s.compResults, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.compLabel, { color: colors.mutedForeground }]}>Recent Sold</Text>
                {compResult.comps.map((c, i) => (
                  <View key={i} style={[s.compRow2, { borderBottomColor: colors.border }]}>
                    <Text style={[s.compRowText, { color: colors.mid }]}>
                      {COMP_DATES[i]} · {c.c}
                    </Text>
                    <Text style={[s.compRowText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                      {fmt$(c.p)}
                    </Text>
                  </View>
                ))}
                <View style={[s.compFooter, { borderTopColor: colors.border }]}>
                  <Text style={[s.compFooterText, { color: colors.mutedForeground }]}>
                    Avg{" "}
                    <Text style={{ color: colors.text, fontFamily: "Inter_500Medium" }}>
                      {fmt$(compResult.avg)}
                    </Text>
                  </Text>
                  <Text style={[s.compFooterText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                    Suggested: {fmt$(compResult.suggest)}
                  </Text>
                  <TouchableOpacity
                    style={[s.btnOutlineSmall, { borderColor: colors.borderDk }]}
                    onPress={() => setAskPrice(String(compResult.suggest))}
                  >
                    <Text style={[s.btnOutlineTextSm, { color: colors.mid }]}>
                      Use {fmt$(compResult.suggest)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btnPrimary, { backgroundColor: colors.accent }]}
              onPress={handleSaveAndPost}
              activeOpacity={0.85}
            >
              <Feather name="send" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.btnPrimaryText}>Save & Post to Site</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSecondary, { borderColor: colors.borderDk }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Feather name="archive" size={14} color={colors.mid} style={{ marginRight: 6 }} />
              <Text style={[s.btnSecondaryText, { color: colors.mid }]}>Save to Inventory Only</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toast && (
        <View
          style={[
            s.toast,
            { top: topPad + 10, backgroundColor: toast.type === "err" ? colors.destructive : colors.text },
          ]}
          pointerEvents="none"
        >
          <Text style={s.toastText}>{toast.msg}</Text>
        </View>
      )}

      <PostConfirmSheet
        item={postItem}
        visible={postVisible}
        onClose={() => setPostVisible(false)}
        onConfirm={() => {
          setPostVisible(false);
          showToast("Queued for shopupcountryliving.com ✓");
        }}
      />
    </View>
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
      borderBottomColor: c.borderDk,
      backgroundColor: c.headerBg,
    },
    headerTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: c.text,
    },
    scroll: { flex: 1 },
    content: { padding: 16 },
    photoZone: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: c.borderDk,
      borderRadius: 6,
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
      overflow: "hidden",
    },
    photoZoneFilled: {
      borderStyle: "solid",
      borderColor: c.border,
      minHeight: 0,
    },
    photoImg: {
      width: "100%",
      height: 240,
      borderRadius: 5,
    },
    photoPlaceholder: {
      alignItems: "center",
      gap: 8,
      padding: 32,
    },
    photoText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    photoHint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    removePhoto: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      paddingVertical: 4,
    },
    removePhotoText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    card: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 4,
      padding: 16,
    },
    cardLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontFamily: "Inter_600SemiBold",
      color: c.accent,
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    fieldLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.9,
      color: c.mutedForeground,
      fontFamily: "Inter_500Medium",
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderDk,
      borderRadius: 4,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 15,
      color: c.text,
      fontFamily: "Inter_400Regular",
      backgroundColor: c.card,
    },
    textarea: {
      minHeight: 72,
      textAlignVertical: "top",
    },
    fieldRow: {
      flexDirection: "row",
      gap: 10,
    },
    compRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "stretch",
    },
    compResults: {
      marginTop: 10,
      borderWidth: 1,
      borderRadius: 3,
      padding: 12,
    },
    compLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.9,
      fontFamily: "Inter_500Medium",
      marginBottom: 8,
    },
    compRow2: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderBottomWidth: 1,
    },
    compRowText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    compFooter: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    compFooterText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    btnOutline: {
      flexShrink: 0,
      borderWidth: 1,
      borderColor: c.borderDk,
      borderRadius: 4,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    btnOutlineText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    btnOutlineSmall: {
      borderWidth: 1,
      borderRadius: 4,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    btnOutlineTextSm: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    btnRow: {
      marginTop: 16,
      gap: 10,
    },
    btnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
      borderRadius: 4,
    },
    btnPrimaryText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    btnSecondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
      borderRadius: 4,
      borderWidth: 1,
      backgroundColor: "transparent",
    },
    btnSecondaryText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    toast: {
      position: "absolute",
      alignSelf: "center",
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 99,
      zIndex: 999,
    },
    toastText: {
      color: "#fff",
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
  });
