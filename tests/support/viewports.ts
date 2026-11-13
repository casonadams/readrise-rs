/** Phones every screen must hold on: iPhone SE (the shortest) and iPhone 15. */
export const viewports = [
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
] as const;

export type Viewport = (typeof viewports)[number];
