// Picker identities mapped to the established live catalog identities.
export const liveBatch2Id=id=>({
  'garden-hose':'coiled-garden-hose',
  'great-wall':'great-wall-of-china',
  neuschwanstein:'neuschwanstein-castle',
  glasses:'pair-of-glasses',
  petra:'petra-treasury',
  'subway-train':'subway-train-car',
  vacuum:'vacuum-cleaner',
}[id]||id);
