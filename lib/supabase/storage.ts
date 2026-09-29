import { SupabaseClient } from "@supabase/supabase-js";

export const SAREE_IMAGES_BUCKET = "saree-images";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageUploadResult {
  publicUrl: string | null;
  filePath: string | null;
  error: string | null;
}

/**
 * Validates a saree photograph file for allowed MIME types and reasonable size (max 5MB).
 */
export function validateSareeImage(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: "Please select an image file to upload." };
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(fileName);
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(fileType);

  if (!hasValidMime && !hasValidExtension) {
    return {
      valid: false,
      error:
        "Unsupported image format. Please upload a JPG, JPEG, PNG, or WebP photograph.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size is ${sizeMb} MB, which exceeds the 5 MB maximum limit. Please compress or choose a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a validated saree photograph to the Supabase `saree-images` bucket.
 * Generates a collision-safe path using SKU and timestamp, then retrieves the public URL.
 *
 * Verifies current Supabase Auth session with `supabase.auth.getSession()` before uploading.
 * Ensures the authenticated user's session JWT is preserved during upload.
 */
export async function uploadSareeImage(
  file: File,
  sku: string,
  supabaseClient: SupabaseClient
): Promise<ImageUploadResult> {
  const validation = validateSareeImage(file);
  if (!validation.valid) {
    return {
      publicUrl: null,
      filePath: null,
      error: validation.error || "Invalid image file.",
    };
  }

  // 1. Verify the current Supabase Auth session before uploading
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("Supabase Auth getSession() error before upload:", sessionError);
    return {
      publicUrl: null,
      filePath: null,
      error: `Authentication session error: ${sessionError.message}`,
    };
  }

  const session = sessionData?.session;
  if (!session || !session.access_token) {
    console.error("No active Supabase Auth session found before upload.");
    return {
      publicUrl: null,
      filePath: null,
      error:
        "No active authenticated admin session found. Please sign in to the admin portal.",
    };
  }

  console.log("Supabase Auth session verified for admin upload:", {
    userEmail: session.user.email,
    userId: session.user.id,
    tokenExpiresAt: session.expires_at,
  });

  try {
    const sanitizedSku = (sku || "saree")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/^-+|-+$/g, "");

    const fileExt =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg");

    const uniqueId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 10);

    const fileName = `${sanitizedSku}-${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `catalogue/${fileName}`;

    // Normalize MIME type to standard types accepted by Supabase bucket:
    // ['image/jpeg', 'image/png', 'image/webp']
    let mimeType = file.type?.toLowerCase() || "image/jpeg";
    if (mimeType === "image/jpg") {
      mimeType = "image/jpeg";
    }

    // Prepare upload options:
    // - upsert: false ensures a pure INSERT operation matching the storage.objects INSERT policy.
    // - headers: { Authorization: `Bearer ${session.access_token}` } preserves the authenticated user's session JWT
    //   (never the publishable/anon key).
    const uploadOptions = {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    };

    console.log(`Uploading photograph to ${SAREE_IMAGES_BUCKET}/${filePath}...`, {
      fileName,
      sizeBytes: file.size,
      mimeType,
    });

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(SAREE_IMAGES_BUCKET)
      .upload(filePath, file, uploadOptions);

    if (uploadError) {
      console.error("Supabase Storage upload error:", {
        message: uploadError.message,
        name: uploadError.name,
        error: uploadError,
      });
      return {
        publicUrl: null,
        filePath: null,
        error: uploadError.message,
      };
    }

    console.log("Supabase Storage upload succeeded:", uploadData);

    const { data: urlData } = supabaseClient.storage
      .from(SAREE_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to retrieve public URL for uploaded file:", filePath);
      return {
        publicUrl: null,
        filePath,
        error: "Image was uploaded, but failed to retrieve public URL.",
      };
    }

    console.log("Retrieved public image URL:", urlData.publicUrl);

    return {
      publicUrl: urlData.publicUrl,
      filePath,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while uploading the saree photograph.";
    console.error("Storage upload exception:", err);
    return {
      publicUrl: null,
      filePath: null,
      error: message,
    };
  }
}

/**
 * Extracts the storage object path inside the `saree-images` bucket from a full public URL.
 * Returns null if the URL does not belong to the `saree-images` bucket.
 */
export function extractStorageFilePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  // If path is already relative (e.g. "catalogue/filename.jpg")
  if (imageUrl.startsWith("catalogue/")) {
    return imageUrl;
  }

  // Handle Supabase storage URLs: .../storage/v1/object/public/saree-images/catalogue/...
  const marker = `/${SAREE_IMAGES_BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index !== -1) {
    const afterMarker = imageUrl.slice(index + marker.length);
    const cleanPath = afterMarker.split("?")[0].split("#")[0];
    return decodeURIComponent(cleanPath);
  }

  return null;
}

/**
 * Safely deletes a saree photograph from the Supabase `saree-images` bucket.
 * If the image is not stored in the Supabase bucket (e.g. local /images/ or external),
 * this function gracefully succeeds without error.
 */
export async function deleteSareeImage(
  imageUrlOrPath: string | null | undefined,
  supabaseClient: SupabaseClient
): Promise<{ success: boolean; error: string | null }> {
  if (!imageUrlOrPath) {
    return { success: true, error: null };
  }

  const filePath = extractStorageFilePath(imageUrlOrPath);
  if (!filePath) {
    // Image is not in Supabase storage (e.g. static local demo asset)
    return { success: true, error: null };
  }

  try {
    // Ensure active auth session
    await supabaseClient.auth.getSession();

    const { error } = await supabaseClient.storage
      .from(SAREE_IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.warn("Could not delete image from Supabase storage:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error deleting image from storage";
    console.warn("Exception during storage deletion:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Safely deletes multiple saree photographs from the Supabase `saree-images` bucket.
 */
export async function deleteMultipleSareeImages(
  imageUrlsOrPaths: (string | null | undefined)[],
  supabaseClient: SupabaseClient
): Promise<{ success: boolean; errors: string[] }> {
  if (!imageUrlsOrPaths || imageUrlsOrPaths.length === 0) {
    return { success: true, errors: [] };
  }

  const validPaths = imageUrlsOrPaths
    .map((url) => extractStorageFilePath(url))
    .filter((path): path is string => Boolean(path));

  if (validPaths.length === 0) {
    return { success: true, errors: [] };
  }

  try {
    await supabaseClient.auth.getSession();
    const { error } = await supabaseClient.storage
      .from(SAREE_IMAGES_BUCKET)
      .remove(validPaths);

    if (error) {
      console.warn("Could not delete images from Supabase storage:", error.message);
      return { success: false, errors: [error.message] };
    }

    return { success: true, errors: [] };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error deleting images from storage";
    console.warn("Exception during multiple storage deletions:", msg);
    return { success: false, errors: [msg] };
  }
}

// ==============================================================================
// Saree Videos Storage Configuration & Helpers (`saree-videos` bucket)
// ==============================================================================

export const SAREE_VIDEOS_BUCKET = "saree-videos";

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
];

export const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

export interface VideoUploadResult {
  publicUrl: string | null;
  filePath: string | null;
  error: string | null;
}

/**
 * Validates a saree video file for allowed formats (MP4, WebM, QuickTime) and size (max 30MB).
 */
export function validateSareeVideo(file: File): VideoValidationResult {
  if (!file) {
    return { valid: false, error: "Please select a video file to upload." };
  }

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const hasValidExtension = /\.(mp4|webm|mov|m4v)$/i.test(fileName);
  const hasValidMime = ALLOWED_VIDEO_TYPES.includes(fileType);

  if (!hasValidMime && !hasValidExtension) {
    return {
      valid: false,
      error:
        "Unsupported video format. Please upload an MP4, WebM, or MOV (QuickTime) video.",
    };
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Video size is ${sizeMb} MB, which exceeds the 30 MB maximum limit. Please choose a shorter or compressed clip.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a validated saree video clip to the Supabase `saree-videos` bucket.
 * Generates a collision-safe path using SKU and timestamp, then retrieves the public URL.
 */
export async function uploadSareeVideo(
  file: File,
  sku: string,
  supabaseClient: SupabaseClient
): Promise<VideoUploadResult> {
  const validation = validateSareeVideo(file);
  if (!validation.valid) {
    return {
      publicUrl: null,
      filePath: null,
      error: validation.error || "Invalid video file.",
    };
  }

  // 1. Verify current active Supabase Auth session
  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("Supabase Auth getSession() error before video upload:", sessionError);
    return {
      publicUrl: null,
      filePath: null,
      error: `Authentication session error: ${sessionError.message}`,
    };
  }

  const session = sessionData?.session;
  if (!session || !session.access_token) {
    console.error("No active Supabase Auth session found before video upload.");
    return {
      publicUrl: null,
      filePath: null,
      error:
        "No active authenticated admin session found. Please sign in to the admin portal.",
    };
  }

  try {
    const sanitizedSku = (sku || "saree")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/^-+|-+$/g, "");

    const fileExt =
      file.name.split(".").pop()?.toLowerCase() ||
      (file.type === "video/webm"
        ? "webm"
        : file.type === "video/quicktime"
        ? "mov"
        : "mp4");

    const uniqueId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).substring(2, 10);

    const fileName = `${sanitizedSku}-${Date.now()}-${uniqueId}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    let mimeType = file.type?.toLowerCase() || "video/mp4";
    if (fileExt === "mov" || mimeType === "video/mov") {
      mimeType = "video/quicktime";
    }

    const uploadOptions = {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    };

    console.log(`Uploading video to ${SAREE_VIDEOS_BUCKET}/${filePath}...`, {
      fileName,
      sizeBytes: file.size,
      mimeType,
    });

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(SAREE_VIDEOS_BUCKET)
      .upload(filePath, file, uploadOptions);

    if (uploadError) {
      console.error("Supabase Storage video upload error:", uploadError);
      return {
        publicUrl: null,
        filePath: null,
        error: uploadError.message,
      };
    }

    console.log("Supabase Storage video upload succeeded:", uploadData);

    const { data: urlData } = supabaseClient.storage
      .from(SAREE_VIDEOS_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return {
        publicUrl: null,
        filePath,
        error: "Video was uploaded, but failed to retrieve public URL.",
      };
    }

    return {
      publicUrl: urlData.publicUrl,
      filePath,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while uploading the saree video.";
    console.error("Storage video upload exception:", err);
    return {
      publicUrl: null,
      filePath: null,
      error: message,
    };
  }
}

/**
 * Extracts the storage object path inside the `saree-videos` bucket from a full public URL.
 */
export function extractVideoStorageFilePath(videoUrl: string | null | undefined): string | null {
  if (!videoUrl || typeof videoUrl !== "string") return null;

  if (videoUrl.startsWith("videos/")) {
    return videoUrl;
  }

  const marker = `/${SAREE_VIDEOS_BUCKET}/`;
  const index = videoUrl.indexOf(marker);
  if (index !== -1) {
    const afterMarker = videoUrl.slice(index + marker.length);
    const cleanPath = afterMarker.split("?")[0].split("#")[0];
    return decodeURIComponent(cleanPath);
  }

  return null;
}

/**
 * Safely deletes a saree video clip from the Supabase `saree-videos` bucket.
 */
export async function deleteSareeVideo(
  videoUrlOrPath: string | null | undefined,
  supabaseClient: SupabaseClient
): Promise<{ success: boolean; error: string | null }> {
  if (!videoUrlOrPath) {
    return { success: true, error: null };
  }

  const filePath = extractVideoStorageFilePath(videoUrlOrPath);
  if (!filePath) {
    return { success: true, error: null };
  }

  try {
    await supabaseClient.auth.getSession();

    const { error } = await supabaseClient.storage
      .from(SAREE_VIDEOS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.warn("Could not delete video from Supabase storage:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Error deleting video from storage";
    console.warn("Exception during video storage deletion:", msg);
    return { success: false, error: msg };
  }
}


