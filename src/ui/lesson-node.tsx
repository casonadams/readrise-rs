import { Text, View } from "nsh";
import { darken } from "./kit/theme";

export type NodeState = "locked" | "open" | "done";

const nodeSize = 96;

const lookOf: Record<NodeState, { face: string; edge: string; ink: string }> = {
  done: { face: "bg-amber-400", edge: "bg-amber-700", ink: "text-amber-950" },
  open: { face: "", edge: "", ink: "text-white" },
  locked: { face: "bg-zinc-200 dark:bg-zinc-700", edge: "bg-zinc-300 dark:bg-zinc-800", ink: "text-zinc-400" },
};

/** One stop on a learning path: a chunky round button with a 3D edge. */
export function LessonNode(props: {
  title: string;
  state: NodeState;
  stars: number;
  offset: number;
  color: string;
  onPress: () => void;
}) {
  const look = () => lookOf[props.state];
  const open = () => props.state === "open";
  const disc = { width: nodeSize, height: nodeSize };
  return (
    <View
      role="button"
      onPress={props.onPress}
      class="items-center active:opacity-80"
      style={{ transform: `translateX(${props.offset}px)` }}
      accessibilityLabel={`${props.title}, ${
        props.state === "done" ? `${props.stars} of 3 stars` : open() ? "start here" : "locked"
      }`}
    >
      <View class="h-12 justify-end items-center">
        <If when={open()}>
          <View class="items-center motion-safe:animate-bounce">
            <View class="rounded-xl px-3.5 py-1" style={{ backgroundColor: props.color }}>
              <Text class="font-extrabold tracking-widest text-white">START</Text>
            </View>
            <Text class="text-xs leading-3" style={{ color: props.color }}>
              {"\u25BC"}
            </Text>
          </View>
        </If>
      </View>
      <View class="items-center" style={{ width: nodeSize + 16, height: nodeSize + 22 }}>
        <If when={open()}>
          <View
            class="absolute top-2 rounded-full border-4 motion-safe:animate-ping"
            style={{ ...disc, borderColor: `${props.color}80` }}
          />
        </If>
        <View
          class={`absolute top-3.5 rounded-full ${look().edge}`}
          style={open() ? { ...disc, backgroundColor: darken(props.color, 0.45) } : disc}
        />
        <View
          class={`absolute top-2 rounded-full items-center justify-center p-2.5 ${look().face}`}
          style={open() ? { ...disc, backgroundColor: props.color } : disc}
        >
          <Text
            class={`font-extrabold line-clamp-1 ${look().ink}`}
            style={{ fontSize: props.state === "locked" ? 32 : 24 }}
            adjustsFontSizeToFit
          >
            {props.state === "locked" ? "\u{1F512}" : props.title}
          </Text>
        </View>
      </View>
      <View class="h-7 flex-row">
        <If when={props.state === "done"}>
          <Text class="text-2xl text-amber-500">{"\u2605".repeat(props.stars)}</Text>
          <Text class="text-2xl text-zinc-400">{"\u2606".repeat(3 - props.stars)}</Text>
        </If>
      </View>
    </View>
  );
}
