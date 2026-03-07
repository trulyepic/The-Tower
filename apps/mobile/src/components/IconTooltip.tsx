import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
} from "react-native";
import { HUD_ASSETS } from "../data/hudAssets";
import { colors } from "../theme/colors";

interface IconTooltipProps {
  text: string;
}

const BUBBLE_WIDTH = 220;

export const IconTooltip = ({ text }: IconTooltipProps) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<ViewType | null>(null);

  const openTooltip = () => {
    if (!iconRef.current) {
      return;
    }

    iconRef.current.measureInWindow((x, y, width, height) => {
      const screenWidth = Dimensions.get("window").width;
      const left = Math.max(10, Math.min(x + width / 2 - BUBBLE_WIDTH / 2, screenWidth - BUBBLE_WIDTH - 10));
      const top = Math.max(12, y - 64);
      setPosition({ top, left });
      setOpen(true);
    });
  };

  return (
    <>
      <Pressable ref={iconRef} hitSlop={10} onPress={openTooltip} style={styles.iconButton}>
        <Image source={HUD_ASSETS.icons.info} style={styles.helpIcon} resizeMode="contain" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.bubble, { top: position.top, left: position.left }]}>
            <Text style={styles.text}>{text}</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(80, 56, 24, 0.9)",
    borderWidth: 1,
    borderColor: "#d2a65d",
  },
  helpIcon: {
    width: 12,
    height: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 8, 20, 0.18)",
  },
  bubble: {
    position: "absolute",
    width: BUBBLE_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1a25a",
    backgroundColor: "rgba(41, 28, 52, 0.98)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  text: {
    color: "#f3e2c3",
    fontSize: 11,
    lineHeight: 15,
  },
});
