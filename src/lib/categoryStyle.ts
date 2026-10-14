// Every category gets its own colour and illustration. With no product photos
// yet, this is what stops 117 rows reading as a spreadsheet - and it gives
// customers a shape to recognise when they scan the list on a phone.

export type IconKey =
  | "bomb"
  | "pot"
  | "chakkar"
  | "rocket"
  | "sparkler"
  | "fountain"
  | "shot"
  | "star"
  | "toy"
  | "gift"
  | "string";

export type CategoryStyle = { accent: string; soft: string; icon: IconKey };

const STYLES: Record<string, CategoryStyle> = {
  "ONE SOUND CRACKERS": { accent: "#ff6b6b", soft: "#ff6b6b22", icon: "bomb" },
  "FLOWER POTS": { accent: "#f5b544", soft: "#f5b54422", icon: "pot" },
  "GROUND CHAKKAR": { accent: "#4dd4ac", soft: "#4dd4ac22", icon: "chakkar" },
  BOMBS: { accent: "#ff8364", soft: "#ff836422", icon: "bomb" },
  "BIJILI CRACKERS": { accent: "#ffd166", soft: "#ffd16622", icon: "string" },
  ROCKETS: { accent: "#6ba8ff", soft: "#6ba8ff22", icon: "rocket" },
  "TWINKLING STAR & TORCH": { accent: "#c792ea", soft: "#c792ea22", icon: "star" },
  "FOUNTAIN & SIREN": { accent: "#45c4f5", soft: "#45c4f522", icon: "fountain" },
  "CHILDREN'S CHOICE": { accent: "#ff9ec7", soft: "#ff9ec722", icon: "toy" },
  "SINGLE SKY SHOTS": { accent: "#8ce99a", soft: "#8ce99a22", icon: "shot" },
  "REPEATING MULTI COLOR SHOTS": { accent: "#b197fc", soft: "#b197fc22", icon: "shot" },
  "WALA CRACKERS": { accent: "#ffa94d", soft: "#ffa94d22", icon: "string" },
  "DIWALI SPECIAL": { accent: "#ffd43b", soft: "#ffd43b22", icon: "star" },
  SPARKLERS: { accent: "#74c0fc", soft: "#74c0fc22", icon: "sparkler" },
  "SPECIAL GIFT BOX": { accent: "#f783ac", soft: "#f783ac22", icon: "gift" },
};

const FALLBACK: CategoryStyle = { accent: "#f5b544", soft: "#f5b54422", icon: "star" };

export function categoryStyle(name: string): CategoryStyle {
  return STYLES[name.toUpperCase()] ?? FALLBACK;
}
