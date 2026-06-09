export const COMPS: Record<string, { p: number; c: string }[]> = {
  "cast iron": [
    { p: 28, c: "Good" },
    { p: 42, c: "Excellent" },
    { p: 35, c: "Good" },
    { p: 22, c: "Fair" },
    { p: 48, c: "Excellent" },
  ],
  skillet: [
    { p: 32, c: "Good" },
    { p: 45, c: "Excellent" },
    { p: 28, c: "Fair" },
    { p: 38, c: "Good" },
    { p: 55, c: "Excellent" },
  ],
  quilt: [
    { p: 65, c: "Good" },
    { p: 120, c: "Excellent" },
    { p: 45, c: "Fair" },
    { p: 85, c: "Good" },
    { p: 95, c: "Good" },
  ],
  "milk glass": [
    { p: 18, c: "Good" },
    { p: 28, c: "Excellent" },
    { p: 12, c: "Fair" },
    { p: 22, c: "Good" },
    { p: 32, c: "Excellent" },
  ],
  enamelware: [
    { p: 35, c: "Good" },
    { p: 48, c: "Excellent" },
    { p: 25, c: "Fair" },
    { p: 42, c: "Good" },
    { p: 55, c: "Excellent" },
  ],
  "oil lamp": [
    { p: 42, c: "Good" },
    { p: 65, c: "Excellent" },
    { p: 30, c: "Fair" },
    { p: 55, c: "Good" },
    { p: 72, c: "Excellent" },
  ],
  "mason jar": [
    { p: 12, c: "Good" },
    { p: 20, c: "Excellent" },
    { p: 8, c: "Fair" },
    { p: 18, c: "Good" },
    { p: 25, c: "Excellent" },
  ],
  crock: [
    { p: 28, c: "Good" },
    { p: 45, c: "Excellent" },
    { p: 18, c: "Fair" },
    { p: 35, c: "Good" },
    { p: 52, c: "Excellent" },
  ],
  watering: [
    { p: 35, c: "Good" },
    { p: 55, c: "Excellent" },
    { p: 22, c: "Fair" },
    { p: 45, c: "Good" },
    { p: 62, c: "Excellent" },
  ],
  "barn wood": [
    { p: 22, c: "Good" },
    { p: 35, c: "Excellent" },
    { p: 14, c: "Fair" },
    { p: 28, c: "Good" },
    { p: 40, c: "Excellent" },
  ],
};

export function getComps(q: string): { p: number; c: string }[] {
  const lower = q.toLowerCase();
  for (const [key, val] of Object.entries(COMPS)) {
    if (lower.includes(key) || key.includes(lower.split(" ")[0] ?? "")) {
      return val;
    }
  }
  const b = 18 + Math.floor(Math.random() * 35);
  return [
    { p: b, c: "Good" },
    { p: b + 14, c: "Excellent" },
    { p: b - 5, c: "Fair" },
    { p: b + 4, c: "Good" },
    { p: b + 8, c: "Good" },
  ];
}
