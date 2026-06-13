const BN = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(input: number | string): string {
  return String(input).replace(/\d/g, (d) => BN[Number(d)]);
}
