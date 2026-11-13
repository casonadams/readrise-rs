import { View } from "nsh";
import { SubjectColor } from "./theme";

/** One dot per step; the current one stretches into a pill. */
export function StepDots(props: { count: number; current: number }) {
  return (
    <View class="flex-row items-center" accessibilityLabel={`Step ${props.current + 1} of ${props.count}`}>
      <Each of={Array.from({ length: props.count }, (_, i) => i)}>
        {(dot) => (
          <View
            style={{
              width: dot() === props.current ? 24 : 8,
              height: 8,
              marginHorizontal: 3,
              borderRadius: 4,
              backgroundColor: dot() <= props.current ? SubjectColor() : "#D4D4D8",
              transitionProperty: "all",
              transitionDuration: 300,
            }}
          />
        )}
      </Each>
    </View>
  );
}
