import { Tooltip } from "@rneui/themed";
import { Stack } from "expo-router";

export default function RNETooltip({ children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Stack row align="center">
      <Tooltip
        visible={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        popover={<Text style={{ color: "#fff" }}>Tooltip text</Text>}
      >
        {children}
      </Tooltip>
    </Stack>
  );
}
