// --- Sticker Data ---

// HATCH STICKERS
const hatchFiles = [
  '02e0dea0-1dbe-48aa-96c0-b010864a40de.webp',
  '088dad90-1452-4180-ba0c-71991330e227.webp',
  '214a0548-b167-449f-8b5a-a1cf192d6cd2.webp',
  '37131513-8f62-4137-853a-89450fabcdaf.webp',
  '4073b7a5-de3e-4a6c-93fa-7b94e2e3e2b5.webp',
  '4489785e-1af6-4298-98fc-dd0dc14c53a0.webp',
  '466f39f8-c842-4194-b6f4-5869ced1fe03.webp',
  '485931ea-9865-4d70-aeff-9701590c572d.webp',
  '4fade08d-bf41-4ab3-a204-98c660d2e322.webp',
  '4fc3bd30-ef1d-4668-9120-b8622cf9728d.webp',
  '55b9fdd5-b49b-4b18-a766-980a4ad8f999.webp',
  '581487a6-ce97-4e1f-8e3b-2b81e8c2f15c.webp',
  '622e2f8a-7cae-4197-b3a2-cbc11c1be212.webp',
  '70c58f82-248c-45bc-8e94-2b8c748297e5.webp',
  '70e864ac-ca6a-4dc0-acb8-c5049c9f2f0e.webp',
  '73b0c784-fb2f-4f52-93bb-e1d245c83af1.webp',
  '7559b6e6-7c0d-4e9f-8c8a-5afaf2d6996e.webp',
  '78e7b946-1cbe-4771-890a-f52d4f77096a.webp',
  '85137cdf-8c58-49f7-9a34-4aadf1dbbb03.webp',
  '8d06122a-7c2d-451e-a265-c81878208d63.webp',
  '987413b4-1ed8-4f15-b66d-f55a9fe8982b.webp',
  '9887416b-655d-49f1-a249-da5b3df8e7fc.webp',
  '9f8394e6-ab1b-472c-95a7-093f77a0fecb.webp',
  'ab8bf267-51de-4379-b7f9-eccf1a7a499e.webp',
  'bba5bbcf-c813-4e56-993b-0449c2f92cea.webp',
  'bc3d7083-e7e6-40ff-8c21-4957333f43b0.webp',
  'c8cce595-e1dd-4c80-96d3-3c64e1b1515e.webp',
  'cdfc70ae-c9a0-4ba7-b80c-824c366c655c.webp',
  'd88e98b8-e929-478a-8b32-7d691eae9ad7.webp',
  'dbdf1447-de33-48cc-bd8a-d519cc73a612.webp',
  'dc82395a-0fc1-4651-a283-568296745298.webp',
  'de6be1db-e9f6-46e3-8af4-234dd5d1c255.webp',
  'e4c2e9e9-5fa2-4e4c-bfa4-f2aba6fe4827.webp',
  'eb9ad903-d383-4d5d-9bdf-b345dfca6f12.webp',
  'ed340d49-39a6-40ac-bd70-c7fd5d2d54d7.webp',
  'eda4b6a0-4d47-44ce-8b5c-803e42b2e6ea.webp',
  'f3a8a2d1-9aa5-42d0-a0ac-2a4208b14217.webp',
  'fb8cff50-2a19-4b0a-ab21-7953b6ec8bfb.webp',
  'ff4dbd9e-4bcb-4df9-b118-c05b2052f5e5.webp',
  'ffe28368-24bd-4173-b1da-3d6d25137600.webp',
];
export const HATCH_ARRAY = hatchFiles
  .map((file, index) => ({
    id: `hatch-${String(index + 1).padStart(2, '0')}`,
    img: `/assets/stickers/HATCH/${file}`,
    label: `Hatch ${String(index + 1).padStart(2, '0')}`,
    keywords: ['hatch', 'sticker', 'retro', 'chat'],
  }))
  .filter((sticker) => sticker.id !== 'hatch-19' && sticker.id !== 'hatch-27');

// SHIBA STICKERS
const shibaFiles = [
  'tile000.png',
  'tile001.png',
  'tile002.png',
  'tile003.png',
  'tile004.png',
  'tile005.png',
  'tile006.png',
  'tile007.png',
  'tile008.png',
  'tile009.png',
  'tile010.png',
  'tile011.png',
  'tile012.png',
  'tile013.png',
  'tile014.png',
];
export const SHIBA_ARRAY = shibaFiles.map((file, index) => ({
  id: `shiba-${String(index + 1).padStart(2, '0')}`,
  img: `/assets/stickers/SHIBA/${file}`,
  label: `Shiba ${String(index + 1).padStart(2, '0')}`,
  keywords: ['shiba', 'doge', 'perrito', 'meme'],
}));

// EMOJI STICKERS
export const EMOJI_ARRAY = [
  { id: 'emoji-01', img: '😀', label: 'Feliz' },
  { id: 'emoji-02', img: '😁', label: 'Risa' },
  { id: 'emoji-03', img: '😂', label: 'Lágrimas de risa' },
  { id: 'emoji-04', img: '😉', label: 'Guiño' },
  { id: 'emoji-05', img: '😍', label: 'Enamorado' },
  { id: 'emoji-06', img: '🥳', label: 'Fiesta' },
  { id: 'emoji-07', img: '😎', label: 'Cool' },
  { id: 'emoji-08', img: '🤔', label: 'Pensando' },
  { id: 'emoji-09', img: '😴', label: 'Sueño' },
  { id: 'emoji-10', img: '😭', label: 'Llorando' },
  { id: 'emoji-11', img: '😡', label: 'Molesto' },
  { id: 'emoji-12', img: '👍', label: 'Like' },
  { id: 'emoji-13', img: '👏', label: 'Aplausos' },
  { id: 'emoji-14', img: '🔥', label: 'Fuego' },
  { id: 'emoji-15', img: '🎉', label: 'Celebración' },
  { id: 'emoji-16', img: '❤️', label: 'Corazón' },
];

// --- Combined Data & Lookups ---

const ALL_STICKERS = [...HATCH_ARRAY, ...SHIBA_ARRAY];

export const STICKER_LOOKUP = ALL_STICKERS.reduce((acc, sticker) => {
  acc[sticker.id] = sticker;
  return acc;
}, {});

// --- UI Configuration ---

export const STICKER_TABS = [
  { id: 'hatch', label: 'Hatch', count: HATCH_ARRAY.length },
  { id: 'shiba', label: 'Shiba', count: SHIBA_ARRAY.length },
  { id: 'emoji', label: 'Emojis', count: EMOJI_ARRAY.length },
];

// --- Utility Functions ---

export function buildStickerToken(stickerId) {
  return `[[sticker:${stickerId}]]`;
}

export function parseStickerToken(value) {
  if (typeof value !== 'string') return null;

  // Lógica existente para stickers normales: [[sticker:ID]]
  const match = value.trim().match(/^\[\[sticker:([a-z0-9-]+)\]\]$/i);
  if (!match) return null;
  return STICKER_LOOKUP[match[1]] || null;
}
