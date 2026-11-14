import { Canvas, Text, View } from "nsh";
import type { Kid } from "../../core/course";
import { drawFace } from "./kid-avatar";
import { tint } from "./tint";
import { SubjectColor } from "./theme";

/** The app's guide: hosts the debates, gives hints, reacts to predictions and cheers at the end. Never takes a side. */
export const alex: Kid = { name: "Alex", skin: "#E8B48A", hair: "#8D4B2A" };

const frames = "#263238";

const cap = { crown: "#E53935", band: "#B71C1C" };
/** The head's share of the avatar; the cap's brim sticks up behind it. */
const head = 0.92;

/** Alex's face: a classmate's face with a cap on backwards and round glasses. */
export function AlexAvatar(props: { size?: number }) {
  const size = () => props.size ?? 44;
  return (
    <Canvas
      accessible
      accessibilityLabel="Alex"
      style={{ width: size(), height: size() }}
      draw={(cx, { width, height }) => {
        const pi = Math.PI;
        const r = (Math.min(width, height) * head) / 2;
        const x = width / 2;
        const y = height - r;
        cx.fillStyle = alex.hair;
        cx.beginPath();
        cx.arc(x, y, r, 0, pi * 2);
        cx.fill();
        cx.fillStyle = cap.band;
        cx.beginPath();
        cx.ellipse(x + r * 0.1, y - r * 0.95, r * 0.75, r * 0.14, -0.12, 0, pi * 2);
        cx.fill();
        drawFace(cx, alex, x, y, r);
        const edge = pi * 1.117;
        const bandY = y - r * 0.5;
        cx.fillStyle = cap.crown;
        cx.beginPath();
        cx.arc(x, y, r, edge, pi * 3 - edge);
        cx.quadraticCurveTo(x, bandY, x + Math.cos(edge) * r, y + Math.sin(edge) * r);
        cx.fill();
        cx.strokeStyle = cap.band;
        cx.lineWidth = r * 0.12;
        cx.lineCap = "round";
        cx.beginPath();
        cx.moveTo(x - Math.cos(edge) * r * 0.97, y + Math.sin(edge) * r * 0.97);
        cx.quadraticCurveTo(x, bandY, x + Math.cos(edge) * r * 0.97, y + Math.sin(edge) * r * 0.97);
        cx.stroke();
        cx.fillStyle = alex.hair;
        cx.beginPath();
        cx.arc(x, bandY + r * 0.06, r * 0.15, pi, pi * 2);
        cx.fill();
        const eyeY = y + r * 0.12;
        cx.strokeStyle = frames;
        cx.lineWidth = Math.max(1.5, r * 0.07);
        cx.beginPath();
        cx.arc(x - r * 0.3, eyeY, r * 0.21, 0, pi * 2);
        cx.moveTo(x + r * 0.51, eyeY);
        cx.arc(x + r * 0.3, eyeY, r * 0.21, 0, pi * 2);
        cx.moveTo(x - r * 0.09, eyeY - r * 0.02);
        cx.lineTo(x + r * 0.09, eyeY - r * 0.02);
        cx.stroke();
      }}
    />
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
