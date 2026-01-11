import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { View, Text, TouchableOpacity, Modal, FlatList, ViewStyle, TextStyle } from "react-native"
import { Feather } from "@expo/vector-icons"

import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types" // Ensure you have access to your theme

interface Option {
  label: string
  value: string
}

interface DropdownProps {
  label?: string
  placeholder?: string
  options: Option[]
  value?: string
  onSelect: (value: string) => void
  containerStyle?: ViewStyle
}

export function Dropdown({
  label,
  placeholder = "Select...",
  options,
  value,
  onSelect,
  containerStyle,
}: DropdownProps) {
  const [visible, setVisible] = useState(false)
  const { theme } = useAppTheme()

  const { themed } = useAppTheme()

  const selectedLabel = options.find((opt) => opt.value === value)?.label

  const toggleDropdown = () => setVisible(!visible)

  const handleSelect = (item: Option) => {
    onSelect(item.value)
    setVisible(false)
  }

  return (
    <View style={containerStyle}>
      {/* Label - Matches TextField label style exactly */}
      {label && <Text style={themed($label)}>{label}</Text>}

      {/* The Trigger Box - Matches TextField inputWrapperStyle */}
      <TouchableOpacity onPress={toggleDropdown} style={$dropdownBox} activeOpacity={0.7}>
        <Text
          style={{
            flex: 1,
            color: selectedLabel ? "#000000" : theme.colors.textDim, // Black if selected, Dim if placeholder
            fontFamily: theme.typography.primary.normal,
            fontSize: 16,
          }}
        >
          {selectedLabel || placeholder}
        </Text>

        {/* Chevron Icon */}
        <Feather name={visible ? "chevron-up" : "chevron-down"} size={20} color="black" />
      </TouchableOpacity>

      {/* The Dropdown Menu Overlay */}
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={$overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={$menuContainer}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity style={$optionItem} onPress={() => handleSelect(item)}>
                  <Text style={{ fontSize: 16, color: "black", paddingVertical: 10 }}>
                    {item.label}
                  </Text>
                  {item.value === value && <Feather name="check" size={18} color="blue" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

// --- Styles Matching TextField.tsx ---

const $dropdownBox: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",

  // Exact match from TextField's $inputWrapperStyle
  borderWidth: 1,
  borderRadius: 4,
  backgroundColor: "#D9D9D9",

  // Padding/Height adjustments to match TextField's internal spacing
  paddingHorizontal: 12, // slightly more than spacing.sm to account for no internal input padding
  paddingVertical: 12, // calculated to match the total height of a text input
  height: 42,
}

const $label: ThemedStyle<TextStyle> = () => ({
  color: "#000000",
  marginBottom: 8,
  fontFamily: "spaceGroteskMedium",
  fontSize: 16,
  lineHeight: 24,
})

const $overlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  paddingHorizontal: 20,
}

const $menuContainer: ViewStyle = {
  backgroundColor: "white",
  borderRadius: 8,
  paddingVertical: 5,
  maxHeight: 300,
  // Add shadow for better visibility
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
}

const $optionItem: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
}
