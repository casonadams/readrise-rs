import { Canvas, Text, View } from "nsh";
import type { Kid } from "../../core/course";
import { KidAvatar } from "./kid-avatar";
import { tint } from "./tint";
import { SubjectColor } from "./theme";

/** The app's guide: hosts the debates, gives hints, reacts to predictions and cheers at the end. Never takes a side. */
export const alex: Kid = { name: "Alex", skin: "#E8B48A", hair: "#8D4B2A" };

const frames = "#263238";

/** Alex's face: a classmate's face with round glasses. */
export function AlexAvatar(props: { size?: number }) {
  const size = () => props.size ?? 44;
  return (
    <View accessible accessibilityLabel="Alex" style={{ width: size(), height: size() }}>
      <KidAvatar kid={alex} size={size()} />
      <Canvas
        class="absolute inset-0"
        draw={(cx, { width, height }) => {
          const r = Math.min(width, height) / 2;
          const eyeY = r + r * 0.12;
          cx.strokeStyle = frames;
          cx.lineWidth = Math.max(1.5, r * 0.07);
          cx.beginPath();
          cx.arc(r - r * 0.3, eyeY, r * 0.21, 0, Math.PI * 2);
          cx.moveTo(r + r * 0.51, eyeY);
          cx.arc(r + r * 0.3, eyeY, r * 0.21, 0, Math.PI * 2);
          cx.moveTo(r - r * 0.09, eyeY - r * 0.02);
          cx.lineTo(r + r * 0.09, eyeY - r * 0.02);
          cx.stroke();
        }}
      />
    </View>
  );
}

/** Alex beside a speech bubble: a line to the learner, with an optional title, in the subject's colour or `color`. */
export function AlexSays(props: { message: string; title?: string; color?: string }) {
  const color = () => props.color ?? SubjectColor();
  return (
    <View class="w-full shrink-0 flex-row items-end gap-2.5">
      <AlexAvatar />
      <View
        class="flex-1 gap-1 rounded-[18px] border-2 p-3"
        style={{ borderBottomLeftRadius: 4, backgroundColor: tint(color(), 0.1), borderColor: tint(color(), 0.4) }}
      >
        <If when={props.title}>
          {(title) => (
            <Text class="text-base font-bold" style={{ color: color() }}>
              {title()}
            </Text>
          )}
        </If>
        <Text class="text-lg leading-snug">{props.message}</Text>
      </View>
    </View>
  );
}
