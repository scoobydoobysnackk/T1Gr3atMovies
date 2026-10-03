// Small, word-boundary based profanity detector shared by the browser and server.
const WORDS = [
  "fuck", "fucking", "fucker", "fucked", "motherfucker", "shit", "shitty", "bullshit", "bitch", "bitches",
  "bastard", "asshole", "ass", "dick", "dicks", "cock", "pussy", "cunt", "whore", "slut", "damn",
  "goddamn", "piss", "pissed", "crap", "twat", "wanker", "bollocks", "prick", "fag", "faggot",
  "nigger", "nigga", "retard", "sex", "sexy", "porn", "nude", "naked", "orgy", "xxx", "horny",
];

const RE = new RegExp(`\\b(${WORDS.join("|")})\\b`, "gi");
// Catch simple leetspeak like "sh1t", "f*ck", "b!tch".
const LEET: Record<string, string> = { "1": "i", "!": "i", "3": "e", "4": "a", "@": "a", "0": "o", "$": "s", "5": "s", "*": "u" };
const normalize = (s: string) => s.toLowerCase().replace(/[1!34@0$5*]/g, (c) => LEET[c] ?? c);

export function hasProfanity(text: string | undefined | null): boolean {
  if (!text) return false;
  RE.lastIndex = 0;
  const hit = RE.test(normalize(text));
  RE.lastIndex = 0;
  return hit;
}

export function censor(text: string): string {
  const norm = normalize(text);
  let out = text;
  for (const m of norm.matchAll(RE)) {
    const i = m.index ?? 0;
    out = out.slice(0, i) + out[i] + "*".repeat(m[0].length - 1) + out.slice(i + m[0].length);
  }
  return out;
}
