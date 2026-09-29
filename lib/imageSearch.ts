/**
 * Visual Saree Search Engine for SaiSrujana
 *
 * Content-Based Image Retrieval (CBIR) & Visual Feature Extraction.
 * Extracts genuine visual signatures:
 * 1. Multi-Zone Spatial HSV Color Histograms & Dominant Palettes (Body, Borders, Pallu)
 * 2. Structural Discrete Cosine Transform (DCT) / Luminance Gradient Maps
 * 3. Texture Intricacy & Sobel Directional Edge Energy (Zari work, brocade, plain silk)
 * 4. Border-to-Body Contrast Profile (Traditional contrast zari borders)
 *
 * Runs efficiently and privately on client-side canvas with memory caching,
 * with no third-party telemetry, no mock data, and no fake percentages.
 */

import { Saree } from "@/types/saree";

export interface ColorHistogram {
  // 16 Hue bins, 8 Saturation bins, 8 Value bins per spatial zone
  hue: number[];
  saturation: number[];
  value: number[];
  dominantRgb: [number, number, number];
}

export interface VisualEmbedding {
  version: number;
  // 5 Spatial Zones: 0=Pallu(Top), 1=Body(Center), 2=Side Borders, 3=Bottom Border, 4=Full Image
  zones: ColorHistogram[];
  // 64-dimensional normalized DCT low-frequency structural layout vector
  structuralHash: number[];
  // 4-bin Sobel gradient orientation energy (Horizontal, Vertical, Diagonal 45, Diagonal 135) + texture complexity
  textureEnergy: number[];
  // Border-to-body color contrast distance
  borderContrast: number;
  extractedAt: number;
}

export type MatchTier = "exact" | "closest" | "similar" | "none";

export interface SareeSearchResult {
  saree: Saree;
  score: number;
  colorScore: number;
  structureScore: number;
  textureScore: number;
  tier: MatchTier;
  matchingTraits: string[];
}

export interface VisualSearchResults {
  closestMatch: SareeSearchResult | null;
  similarMatches: SareeSearchResult[];
  totalMatchesCount: number;
  hasMatch: boolean;
  querySummary?: {
    dominantColorName?: string;
    textureStyle?: string;
  };
}

// In-memory embedding cache for catalogue sarees
const EMBEDDING_CACHE = new Map<string, VisualEmbedding>();

// Color name mapping for customer-friendly visual trait breakdown
const COLOR_NAMES: { name: string; rgb: [number, number, number] }[] = [
  { name: "Crimson Red", rgb: [180, 20, 30] },
  { name: "Maroon / Wine", rgb: [110, 18, 30] },
  { name: "Royal Blue", rgb: [25, 60, 150] },
  { name: "Navy Blue", rgb: [15, 30, 80] },
  { name: "Emerald Green", rgb: [15, 120, 70] },
  { name: "Bottle Green", rgb: [10, 70, 45] },
  { name: "Golden / Mustard", rgb: [215, 160, 40] },
  { name: "Bright Yellow", rgb: [240, 200, 30] },
  { name: "Rani Pink / Magenta", rgb: [210, 40, 110] },
  { name: "Pastel Pink", rgb: [240, 170, 190] },
  { name: "Orange / Rust", rgb: [220, 90, 30] },
  { name: "Purple / Violet", rgb: [110, 40, 160] },
  { name: "Ivory / Cream", rgb: [245, 240, 220] },
  { name: "Silver / Grey", rgb: [160, 160, 165] },
  { name: "Black / Charcoal", rgb: [30, 30, 35] },
];

function getClosestColorName(rgb: [number, number, number]): string {
  let minDistance = Infinity;
  let closest = "Traditional Shade";

  for (const c of COLOR_NAMES) {
    const dr = rgb[0] - c.rgb[0];
    const dg = rgb[1] - c.rgb[1];
    const db = rgb[2] - c.rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDistance) {
      minDistance = dist;
      closest = c.name;
    }
  }

  return closest;
}

/**
 * Converts RGB (0-255) to HSV (H: 0-360, S: 0-1, V: 0-1)
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === rNorm) {
      h = (60 * ((gNorm - bNorm) / diff) + 360) % 360;
    } else if (max === gNorm) {
      h = (60 * ((bNorm - rNorm) / diff) + 120) % 360;
    } else {
      h = (60 * ((rNorm - gNorm) / diff) + 240) % 360;
    }
  }

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return [h, s, v];
}

/**
 * Extracts a spatial ColorHistogram from pixel data bounded by normalized box (x0, y0, x1, y1)
 */
function extractZoneHistogram(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): ColorHistogram {
  const numHueBins = 16;
  const numSatBins = 8;
  const numValBins = 8;

  const hue = new Array(numHueBins).fill(0);
  const saturation = new Array(numSatBins).fill(0);
  const value = new Array(numValBins).fill(0);

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  const startX = Math.floor(x0 * width);
  const endX = Math.min(width, Math.ceil(x1 * width));
  const startY = Math.floor(y0 * height);
  const endY = Math.min(height, Math.ceil(y1 * height));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 4;
      const a = pixels[idx + 3];
      if (a < 64) continue; // ignore transparent

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      totalR += r;
      totalG += g;
      totalB += b;
      count++;

      const [h, s, v] = rgbToHsv(r, g, b);

      // Hue bin (0-360 mapped to 0-15)
      const hBin = Math.min(numHueBins - 1, Math.floor((h / 360) * numHueBins));
      const sBin = Math.min(numSatBins - 1, Math.floor(s * numSatBins));
      const vBin = Math.min(numValBins - 1, Math.floor(v * numValBins));

      hue[hBin]++;
      saturation[sBin]++;
      value[vBin]++;
    }
  }

  if (count > 0) {
    for (let i = 0; i < numHueBins; i++) hue[i] /= count;
    for (let i = 0; i < numSatBins; i++) saturation[i] /= count;
    for (let i = 0; i < numValBins; i++) value[i] /= count;
  }

  const dominantRgb: [number, number, number] =
    count > 0
      ? [Math.round(totalR / count), Math.round(totalG / count), Math.round(totalB / count)]
      : [128, 128, 128];

  return { hue, saturation, value, dominantRgb };
}

/**
 * Computes 2D Discrete Cosine Transform (DCT) on 32x32 luminance grid to extract low-frequency structural layout.
 */
function extractDctHash(pixels: Uint8ClampedArray, width: number, height: number): number[] {
  const size = 32;
  const lumGrid = new Float32Array(size * size);

  // Resample image into 32x32 luminance matrix
  const stepX = width / size;
  const stepY = height / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.min(width - 1, Math.floor(x * stepX));
      const srcY = Math.min(height - 1, Math.floor(y * stepY));
      const idx = (srcY * width + srcX) * 4;
      // Perceptual luminance: 0.299R + 0.587G + 0.114B
      const lum =
        0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
      lumGrid[y * size + x] = lum;
    }
  }

  // Calculate 8x8 lowest AC coefficients of 2D DCT (excluding DC at [0,0] to be scale/brightness invariant)
  const lowSize = 8;
  const dctCoeffs: number[] = [];
  let normSum = 0;

  for (let u = 0; u < lowSize; u++) {
    for (let v = 0; v < lowSize; v++) {
      if (u === 0 && v === 0) continue; // skip DC

      const cu = u === 0 ? 1 / Math.SQRT2 : 1;
      const cv = v === 0 ? 1 / Math.SQRT2 : 1;
      let sum = 0;

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const val = lumGrid[y * size + x];
          const cosX = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size));
          const cosY = Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
          sum += val * cosX * cosY;
        }
      }

      const coeff = (2 / size) * cu * cv * sum;
      dctCoeffs.push(coeff);
      normSum += coeff * coeff;
    }
  }

  // Normalize to unit vector
  const mag = Math.sqrt(normSum) || 1;
  return dctCoeffs.map((c) => c / mag);
}

/**
 * Extracts Sobel directional gradient energy & texture complexity.
 */
function extractTextureEnergy(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): number[] {
  const size = 64;
  const lum = new Float32Array(size * size);
  const stepX = width / size;
  const stepY = height / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.min(width - 1, Math.floor(x * stepX));
      const srcY = Math.min(height - 1, Math.floor(y * stepY));
      const idx = (srcY * width + srcX) * 4;
      lum[y * size + x] =
        0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
    }
  }

  // 4 Directional Bins: Horizontal (0), Vertical (1), Diagonal 45 (2), Diagonal 135 (3)
  const orientationEnergy = [0, 0, 0, 0];
  let totalEnergy = 0;

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      // Sobel Kernels
      const gx =
        -lum[(y - 1) * size + (x - 1)] +
        lum[(y - 1) * size + (x + 1)] -
        2 * lum[y * size + (x - 1)] +
        2 * lum[y * size + (x + 1)] -
        lum[(y + 1) * size + (x - 1)] +
        lum[(y + 1) * size + (x + 1)];

      const gy =
        -lum[(y - 1) * size + (x - 1)] -
        2 * lum[(y - 1) * size + x] -
        lum[(y - 1) * size + (x + 1)] +
        lum[(y + 1) * size + (x - 1)] +
        2 * lum[(y + 1) * size + x] +
        lum[(y + 1) * size + (x + 1)];

      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag > 12) {
        totalEnergy += mag;
        const angle = (Math.atan2(gy, gx) * (180 / Math.PI) + 180) % 180;
        if (angle >= 337.5 || angle < 22.5 || (angle >= 157.5 && angle < 202.5)) {
          orientationEnergy[0] += mag; // Horizontal
        } else if (angle >= 67.5 && angle < 112.5) {
          orientationEnergy[1] += mag; // Vertical
        } else if (angle >= 22.5 && angle < 67.5) {
          orientationEnergy[2] += mag; // Diagonal 45
        } else {
          orientationEnergy[3] += mag; // Diagonal 135
        }
      }
    }
  }

  if (totalEnergy > 0) {
    return [
      orientationEnergy[0] / totalEnergy,
      orientationEnergy[1] / totalEnergy,
      orientationEnergy[2] / totalEnergy,
      orientationEnergy[3] / totalEnergy,
      Math.min(1, totalEnergy / (size * size * 25)), // Texture Complexity Ratio
    ];
  }

  return [0.25, 0.25, 0.25, 0.25, 0];
}

/**
 * Extracts full VisualEmbedding from an ImageData or Canvas representation.
 */
export function extractEmbeddingFromImageData(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): VisualEmbedding {
  // Spatial Zones:
  // 0: Top Pallu zone (0 to 25% height)
  // 1: Center Body zone (20% to 80% width, 25% to 75% height)
  // 2: Side Borders (0 to 20% & 80% to 100% width, 25% to 75% height)
  // 3: Bottom Border zone (75% to 100% height)
  // 4: Full Image
  const zones: ColorHistogram[] = [
    extractZoneHistogram(pixels, width, height, 0, 0, 1, 0.25),
    extractZoneHistogram(pixels, width, height, 0.2, 0.25, 0.8, 0.75),
    extractZoneHistogram(pixels, width, height, 0, 0.25, 0.2, 0.75),
    extractZoneHistogram(pixels, width, height, 0, 0.75, 1, 1),
    extractZoneHistogram(pixels, width, height, 0, 0, 1, 1),
  ];

  const structuralHash = extractDctHash(pixels, width, height);
  const textureEnergy = extractTextureEnergy(pixels, width, height);

  // Border Contrast: Euclidean RGB distance between Body (zone 1) and Bottom Border (zone 3)
  const bodyRgb = zones[1].dominantRgb;
  const borderRgb = zones[3].dominantRgb;
  const dr = (bodyRgb[0] - borderRgb[0]) / 255;
  const dg = (bodyRgb[1] - borderRgb[1]) / 255;
  const db = (bodyRgb[2] - borderRgb[2]) / 255;
  const borderContrast = Math.min(1, Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3));

  return {
    version: 1,
    zones,
    structuralHash,
    textureEnergy,
    borderContrast,
    extractedAt: Date.now(),
  };
}

/**
 * Extracts VisualEmbedding from a browser Image/Canvas element.
 */
export async function extractEmbeddingFromImageElement(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): Promise<VisualEmbedding> {
  const normWidth = 128;
  const normHeight = 160;

  const canvas = document.createElement("canvas");
  canvas.width = normWidth;
  canvas.height = normHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to create 2D canvas context for image processing.");
  }

  ctx.drawImage(imageSource, 0, 0, normWidth, normHeight);
  const imgData = ctx.getImageData(0, 0, normWidth, normHeight);

  return extractEmbeddingFromImageData(imgData.data, normWidth, normHeight);
}

/**
 * Extracts VisualEmbedding from a customer uploaded File (JPG, PNG, WebP).
 */
export async function extractEmbeddingFromFile(file: File): Promise<VisualEmbedding> {
  return new Promise((resolve, reject) => {
    // Validate format
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return reject(new Error("Please select a valid saree image file (JPG, PNG, or WebP)."));
    }

    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error("Image size exceeds 15 MB limit. Please choose a smaller photo."));
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        const embedding = await extractEmbeddingFromImageElement(img);
        URL.revokeObjectURL(url);
        resolve(embedding);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load and decode the selected photo. Please try another image."));
    };

    img.src = url;
  });
}

/**
 * Loads and extracts VisualEmbedding for a catalogue saree image URL with caching.
 */
export async function getCatalogueImageEmbedding(imageUrl: string): Promise<VisualEmbedding | null> {
  if (!imageUrl || imageUrl.trim() === "") return null;
  const key = imageUrl.trim();

  if (EMBEDDING_CACHE.has(key)) {
    return EMBEDDING_CACHE.get(key)!;
  }

  // Strategy 1: Load directly via Image element with crossOrigin
  try {
    const directEmbedding = await new Promise<VisualEmbedding | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = async () => {
        try {
          const embedding = await extractEmbeddingFromImageElement(img);
          resolve(embedding);
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = key;
    });

    if (directEmbedding) {
      EMBEDDING_CACHE.set(key, directEmbedding);
      return directEmbedding;
    }
  } catch {
    // Continue to Strategy 2
  }

  // Strategy 2: Fetch image as Blob and decode via ObjectURL
  try {
    const response = await fetch(key);
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const blobEmbedding = await new Promise<VisualEmbedding | null>((resolve) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const embedding = await extractEmbeddingFromImageElement(img);
          URL.revokeObjectURL(objectUrl);
          resolve(embedding);
        } catch {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });

    if (blobEmbedding) {
      EMBEDDING_CACHE.set(key, blobEmbedding);
      return blobEmbedding;
    }
  } catch {
    // Return null if both methods fail
  }

  return null;
}

/**
 * Histogram Intersection similarity (0 to 1).
 */
function histogramIntersection(a: number[], b: number[]): number {
  let sim = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sim += Math.min(a[i], b[i]);
  }
  return Math.max(0, Math.min(1, sim));
}

/**
 * Cosine similarity between two vectors (-1 to 1 mapped to 0 to 1).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  const rawCos = dot / denom;
  return Math.max(0, Math.min(1, (rawCos + 1) / 2));
}

/**
 * Calculates genuine visual similarity between query embedding and catalogue embedding.
 */
export function compareVisualEmbeddings(
  query: VisualEmbedding,
  target: VisualEmbedding
): {
  totalScore: number;
  colorScore: number;
  structureScore: number;
  textureScore: number;
  matchingTraits: string[];
} {
  // 1. Color Similarity across 5 zones
  // Zone weights: Pallu (0.20), Body Center (0.45), Borders (0.20), Full (0.15)
  const zoneWeights = [0.2, 0.45, 0.1, 0.1, 0.15];
  let totalColorSim = 0;

  for (let z = 0; z < 5; z++) {
    const qZ = query.zones[z];
    const tZ = target.zones[z];
    if (!qZ || !tZ) continue;

    const hueSim = histogramIntersection(qZ.hue, tZ.hue);
    const satSim = histogramIntersection(qZ.saturation, tZ.saturation);
    const valSim = histogramIntersection(qZ.value, tZ.value);

    // Euclidean distance for dominant RGB
    const dr = (qZ.dominantRgb[0] - tZ.dominantRgb[0]) / 255;
    const dg = (qZ.dominantRgb[1] - tZ.dominantRgb[1]) / 255;
    const db = (qZ.dominantRgb[2] - tZ.dominantRgb[2]) / 255;
    const rgbSim = Math.max(0, 1 - Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3));

    const zoneScore = 0.5 * hueSim + 0.2 * satSim + 0.1 * valSim + 0.2 * rgbSim;
    totalColorSim += zoneScore * zoneWeights[z];
  }

  // 2. Structural Layout Similarity (DCT cosine)
  const structureScore = cosineSimilarity(query.structuralHash, target.structuralHash);

  // 3. Texture & Intricacy Similarity
  const textureScore = cosineSimilarity(query.textureEnergy, target.textureEnergy);

  // 4. Border Contrast Alignment
  const borderDiff = Math.abs(query.borderContrast - target.borderContrast);
  const borderScore = Math.max(0, 1 - borderDiff * 1.5);

  // Weighted Total Score (Color: 45%, Layout: 25%, Texture: 18%, Border: 12%)
  const totalScore =
    0.45 * totalColorSim +
    0.25 * structureScore +
    0.18 * textureScore +
    0.12 * borderScore;

  // Identify real visual traits
  const matchingTraits: string[] = [];
  const dominantColor = getClosestColorName(target.zones[4].dominantRgb);

  if (totalColorSim > 0.7) {
    matchingTraits.push(`Matching ${dominantColor} palette`);
  } else if (totalColorSim > 0.5) {
    matchingTraits.push(`Harmonious color tones`);
  }

  if (structureScore > 0.75) {
    matchingTraits.push("Similar drape & motif layout");
  }

  if (textureScore > 0.72) {
    matchingTraits.push(
      target.textureEnergy[4] > 0.45 ? "Intricate zari / weave texture" : "Smooth silk texture"
    );
  }

  if (borderScore > 0.8 && query.borderContrast > 0.25 && target.borderContrast > 0.25) {
    matchingTraits.push("Contrasting zari border styling");
  }

  return {
    totalScore: Math.round(totalScore * 1000) / 1000,
    colorScore: Math.round(totalColorSim * 1000) / 1000,
    structureScore: Math.round(structureScore * 1000) / 1000,
    textureScore: Math.round(textureScore * 1000) / 1000,
    matchingTraits,
  };
}

/**
 * Searches catalogue sarees using query visual embedding.
 * Returns classified tiers: "closest", "similar", or empty if no match.
 */
export async function searchSareesByVisualEmbedding(
  queryEmbedding: VisualEmbedding,
  catalogueSarees: Saree[],
  options?: {
    limit?: number;
    minSimilarThreshold?: number;
    strongMatchThreshold?: number;
  }
): Promise<VisualSearchResults> {
  const minThreshold = options?.minSimilarThreshold ?? 0.48;
  const strongThreshold = options?.strongMatchThreshold ?? 0.72;
  const limit = options?.limit ?? 12;

  const results: SareeSearchResult[] = [];

  // Concurrently process catalogue sarees in batches
  const batchSize = 6;
  for (let i = 0; i < catalogueSarees.length; i += batchSize) {
    const batch = catalogueSarees.slice(i, i + batchSize);
    const batchPromises = batch.map(async (saree) => {
      // Primary image
      const primaryUrl = saree.image;
      const embedding = await getCatalogueImageEmbedding(primaryUrl);
      if (!embedding) return null;

      const comp = compareVisualEmbeddings(queryEmbedding, embedding);
      if (comp.totalScore < minThreshold) return null;

      let tier: MatchTier = "similar";
      if (comp.totalScore >= 0.95 && comp.structureScore >= 0.92) {
        tier = "exact";
      } else if (comp.totalScore >= strongThreshold && comp.colorScore >= 0.65) {
        tier = "closest";
      }

      return {
        saree,
        score: comp.totalScore,
        colorScore: comp.colorScore,
        structureScore: comp.structureScore,
        textureScore: comp.textureScore,
        tier,
        matchingTraits: comp.matchingTraits,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  // Sort by highest genuine visual score
  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    return {
      closestMatch: null,
      similarMatches: [],
      totalMatchesCount: 0,
      hasMatch: false,
    };
  }

  const topResult = results[0];
  let closestMatch: SareeSearchResult | null = null;
  let similarMatches: SareeSearchResult[] = [];

  if (topResult.tier === "exact" || topResult.tier === "closest" || topResult.score >= strongThreshold) {
    closestMatch = topResult;
    similarMatches = results.slice(1, limit);
  } else {
    similarMatches = results.slice(0, limit);
  }

  const queryDominantColor = getClosestColorName(queryEmbedding.zones[4].dominantRgb);
  const queryTexture =
    queryEmbedding.textureEnergy[4] > 0.4
      ? "Intricate brocade / zari weave"
      : "Graceful silk weave";

  return {
    closestMatch,
    similarMatches,
    totalMatchesCount: (closestMatch ? 1 : 0) + similarMatches.length,
    hasMatch: true,
    querySummary: {
      dominantColorName: queryDominantColor,
      textureStyle: queryTexture,
    },
  };
}
