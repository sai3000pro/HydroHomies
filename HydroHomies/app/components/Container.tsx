import { JSX } from "react"
import { Image, ImageSourcePropType, ImageStyle, View, ViewProps, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ContainerProps extends ViewProps {
  headingImage?: ImageSourcePropType
}

/**
 * Cards are useful for displaying related information in a contained way.
 * If a ListItem displays content horizontally, a Card can be used to display content vertically.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Card/}
 * @param {ContainerProps} props - The props for the `Card` component.
 * @returns {JSX.Element} The rendered `Card` component.
 */
export function Container({ headingImage, children }: ContainerProps): JSX.Element {
  const { themed } = useAppTheme()

  return (
    <View style={themed($outerBox)}>
      {headingImage && <Image source={headingImage} style={themed($heading)} />}

      <View style={themed($innerBox)}>{children}</View>
    </View>
  )
}

const $outerBox: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "90%",
  padding: 6,
  borderColor: "#00439C",
  marginTop: spacing.lg,
  borderWidth: 3,
  borderRadius: 33,
  backgroundColor: "transparent",
})

const $innerBox: ThemedStyle<ViewStyle> = () => ({
  padding: 10,
  borderColor: "#C2F5FF",
  borderWidth: 5,
  borderRadius: 33,
  backgroundColor: "transparent",
})

const $heading: ThemedStyle<ImageStyle> = () => ({
  top: -20,
  height: 41,
  zIndex: 99,
  width: "90%",
  position: "absolute",
  alignSelf: "center",
  resizeMode: "contain",
})
