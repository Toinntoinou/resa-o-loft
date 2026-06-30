// Référence courte et lisible communiquée au client, ex. "LOFT-7K3QXP".
// Caractères sans ambiguïté (pas de 0/O ni 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `LOFT-${s}`;
}
