import { Canvas, Text, View } from "nsh";
import type { Kid } from "../../core/course";
import { KidAvatar } from "./kid-avatar";
import { tint } from "./tint";
import { SubjectColor } from "./theme";

/** The app's guide: hosts the debates, gives hints, reacts to predictions and cheers at the end. Never takes a side. */
export const alex: Kid = { name: "Alex", skin: "#E8B48A", hair: "#8D4B2A" };

const frames = "#263238";

/** The face fills this share of the avatar; the spikes of hair stand in the space above it. */
const face = 0.78;
const spikes = 5;

/** Alex's face: a classmate's face with spiky hair and round glasses. */
export function AlexAvatar(props: { size?: number }) {
  const size = () => props.size ?? 44;
  return (
    <View accessible accessibilityLabel="Alex" style={{ width: size(), height: size() }}>
      <View class="absolute bottom-0" style={{ left: (size() * (1 - face)) / 2 }}>
        <KidAvatar kid={alex} size={size() * face} />
      </View>
      <Canvas
        class="absolute inset-0"
        draw={(cx, { width, height }) => {
          const r = (Math.min(width, height) * face) / 2;
          const x = width / 2;
          const y = height - r;
          cx.fillStyle = alex.hair;
          cx.beginPath();
          for (let i = 0; i < spikes; i++) {
            const from = Math.PI * (1.12 + (0.76 * i) / spikes);
            const to = Math.PI * (1.12 + (0.76 * (i + 1)) / spikes);
            const tip = (from + to) / 2;
            cx.moveTo(x + Math.cos(from) * r * 0.8, y + Math.sin(from) * r * 0.8);
            cx.lineTo(x + Math.cos(tip) * r * 1.5, y + Math.sin(tip) * r * 1.5);
            cx.lineTo(x + Math.cos(to) * r * 0.8, y + Math.sin(to) * r * 0.8);
          }
          cx.fill();
          const eyeY = y + r * 0.12;
          cx.strokeStyle = frames;
          cx.lineWidth = Math.max(1.5, r * 0.07);
          cx.beginPath();
          cx.arc(x - r * 0.3, eyeY, r * 0.21, 0, Math.PI * 2);
          cx.moveTo(x + r * 0.51, eyeY);
          cx.arc(x + r * 0.3, eyeY, r * 0.21, 0, Math.PI * 2);
          cx.moveTo(x - r * 0.09, eyeY - r * 0.02);
          cx.lineTo(x + r * 0.09, eyeY - r * 0.02);
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
