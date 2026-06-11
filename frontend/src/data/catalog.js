// src/data/catalog.js
export const CATALOG = [
  {
    id: "p1",
    name: "Agate Clock",
    cat: "Clocks",
    price: 56,
    salePrice: 49,
    image: "/best/best1.jpg",
    gallery: ["/best/best1.jpg", "/best/best6.jpg", "/best/best9.jpg"],
    short: "Handcrafted agate-inspired resin wall clock.",
    description:
      "Each Agate Clock is hand-poured in small batches, featuring layered resin that mimics natural agate bands. Finished with premium clock movement and protective top coat.",
    specs: {
      Size: "30cm diameter",
      Materials: "Epoxy resin, pigments, quartz sand",
      Finish: "UV-resistant gloss",
      Care: "Wipe with soft microfiber cloth",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 10 },
          { label: "L", priceDelta: 20 },
          { label: "XL", priceDelta: 35 },
        ],
      },
    ],
  },

  {
    id: "p2",
    name: "Ocean Table",
    cat: "Tables",
    price: 420,
    image: "/best/best3.jpg",
    gallery: ["/best/best3.jpg", "/best/best8.jpg"],
    short: "Ocean-inspired coffee table with depth effect.",
    description:
      "Multi-layer ocean pour for realistic depth and foam, sealed on a sturdy wood base. Custom sizing and leg finishes available.",
    specs: {
      Size: "100×55×45cm",
      Materials: "Epoxy resin, wood base, pigments",
      Finish: "Satin top coat",
      Care: "Coasters recommended; avoid heat > 60°C",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 40 },
          { label: "L", priceDelta: 80 },
          { label: "XL", priceDelta: 140 },
        ],
      },
    ],
  },

  {
    id: "p3",
    name: "Forest Coasters",
    cat: "Coasters",
    price: 42,
    salePrice: 36,
    image: "/best/best5.jpg",
    gallery: ["/best/best5.jpg", "/best/best11.jpg"],
    short: "Set of 4 nature-toned coasters.",
    description:
      "A set of four coasters with earthy tones and subtle metallic accents. Each piece is unique with natural variations.",
    specs: {
      Size: "10×10cm (x4)",
      Materials: "Epoxy resin, mica powders",
      Finish: "Semi-gloss",
      Care: "Hand-wash, avoid dishwasher",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 5 },
          { label: "L", priceDelta: 10 },
          { label: "XL", priceDelta: 15 },
        ],
      },
    ],
  },

  {
    id: "p4",
    name: "Marble Coasters",
    cat: "Coasters",
    price: 39,
    image: "/best/best9.jpg",
    gallery: ["/best/best9.jpg"],
    short: "Classic white-marble look, set of 4.",
    description:
      "Minimal marble effect with gold veining, sealed for daily use. Perfect gift-ready packaging.",
    specs: {
      Size: "10×10cm (x4)",
      Materials: "Epoxy resin, gold leaf",
      Finish: "Gloss",
      Care: "Hand-wash, avoid abrasives",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 5 },
          { label: "L", priceDelta: 10 },
          { label: "XL", priceDelta: 15 },
        ],
      },
    ],
  },

  {
    id: "p5",
    name: "Galaxy Tray",
    cat: "Trays",
    price: 68,
    image: "/best/best7.jpg",
    gallery: ["/best/best7.jpg"],
    short: "Deep galaxy swirl serving tray.",
    description:
      "Rich pigments with starry accents. Lightweight yet durable, with soft feet underneath.",
    specs: {
      Size: "35×22cm",
      Materials: "Epoxy resin, pigments, glitter",
      Finish: "Gloss",
      Care: "Wipe clean, avoid sharp knives",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 5 },
          { label: "L", priceDelta: 10 },
          { label: "XL", priceDelta: 18 },
        ],
      },
    ],
  },

  {
    id: "p6",
    name: "Rose Quartz Clock",
    cat: "Clocks",
    price: 74,
    salePrice: 62,
    image: "/best/best6.jpg",
    gallery: ["/best/best6.jpg", "/best/best1.jpg"],
    short: "Soft pink crystal look with gold details.",
    description:
      "Elegant pink layers with subtle gold veins. Smooth sweep second hand and silent movement.",
    specs: {
      Size: "30cm diameter",
      Materials: "Epoxy resin, pigments",
      Finish: "High-gloss",
      Care: "Wipe with soft cloth",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 10 },
          { label: "L", priceDelta: 20 },
          { label: "XL", priceDelta: 30 },
        ],
      },
    ],
  },

  {
    id: "p7",
    name: "Aurora Wall Art",
    cat: "Wall Art",
    price: 120,
    image: "/best/best8.jpg",
    gallery: ["/best/best8.jpg", "/best/best3.jpg"],
    short: "Shimmering pigments that shift like auroras.",
    description:
      "Multi-layer piece with iridescent pigments that change with light. Ready to hang.",
    specs: {
      Size: "60×40cm",
      Materials: "Epoxy resin on wood panel",
      Finish: "Gloss",
      Care: "Dust with dry microfiber cloth",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 10 },
          { label: "L", priceDelta: 20 },
          { label: "XL", priceDelta: 40 },
        ],
      },
    ],
  },

  {
    id: "p8",
    name: "Resin Keychain Set",
    cat: "Keychains",
    price: 18,
    image: "/best/best2.jpg",
    gallery: ["/best/best2.jpg"],
    short: "Personalized initials with glitter options.",
    description:
      "Cute letter keychains. Choose your favorite colors and flakes.",
    specs: {
      Size: "4–5cm (per letter)",
      Materials: "Epoxy resin, key ring",
      Finish: "Gloss",
      Care: "Avoid solvents",
      Origin: "Made in Lebanon",
    },
  },

  {
    id: "p9",
    name: "Gold Name Sign",
    cat: "Name Signs",
    price: 95,
    salePrice: 79,
    image: "/best/best4.jpg",
    gallery: ["/best/best4.jpg"],
    short: "Custom name sign with gold finish.",
    description:
      "Elegant name sign with metallic gold finish. Perfect for rooms and events.",
    specs: {
      Size: "Up to 60cm width",
      Materials: "Epoxy resin, gold powder",
      Finish: "Gloss",
      Care: "Dust gently",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 10 },
          { label: "L", priceDelta: 20 },
          { label: "XL", priceDelta: 30 },
        ],
      },
    ],
  },

  {
    id: "p10",
    name: "Opal Pendant",
    cat: "Jewelry",
    price: 34,
    image: "/best/best10.jpg",
    gallery: ["/best/best10.jpg"],
    short: "Opalescent resin pendant with subtle shimmer.",
    description:
      "Lightweight pendant with iridescent flakes. Comes with adjustable chain.",
    specs: {
      Size: "Pendant ~3cm",
      Materials: "Epoxy resin, chain",
      Finish: "Gloss",
      Care: "Avoid water and perfume",
      Origin: "Made in Lebanon",
    },
  },

  {
    id: "p11",
    name: "Ocean Tray Set",
    cat: "Trays & Sets",
    price: 88,
    salePrice: 79,
    image: "/best/best11.jpg",
    gallery: ["/best/best11.jpg", "/best/best7.jpg"],
    short: "Tray + coasters with matching ocean pour.",
    description:
      "A coordinated set featuring one serving tray and four coasters with ocean waves.",
    specs: {
      Size: "Tray 35×22cm + 4 coasters",
      Materials: "Epoxy resin, pigments",
      Finish: "Gloss",
      Care: "Wipe clean, avoid harsh pads",
      Origin: "Made in Lebanon",
    },
    options: [
      {
        label: "Size",
        required: true,
        values: [
          { label: "S" },
          { label: "M", priceDelta: 10 },
          { label: "L", priceDelta: 20 },
          { label: "XL", priceDelta: 35 },
        ],
      },
    ],
  },
];

// tiny helper
export function getProductById(id) {
  return CATALOG.find((p) => p.id === id);
}
