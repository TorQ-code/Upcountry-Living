import { Feather } from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fmt$, InventoryItem } from "@/context/InventoryContext";

interface Props {
  item: InventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PostConfirmSheet({ item, visible, onClose, onConfirm }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;

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

  if (!item) return null;

  const desc = `${item.condition} condition. ${item.notes || ""} A beautiful piece for any home.`.trim();
  const c = colors;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose} />
      <Animated.View
        style={[s.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 }]}
      >
        <View style={[s.handle, { backgroundColor: c.borderDk }]} />
        <View style={[s.titleRow]}>
          <Text style={[s.title, { color: c.text }]}>Post to Site</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={18} color={c.mutedForeground} />
          </TouchableOpacity>
        </View>
        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
          <Text style={[s.subtitle, { color: c.mutedForeground }]}>
            Review before publishing to shopupcountryliving.com
          </Text>
          <View style={[s.preview, { backgroundColor: c.surface, borderColor: c.border }]}>
            {item.photo && (
              <Image source={{ uri: item.photo }} style={s.previewImg} resizeMode="cover" />
            )}
            <Text style={[s.previewName, { color: c.text }]}>{item.name}</Text>
            <Text style={[s.previewDesc, { color: c.mutedForeground }]}>{desc}</Text>
            <Text style={[s.previewPrice, { color: c.text }]}>{fmt$(item.askingPrice)}</Text>
          </View>
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: c.text }]}
              onPress={onConfirm}
            >
              <Feather name="send" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={[s.btnText, { color: "#fff" }]}>Post to Site</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnOutline, { borderColor: c.borderDk }]}
              onPress={onClose}
            >
              <Text style={[s.btnText, { color: c.mid }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: { padding: 4, marginLeft: 8 },
  body: { paddingHorizontal: 16 },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
    fontFamily: "Inter_400Regular",
  },
  preview: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    marginBottom: 16,
  },
  previewImg: {
    width: "100%",
    height: 160,
    borderRadius: 4,
    marginBottom: 10,
  },
  previewName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "Inter_600SemiBold",
  },
  previewDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: "Inter_400Regular",
  },
  previewPrice: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  actions: { gap: 8, paddingBottom: 8 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  btnText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Inter_600SemiBold",
  },
});
