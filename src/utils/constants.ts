/** Pokémon type → Tailwind bg/text colour classes */
export const TYPE_COLORS: Record<string, string> = {
  Normal:   'bg-[#A8A77A] text-white',
  Feuer:    'bg-[#EE8130] text-white',
  Wasser:   'bg-[#6390F0] text-white',
  Elektro:  'bg-[#F7D02C] text-black',
  Pflanze:  'bg-[#7AC74C] text-white',
  Eis:      'bg-[#96D9D6] text-black',
  Kampf:    'bg-[#C22E28] text-white',
  Gift:     'bg-[#A33EA1] text-white',
  Boden:    'bg-[#E2BF65] text-black',
  Flug:     'bg-[#A98FF3] text-white',
  Psycho:   'bg-[#F95587] text-white',
  Käfer:    'bg-[#A6B91A] text-white',
  Gestein:  'bg-[#B6A136] text-white',
  Geist:    'bg-[#735797] text-white',
  Drache:   'bg-[#6F35FC] text-white',
  Unlicht:  'bg-[#705746] text-white',
  Stahl:    'bg-[#B7B7CE] text-black',
  Fee:      'bg-[#D685AD] text-white',
  Stellar:  'bg-[#4A90D9] text-white',
};

export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  USED: 'Verwendet',
  USED_AND_WILL_BE_OPENED_LATER: 'Später wieder offen',
  LEGENDARY: 'Legendär',
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-600 text-white',
  USED: 'bg-red-600 text-white',
  USED_AND_WILL_BE_OPENED_LATER: 'bg-amber-500 text-black',
  LEGENDARY: 'bg-purple-600 text-white',
};

export const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
