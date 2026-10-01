"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Store,
  LogOut,
  ExternalLink,
  Tag,
  IndianRupee,
  Layers,
  FileText,
  RotateCcw,
  Eye,
  Upload,
  X,
  Video,
  Star,
  Images,
  Palette,
} from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import { createBrowserClient } from "@/lib/supabase/client";
import { insertSareeIntoDb } from "@/lib/supabase/sarees";
import { revalidateSareeCache } from "@/app/actions/sarees";
import {
  validateSareeImage,
  uploadSareeImage,
  validateSareeVideo,
  uploadSareeVideo,
} from "@/lib/supabase/storage";
import { createMultipleSareeVariants } from "@/lib/supabase/sareeVariants";
import { Saree, SareeCategory } from "@/types/saree";
import { SHOP_CONFIG } from "@/config/shop";

interface FormData {
  name: string;
  sku: string;
  category: SareeCategory | "";
  price: string;
  fabric: string;
  craft: string;
  zari_type: string;
  occasion: string;
  color: string;
  description: string;
  stock_status: string;
  stock_quantity: number | string;
  is_new_arrival: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_limited_stock: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  name: "",
  sku: "",
  category: "heritage-silks",
  price: "",
  fabric: "",
  craft: "",
  zari_type: "",
  occasion: "",
  color: "",
  description: "",
  stock_status: "Available on Inquiry",
  stock_quantity: 0,
  is_new_arrival: false,
  is_featured: false,
  is_best_seller: false,
  is_limited_stock: false,
};

const CATEGORIES: { value: SareeCategory; label: string; subLabel: string }[] = [
  {
    value: "heritage-silks",
    label: "Heritage Silks",
    subLabel: "Pattu Sarees (Kanchipuram, Banarasi, Gadwal)",
  },
  {
    value: "contemporary-elegance",
    label: "Contemporary Elegance",
    subLabel: "Fancy Sarees (Organza, Tissue, Georgette)",
  },
  {
    value: "everyday-grace",
    label: "Everyday Grace",
    subLabel: "Daily Wear & Handlooms (Cotton Silk, Chanderi)",
  },
];

const STOCK_STATUS_OPTIONS = [
  "Available on Inquiry",
  "In Stock",
  "Out of Stock",
];

interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
}

export interface VariantDraft {
  id: string;
  colorName: string;
  colorCode: string;
  price: string;
  stockQuantity: number | string;
  isAvailable: boolean;
  selectedPhotos: SelectedPhoto[];
  photoError?: string | null;
}

export default function AddNewSareePage() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateSkuError, setDuplicateSkuError] = useState<string | null>(null);
  const [savedSaree, setSavedSaree] = useState<Saree | null>(null);

  // Multiple photo upload state (max 6 photos for base saree)
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Colour Variants state (Requirement 1 & 2)
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [variantError, setVariantError] = useState<string | null>(null);

  const handleAddVariant = () => {
    setVariantError(null);
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        colorName: "",
        colorCode: "#C5A059",
        price: "",
        stockQuantity: 1,
        isAvailable: true,
        selectedPhotos: [],
      },
    ]);
  };

  const handleRemoveVariant = (variantId: string) => {
    setVariants((prev) => {
      const target = prev.find((v) => v.id === variantId);
      if (target) {
        target.selectedPhotos.forEach((p) => {
          if (p.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(p.previewUrl);
          }
        });
      }
      return prev.filter((v) => v.id !== variantId);
    });
  };

  const handleUpdateVariant = (variantId: string, updates: Partial<VariantDraft>) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, ...updates } : v))
    );
  };

  const handleVariantPhotosChange = (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setVariants((prev) => {
      const variantIndex = prev.findIndex((v) => v.id === variantId);
      if (variantIndex === -1) return prev;

      const variant = prev[variantIndex];
      const maxPhotos = 6;
      const availableSlots = maxPhotos - variant.selectedPhotos.length;

      if (availableSlots <= 0) {
        return prev.map((v) =>
          v.id === variantId
            ? { ...v, photoError: "Maximum 6 photos allowed for this colour variant." }
            : v
        );
      }

      const newPhotos: SelectedPhoto[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (newPhotos.length >= availableSlots) {
          errors.push(`Maximum ${maxPhotos} photos allowed per variant.`);
          break;
        }

        const isDuplicate =
          variant.selectedPhotos.some((p) => p.file.name === file.name && p.file.size === file.size) ||
          newPhotos.some((p) => p.file.name === file.name && p.file.size === file.size);

        if (isDuplicate) {
          errors.push(`"${file.name}" is already selected.`);
          continue;
        }

        const validation = validateSareeImage(file);
        if (!validation.valid) {
          errors.push(`"${file.name}": ${validation.error || "Invalid file."}`);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        const isFirst = variant.selectedPhotos.length === 0 && newPhotos.length === 0;

        newPhotos.push({
          id: `vp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          previewUrl,
          isCover: isFirst,
        });
      }

      const combined = [...variant.selectedPhotos, ...newPhotos];
      if (!combined.some((p) => p.isCover) && combined.length > 0) {
        combined[0].isCover = true;
      }

      return prev.map((v) =>
        v.id === variantId
          ? {
              ...v,
              selectedPhotos: combined,
              photoError: errors.length > 0 ? errors.join(" ") : null,
            }
          : v
      );
    });

    e.target.value = "";
  };

  const handleSetVariantCoverPhoto = (variantId: string, photoId: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const targetPhoto = v.selectedPhotos.find((p) => p.id === photoId);
        if (!targetPhoto) return v;
        const targetUpdated = { ...targetPhoto, isCover: true };
        const others = v.selectedPhotos
          .filter((p) => p.id !== photoId)
          .map((p) => ({ ...p, isCover: false }));
        return {
          ...v,
          selectedPhotos: [targetUpdated, ...others],
        };
      })
    );
  };

  const handleRemoveVariantPhoto = (variantId: string, photoId: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const target = v.selectedPhotos.find((p) => p.id === photoId);
        if (target && target.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(target.previewUrl);
        }
        const filtered = v.selectedPhotos.filter((p) => p.id !== photoId);
        if (filtered.length > 0 && !filtered.some((p) => p.isCover)) {
          filtered[0].isCover = true;
        }
        return { ...v, selectedPhotos: filtered, photoError: null };
      })
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Clear related field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === "sku") {
      setDuplicateSkuError(null);
      setFormData((prev) => ({
        ...prev,
        sku: value.toUpperCase(),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxPhotos = 6;
    const availableSlots = maxPhotos - selectedPhotos.length;

    if (availableSlots <= 0) {
      setImageError("Maximum 6 photos allowed per saree. Please remove some photos to add new ones.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newPhotos: SelectedPhoto[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (newPhotos.length >= availableSlots) {
        errors.push(`Only ${maxPhotos} photos total can be uploaded per saree.`);
        break;
      }

      // Check duplicate in already selected files
      const isDuplicate = selectedPhotos.some(
        (p) => p.file.name === file.name && p.file.size === file.size
      ) || newPhotos.some(
        (p) => p.file.name === file.name && p.file.size === file.size
      );

      if (isDuplicate) {
        errors.push(`"${file.name}" is already selected.`);
        continue;
      }

      const validation = validateSareeImage(file);
      if (!validation.valid) {
        errors.push(`"${file.name}": ${validation.error || "Invalid file."}`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const isFirstItemEver = selectedPhotos.length === 0 && newPhotos.length === 0;

      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        isCover: isFirstItemEver,
      });
    }

    if (errors.length > 0) {
      setImageError(errors.join(" "));
    }

    if (newPhotos.length > 0) {
      setSelectedPhotos((prev) => {
        const combined = [...prev, ...newPhotos];
        // Ensure at least one is cover
        const hasCover = combined.some((p) => p.isCover);
        if (!hasCover && combined.length > 0) {
          combined[0].isCover = true;
        }
        return combined;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSetCoverPhoto = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const targetIndex = prev.findIndex((p) => p.id === photoId);
      if (targetIndex === -1) return prev;

      const targetPhoto = { ...prev[targetIndex], isCover: true };
      const otherPhotos = prev
        .filter((p) => p.id !== photoId)
        .map((p) => ({ ...p, isCover: false }));

      // Move cover photo to index 0 for consistent order
      return [targetPhoto, ...otherPhotos];
    });
  };

  const handleRemovePhoto = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId);
      if (target && target.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const remaining = prev.filter((p) => p.id !== photoId);
      // If we removed the cover photo, assign cover to first remaining item
      if (target?.isCover && remaining.length > 0) {
        remaining[0].isCover = true;
      }
      return remaining;
    });
    setImageError(null);
  };

  const handleClearAllPhotos = () => {
    selectedPhotos.forEach((p) => {
      if (p.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
    setSelectedPhotos([]);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSareeVideo(file);
    if (!validation.valid) {
      setVideoError(validation.error || "Invalid video format or size.");
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    if (videoPreviewUrl && videoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl && videoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoError(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Saree Name is required.";
    }

    if (!formData.sku.trim()) {
      errors.sku = "SKU code is required (e.g. SS-PAT-001).";
    }

    if (!formData.category) {
      errors.category = "Please select a category.";
    }

    if (formData.price.trim() !== "") {
      const numericPrice = Number(formData.price.trim());
      if (isNaN(numericPrice) || numericPrice < 0) {
        errors.price = "Please enter a valid numeric price or leave blank.";
      }
    }

    if (selectedPhotos.length > 6) {
      errors.image = "Maximum 6 photos allowed per saree.";
      setImageError("Maximum 6 photos allowed per saree.");
    }

    if (videoFile) {
      const videoValidation = validateSareeVideo(videoFile);
      if (!videoValidation.valid) {
        errors.video = videoValidation.error || "Invalid video.";
        setVideoError(videoValidation.error || "Invalid video.");
      }
    }

    // Check variant colour names
    if (variants.length > 0) {
      const emptyVariant = variants.some((v) => !v.colorName.trim());
      if (emptyVariant) {
        errors.variants = "Please enter a colour name for each colour variant or remove empty cards.";
        setVariantError("Please enter a colour name for each colour variant (e.g. Pink, Green, Yellow).");
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setDuplicateSkuError(null);
    setImageError(null);
    setVariantError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      let coverImageUrl: string | null = null;
      const allImageUrls: string[] = [];
      let uploadedVideoUrl: string | null = null;

      // 1. Upload all selected base saree photos to Supabase Storage
      if (selectedPhotos.length > 0) {
        setIsUploadingImage(true);

        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !sessionData?.session) {
          console.error("Auth session verification failed in Add Saree page:", sessionErr);
          setImageError("Your authentication session has expired. Please sign in again.");
          setSubmitError("Authentication session expired. Please sign out and sign in again.");
          setIsSubmitting(false);
          setIsUploadingImage(false);
          return;
        }

        // Reorder so cover photo is first in the upload array
        const sortedPhotos = [
          ...selectedPhotos.filter((p) => p.isCover),
          ...selectedPhotos.filter((p) => !p.isCover),
        ];

        for (let i = 0; i < sortedPhotos.length; i++) {
          const photo = sortedPhotos[i];
          setUploadProgressText(`Uploading base photo ${i + 1} of ${sortedPhotos.length}...`);

          const uploadResult = await uploadSareeImage(photo.file, formData.sku, supabase);

          if (uploadResult.error || !uploadResult.publicUrl) {
            const errMsg = uploadResult.error || "Failed to upload image to Supabase Storage.";
            setImageError(errMsg);
            setSubmitError(`Base photo upload failed for image ${i + 1}: ${errMsg}`);
            setIsSubmitting(false);
            setIsUploadingImage(false);
            setUploadProgressText("");
            return;
          }

          allImageUrls.push(uploadResult.publicUrl);
          if (i === 0) {
            coverImageUrl = uploadResult.publicUrl;
          }
        }

        setIsUploadingImage(false);
        setUploadProgressText("");
      }

      // 2. Upload saree video to Supabase Storage if selected
      if (videoFile) {
        setIsUploadingVideo(true);

        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !sessionData?.session) {
          console.error("Auth session verification failed in Add Saree page:", sessionErr);
          setVideoError("Your authentication session has expired. Please sign in again.");
          setSubmitError("Authentication session expired. Please sign out and sign in again.");
          setIsSubmitting(false);
          setIsUploadingImage(false);
          setIsUploadingVideo(false);
          return;
        }

        const videoResult = await uploadSareeVideo(videoFile, formData.sku, supabase);
        setIsUploadingVideo(false);

        if (videoResult.error || !videoResult.publicUrl) {
          const errMsg = videoResult.error || "Failed to upload video to Supabase Storage.";
          setVideoError(errMsg);
          setSubmitError(`Video upload failed: ${errMsg}`);
          setIsSubmitting(false);
          return;
        }

        uploadedVideoUrl = videoResult.publicUrl;
      }

      // 3. Insert Saree Record into Supabase `public.sarees`
      const result = await insertSareeIntoDb(
        {
          name: formData.name,
          sku: formData.sku,
          category: formData.category as SareeCategory,
          price: formData.price.trim() !== "" ? Number(formData.price.trim()) : null,
          fabric: formData.fabric,
          craft: formData.craft,
          zari_type: formData.zari_type,
          occasion: formData.occasion,
          color: formData.color,
          description: formData.description,
          stock_status: formData.stock_status,
          stockQuantity: Math.max(0, parseInt(String(formData.stock_quantity), 10) || 0),
          is_new_arrival: formData.is_new_arrival,
          is_featured: formData.is_featured,
          is_best_seller: formData.is_best_seller,
          is_limited_stock: formData.is_limited_stock,
          image_url: coverImageUrl,
          image_urls: allImageUrls.length > 0 ? allImageUrls : null,
          video_url: uploadedVideoUrl,
        },
        supabase
      );

      if (result.error) {
        if (result.error.isDuplicateSku) {
          setDuplicateSkuError(result.error.message);
          setFieldErrors((prev) => ({
            ...prev,
            sku: `SKU "${formData.sku.trim().toUpperCase()}" is already assigned to another saree.`,
          }));
        } else {
          setSubmitError(result.error.message);
        }
        return;
      }

      if (result.data) {
        const createdSareeId = result.data.id;

        // 4. Upload and create colour variants in `saree_variants` table
        if (variants.length > 0) {
          const variantPayloads = [];

          for (let vi = 0; vi < variants.length; vi++) {
            const variant = variants[vi];
            const variantImageUrls: string[] = [];

            if (variant.selectedPhotos.length > 0) {
              const sortedVPhotos = [
                ...variant.selectedPhotos.filter((p) => p.isCover),
                ...variant.selectedPhotos.filter((p) => !p.isCover),
              ];

              for (let pi = 0; pi < sortedVPhotos.length; pi++) {
                const vPhoto = sortedVPhotos[pi];
                setUploadProgressText(
                  `Uploading photo ${pi + 1} for variant "${variant.colorName || `Colour ${vi + 1}`}"...`
                );

                const cleanColor = (variant.colorName || "color").trim().replace(/[^a-zA-Z0-9]/g, "_");
                const skuPrefix = `${formData.sku}-${cleanColor}`;
                const uploadRes = await uploadSareeImage(vPhoto.file, skuPrefix, supabase);

                if (uploadRes.publicUrl) {
                  variantImageUrls.push(uploadRes.publicUrl);
                }
              }
            }

            const variantNumericPrice =
              variant.price.trim() !== ""
                ? Number(variant.price.trim())
                : formData.price.trim() !== ""
                ? Number(formData.price.trim())
                : null;

            variantPayloads.push({
              sareeId: createdSareeId,
              colorName: variant.colorName.trim() || `Colour ${vi + 1}`,
              colorCode: variant.colorCode?.trim() || null,
              price: variantNumericPrice,
              stockQuantity: Math.max(0, parseInt(String(variant.stockQuantity), 10) || 0),
              imageUrls: variantImageUrls,
              isAvailable: variant.isAvailable !== false,
            });
          }

          if (variantPayloads.length > 0) {
            setUploadProgressText("Saving colour variants to database...");
            const vRes = await createMultipleSareeVariants(variantPayloads, supabase);
            if (vRes.error) {
              console.warn("Colour variants creation warning:", vRes.error);
            }
          }
        }

        setSavedSaree(result.data);

        // Invalidate Next.js cache so customer website reflects the new saree immediately
        revalidateSareeCache(result.data.id).catch(() => {});
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while saving.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
      setUploadProgressText("");
    }
  };

  const handleResetForm = () => {
    selectedPhotos.forEach((p) => {
      if (p.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
    variants.forEach((v) => {
      v.selectedPhotos.forEach((p) => {
        if (p.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    });
    if (videoPreviewUrl && videoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setFormData(INITIAL_FORM_DATA);
    setSelectedPhotos([]);
    setVariants([]);
    setVariantError(null);
    setImageError(null);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoError(null);
    setFieldErrors({});
    setSubmitError(null);
    setDuplicateSkuError(null);
    setSavedSaree(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  return (
    <AdminGuard>
      {({ user, onLogout }) => (
        <div className="min-h-screen bg-[#FDFBF7] text-[#2C2420] flex flex-col justify-between">
          {/* Admin Navigation Bar */}
          <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E0D2] shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-18">
                {/* Brand & Breadcrumb */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#6E121E] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/admin"
                        className="font-serif-luxury text-xl font-bold text-[#6E121E] hover:underline"
                      >
                        {SHOP_CONFIG.brandName}
                      </Link>
                      <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/40 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8C7A6B] tracking-wider uppercase font-medium">
                      Catalogue Management
                    </p>
                  </div>
                </div>

                {/* Right Actions: Back to Dashboard, Storefront, Email & Sign Out */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-xs text-[#5A4E46] hover:text-[#6E121E] px-3 py-1.5 rounded-lg border border-[#E8E0D2] hover:border-[#C5A059] bg-white transition font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Admin Dashboard</span>
                  </Link>

                  <Link
                    href="/sarees"
                    target="_blank"
                    className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-[#6E121E] px-3 py-1.5 rounded-lg border border-[#E8E0D2] hover:border-[#C5A059] transition font-medium"
                    title="View public live catalogue in new tab"
                  >
                    <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Public Catalogue</span>
                    <ExternalLink className="w-3 h-3 text-[#8C7A6B]" />
                  </Link>

                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F3EE] text-[#1E3F34] text-xs font-medium border border-[#A7F3D0]/50">
                    <span className="w-2 h-2 rounded-full bg-[#1E3F34]" />
                    <span className="truncate max-w-[160px]">{user.email}</span>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-600 hover:text-white hover:border-red-600 text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer shadow-2xs"
                    title="Sign out of Admin Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs text-[#8C7A6B] mb-4">
              <Link href="/admin" className="hover:text-[#6E121E] transition">
                Admin
              </Link>
              <span>/</span>
              <span className="text-[#6E121E] font-medium">Add New Saree</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#1E1715]">
                  Add New Saree
                </h1>
                <p className="text-xs sm:text-sm text-[#8C7A6B] mt-1 font-light">
                  Publish a new handcrafted saree with authentic photographs directly into the live {SHOP_CONFIG.brandName} catalogue.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/sarees"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D2] bg-white text-xs text-[#5A4E46] hover:text-[#6E121E] hover:border-[#C5A059] transition font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>View Public Store</span>
                </Link>
              </div>
            </div>

            {/* Success Banner when Saree is Saved */}
            {savedSaree && (
              <div className="mb-8 bg-[#FAF6EE] border-2 border-[#C5A059] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {/* Saree Image Thumbnail or Icon */}
                    {savedSaree.image ? (
                      <div className="w-16 h-20 rounded-xl overflow-hidden border border-[#C5A059]/40 shrink-0 bg-stone-100 relative shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={savedSaree.image}
                          alt={savedSaree.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#1E3F34] text-white flex items-center justify-center shrink-0 shadow-md">
                        <CheckCircle2 className="w-6 h-6 text-[#A7F3D0]" />
                      </div>
                    )}
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F3EE] text-[#1E3F34] text-[11px] font-semibold tracking-wider uppercase mb-1">
                        Saved to Supabase Database
                      </div>
                      <h2 className="font-serif-luxury text-2xl font-bold text-[#1E1715]">
                        Saree Published Successfully!
                      </h2>
                      <p className="text-xs sm:text-sm text-[#5A4E46] mt-1">
                        <strong className="font-semibold text-[#1E1715]">
                          {savedSaree.name}
                        </strong>{" "}
                        has been added to the catalogue with SKU{" "}
                        <span className="font-mono font-bold text-[#6E121E] bg-white px-2 py-0.5 rounded border border-[#E8E0D2]">
                          {savedSaree.sku}
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Success Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Link
                      href="/sarees"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white font-semibold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                    >
                      <Store className="w-4 h-4 text-[#C5A059]" />
                      <span>View Public Catalogue</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#C5A059] bg-white hover:bg-[#FAF6EE] text-[#6E121E] font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#C5A059]" />
                      <span>Add Another Saree</span>
                    </button>

                    <Link
                      href="/admin"
                      className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-gray-50 text-[#8C7A6B] hover:text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banners */}
            {duplicateSkuError && (
              <div className="mb-6 bg-red-50 border border-red-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-red-900">Duplicate SKU Detected</p>
                  <p className="mt-0.5 text-red-700">{duplicateSkuError}</p>
                  <p className="mt-1 text-[11px] text-red-600">
                    Each saree in the SaiSrujana boutique must have a unique identifier. Please update the SKU field below.
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 bg-red-50 border border-red-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-red-800">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-red-900">Could Not Save Saree</p>
                  <p className="mt-0.5 text-red-700">{submitError}</p>
                </div>
              </div>
            )}

            {/* Form & Live Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Column */}
              <div className="lg:col-span-8">
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] p-6 sm:p-8 md:p-10 shadow-sm space-y-8"
                >
                  {/* SECTION 1: Saree Photographs Upload (Supabase Storage saree-images) */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8E0D2] gap-2">
                      <div className="flex items-center gap-2.5">
                        <Images className="w-5 h-5 text-[#C5A059]" />
                        <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                          Saree Photographs
                        </h2>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40">
                          {selectedPhotos.length}/6 Photos
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#8C7A6B]">
                          JPG, JPEG, PNG, WebP (Max 5MB each)
                        </span>
                        {selectedPhotos.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllPhotos}
                            className="text-[11px] text-red-600 hover:text-red-800 font-medium cursor-pointer underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      {selectedPhotos.length === 0 ? (
                        /* Empty Upload Drop-zone */
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`group border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 bg-white hover:bg-[#FAF6EE] ${
                            imageError
                              ? "border-red-400 bg-red-50/20"
                              : "border-[#E8E0D2] hover:border-[#C5A059]"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] group-hover:bg-[#6E121E] group-hover:text-white border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-3 text-[#6E121E] transition-all duration-200 shadow-2xs">
                            <Upload className="w-5 h-5 text-[#C5A059] group-hover:text-white" />
                          </div>
                          <p className="text-sm font-semibold text-[#1E1715] mb-1">
                            Click to select saree photos (Select multiple up to 6)
                          </p>
                          <p className="text-xs text-[#8C7A6B] font-light max-w-md mx-auto">
                            Supports JPG, JPEG, PNG, or WebP up to 5MB per photo. The first photo will be your Main Cover image.
                          </p>
                          <span className="inline-block mt-3 px-3.5 py-1.5 rounded-full bg-[#FAF6EE] text-[#6E121E] text-xs font-semibold tracking-wider uppercase border border-[#C5A059]/30">
                            Browse Saree Photos
                          </span>
                        </div>
                      ) : (
                        /* Selected Photos Grid */
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {selectedPhotos.map((photo, index) => (
                              <div
                                key={photo.id}
                                className={`group relative bg-white rounded-2xl border overflow-hidden shadow-2xs flex flex-col transition-all duration-200 ${
                                  photo.isCover
                                    ? "border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-sm"
                                    : "border-[#E8E0D2] hover:border-[#C5A059]/60"
                                }`}
                              >
                                {/* Photo Preview Frame */}
                                <div className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={photo.previewUrl}
                                    alt={`Saree photo ${index + 1}`}
                                    className="w-full h-full object-cover object-top"
                                  />

                                  {/* Number & Cover Status Badge */}
                                  <div className="absolute top-2 left-2 z-10">
                                    {photo.isCover ? (
                                      <span className="bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
                                        <span>Main Cover</span>
                                      </span>
                                    ) : (
                                      <span className="bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                        Photo {index + 1}
                                      </span>
                                    )}
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(photo.id)}
                                    aria-label="Remove photo"
                                    title="Remove this photo"
                                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/65 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-xs shadow-xs"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Card Details & Actions */}
                                <div className="p-2.5 flex flex-col justify-between flex-1 bg-white border-t border-[#F0EBE0] space-y-2">
                                  <div>
                                    <p className="text-[11px] font-medium text-[#1E1715] truncate" title={photo.file.name}>
                                      {photo.file.name}
                                    </p>
                                    <p className="text-[10px] text-[#8C7A6B]">
                                      {(photo.file.size / (1024 * 1024)).toFixed(2)} MB • {photo.file.type.replace("image/", "").toUpperCase()}
                                    </p>
                                  </div>

                                  <div>
                                    {photo.isCover ? (
                                      <div className="w-full py-1 text-center text-[10px] font-bold text-[#1E3F34] bg-[#EBF8F2] rounded border border-[#A7F3D0]/60 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Active Cover</span>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetCoverPhoto(photo.id)}
                                        className="w-full py-1 text-center text-[10px] font-semibold text-[#6E121E] hover:text-[#821524] bg-[#FAF6EE] hover:bg-[#FAF0DC] rounded border border-[#C5A059]/40 hover:border-[#C5A059] transition cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        <Star className="w-2.5 h-2.5 text-[#C5A059]" />
                                        <span>Set as Main</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add More Button if < 6 photos */}
                          {selectedPhotos.length < 6 && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E8E0D2]">
                              <div className="text-xs text-[#5A4E46]">
                                <span className="font-semibold">Need more angles?</span> You can upload up to{" "}
                                <span className="font-bold text-[#6E121E]">{6 - selectedPhotos.length}</span> more photos (pallu, border, pleats).
                              </div>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#FAF0DC] border border-[#C5A059] text-xs font-semibold text-[#6E121E] transition cursor-pointer flex items-center gap-1.5 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Photos</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hidden Multi-File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageFilesChange}
                        className="hidden"
                      />

                      {/* Upload Progress Text */}
                      {uploadProgressText && (
                        <p className="text-xs text-[#6E121E] font-medium flex items-center gap-1.5 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>{uploadProgressText}</span>
                        </p>
                      )}

                      {/* Image Validation Error */}
                      {imageError && (
                        <p className="text-[11px] text-red-600 mt-2 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{imageError}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SECTION 1B: Product Drape Video (Supabase Storage saree-videos) */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-[#C5A059]" />
                        <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                          Product Drape Video
                        </h2>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40">
                          Optional
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8C7A6B]">
                        MP4, WebM, MOV (Max 30MB)
                      </span>
                    </div>

                    <div className="mt-5">
                      {videoPreviewUrl ? (
                        /* Uploaded Video Preview Box */
                        <div className="bg-white rounded-2xl border border-[#E8E0D2] p-4 flex flex-col sm:flex-row items-center gap-5">
                          <div className="relative w-48 h-32 rounded-xl overflow-hidden bg-black border border-[#E8E0D2] shadow-2xs shrink-0 flex items-center justify-center">
                            <video
                              src={videoPreviewUrl}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 space-y-2 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#1E3F34]">
                              <CheckCircle2 className="w-4 h-4 text-[#1E3F34]" />
                              <span>Video Ready for Supabase Storage</span>
                            </div>
                            <p className="text-xs text-[#5A4E46] font-medium truncate max-w-xs">
                              {videoFile?.name || "Selected saree video"}
                            </p>
                            {videoFile && (
                              <p className="text-[11px] text-[#8C7A6B]">
                                File Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                                {videoFile.type || "VIDEO"}
                              </p>
                            )}

                            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                              <button
                                type="button"
                                onClick={() => videoInputRef.current?.click()}
                                className="px-3.5 py-1.5 rounded-lg border border-[#E8E0D2] bg-white hover:border-[#C5A059] text-xs text-[#5A4E46] hover:text-[#6E121E] font-medium transition cursor-pointer"
                              >
                                Change Video
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveVideo}
                                className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-xs text-red-700 font-medium transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Empty Video Upload Drop-zone */
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          className={`group border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 bg-white hover:bg-[#FAF6EE] ${
                            videoError
                              ? "border-red-400 bg-red-50/20"
                              : "border-[#E8E0D2] hover:border-[#C5A059]"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] group-hover:bg-[#6E121E] group-hover:text-white border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-3 text-[#6E121E] transition-all duration-200 shadow-2xs">
                            <Video className="w-5 h-5 text-[#C5A059] group-hover:text-white" />
                          </div>
                          <p className="text-sm font-semibold text-[#1E1715] mb-1">
                            Click to upload saree drape video (Optional)
                          </p>
                          <p className="text-xs text-[#8C7A6B] font-light max-w-md mx-auto">
                            Upload a short clip showing pleat fall, pallu details, or zari shine. Supports MP4, WebM, and MOV up to 30MB.
                          </p>
                          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-[#FAF6EE] text-[#6E121E] text-[11px] font-semibold tracking-wider uppercase border border-[#C5A059]/30">
                            Browse Video
                          </span>
                        </div>
                      )}

                      {/* Hidden Video File Input */}
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov"
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />

                      {/* Video Validation Error */}
                      {videoError && (
                        <p className="text-[11px] text-red-600 mt-2 font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{videoError}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: Core Saree Identification */}
                  <div>
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E0D2]">
                      <Tag className="w-4 h-4 text-[#C5A059]" />
                      <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                        Core Saree Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                      {/* Saree Name */}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="name"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Saree Name <span className="text-[#6E121E]">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Royal Crimson Kanchipuram Pure Silk Saree"
                          className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 transition ${
                            fieldErrors.name
                              ? "border-red-500 bg-red-50/20"
                              : "border-[#E8E0D2] focus:border-[#C5A059]"
                          }`}
                        />
                        {fieldErrors.name && (
                          <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                            {fieldErrors.name}
                          </p>
                        )}
                      </div>

                      {/* SKU (Unique) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="sku"
                            className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46]"
                          >
                            SKU Identifier <span className="text-[#6E121E]">*</span>
                          </label>
                          <span className="text-[10px] text-[#8C7A6B] font-mono">
                            Must be unique
                          </span>
                        </div>
                        <input
                          id="sku"
                          name="sku"
                          type="text"
                          required
                          value={formData.sku}
                          onChange={handleInputChange}
                          placeholder="e.g. SS-KAN-001"
                          className={`w-full px-4 py-3 rounded-xl bg-white border text-sm font-mono uppercase tracking-wider text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 transition ${
                            fieldErrors.sku || duplicateSkuError
                              ? "border-red-500 bg-red-50/20 text-red-900"
                              : "border-[#E8E0D2] focus:border-[#C5A059]"
                          }`}
                        />
                        {fieldErrors.sku ? (
                          <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                            {fieldErrors.sku}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">
                            Uppercase unique code (e.g. SS-PAT-001, SS-ORG-102)
                          </p>
                        )}
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label
                          htmlFor="category"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Category <span className="text-[#6E121E]">*</span>
                        </label>
                        <select
                          id="category"
                          name="category"
                          required
                          value={formData.category}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#1E1715] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 transition ${
                            fieldErrors.category
                              ? "border-red-500 bg-red-50/20"
                              : "border-[#E8E0D2] focus:border-[#C5A059]"
                          }`}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label} ({cat.subLabel.split(" ")[0]})
                            </option>
                          ))}
                        </select>
                        {fieldErrors.category && (
                          <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                            {fieldErrors.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Pricing & Availability */}
                  <div>
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E0D2]">
                      <IndianRupee className="w-4 h-4 text-[#C5A059]" />
                      <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                        Pricing & Stock Status
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                      {/* Price (INR) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="price"
                            className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46]"
                          >
                            Price (₹ INR)
                          </label>
                          <span className="text-[10px] text-[#8C7A6B]">Optional</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8C7A6B]">
                            ₹
                          </span>
                          <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="100"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="e.g. 24500"
                            className={`w-full pl-8 pr-4 py-3 rounded-xl bg-white border text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 transition ${
                              fieldErrors.price
                                ? "border-red-500 bg-red-50/20"
                                : "border-[#E8E0D2] focus:border-[#C5A059]"
                            }`}
                          />
                        </div>
                        {fieldErrors.price ? (
                          <p className="text-[11px] text-red-600 mt-1.5 font-medium">
                            {fieldErrors.price}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">
                            Leave empty for &ldquo;Available on Inquiry&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Stock Quantity */}
                      <div>
                        <label
                          htmlFor="stock_quantity"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Stock Quantity <span className="text-[#6E121E]">*</span>
                        </label>
                        <input
                          type="number"
                          id="stock_quantity"
                          name="stock_quantity"
                          min="0"
                          step="1"
                          required
                          value={formData.stock_quantity}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        />
                        <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">
                          0 = Out of Stock, 1 = Last piece, 2–3 = Low stock, 4+ = In Stock
                        </p>
                      </div>

                      {/* Stock Status */}
                      <div>
                        <label
                          htmlFor="stock_status"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Stock Status <span className="text-[#6E121E]">*</span>
                        </label>
                        <select
                          id="stock_status"
                          name="stock_status"
                          value={formData.stock_status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        >
                          {STOCK_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">
                          Controls boutique inquiry and availability badge
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3B: Colour Variants (Requirement 1 & 2) */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
                      <div className="flex items-center gap-2.5">
                        <Palette className="w-4 h-4 text-[#C5A059]" />
                        <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                          Colour Variants
                        </h2>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]/40">
                          Optional
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider shadow-2xs transition cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Add Colour</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#8C7A6B] mt-2 mb-4 font-light">
                      Add multiple colour options for this saree (e.g. Pink, Green, Yellow, Red). Each colour variant can have its own price, stock quantity, availability switch, and up to 6 distinct photos.
                    </p>

                    {variantError && (
                      <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{variantError}</span>
                      </div>
                    )}

                    {variants.length === 0 ? (
                      /* Empty State */
                      <div className="p-6 rounded-2xl border-2 border-dashed border-[#E8E0D2] bg-white text-center">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/30 flex items-center justify-center mx-auto mb-2.5">
                          <Palette className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <p className="text-xs font-semibold text-[#1E1715] mb-1">
                          No colour variants added
                        </p>
                        <p className="text-[11px] text-[#8C7A6B] font-light max-w-sm mx-auto mb-3">
                          If this saree is available in multiple shades, click below to add colour cards with custom stock and individual photos.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF0DC] hover:bg-[#F3E5CE] text-[#6E121E] border border-[#C5A059] text-xs font-semibold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Colour</span>
                        </button>
                      </div>
                    ) : (
                      /* List of Variant Cards */
                      <div className="space-y-5">
                        {variants.map((variant, index) => (
                          <div
                            key={variant.id}
                            className="bg-white rounded-2xl border border-[#E8E0D2] p-4 sm:p-6 shadow-2xs space-y-4 relative"
                          >
                            {/* Variant Card Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE0]">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-[#6E121E] text-white text-xs font-bold flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="font-serif-luxury text-base font-bold text-[#1E1715]">
                                  {variant.colorName.trim() || `Colour Variant ${index + 1}`}
                                </span>
                                {variant.colorCode && (
                                  <span
                                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs inline-block"
                                    style={{ backgroundColor: variant.colorCode }}
                                  />
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant.id)}
                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition cursor-pointer"
                                title="Remove this colour variant"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Remove Colour</span>
                              </button>
                            </div>

                            {/* Variant Form Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Colour Name */}
                              <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1">
                                  Colour Name <span className="text-[#6E121E]">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={variant.colorName}
                                  onChange={(e) =>
                                    handleUpdateVariant(variant.id, { colorName: e.target.value })
                                  }
                                  placeholder="e.g. Pink, Green, Royal Blue"
                                  className="w-full px-3 py-2 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                                />
                              </div>

                              {/* Colour Code / Picker */}
                              <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1">
                                  Colour Swatch
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={variant.colorCode || "#C5A059"}
                                    onChange={(e) =>
                                      handleUpdateVariant(variant.id, { colorCode: e.target.value })
                                    }
                                    className="w-9 h-9 p-0.5 rounded-lg border border-[#E8E0D2] cursor-pointer bg-white"
                                    title="Choose colour swatch"
                                  />
                                  <input
                                    type="text"
                                    value={variant.colorCode}
                                    onChange={(e) =>
                                      handleUpdateVariant(variant.id, { colorCode: e.target.value })
                                    }
                                    placeholder="#HEX code"
                                    className="w-full px-3 py-2 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs font-mono text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                                  />
                                </div>
                              </div>

                              {/* Price Override */}
                              <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1">
                                  Price (₹ INR)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8C7A6B]">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={variant.price}
                                    onChange={(e) =>
                                      handleUpdateVariant(variant.id, { price: e.target.value })
                                    }
                                    placeholder={formData.price ? `Default: ${formData.price}` : "Custom price"}
                                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                                  />
                                </div>
                              </div>

                              {/* Stock Quantity */}
                              <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A4E46] mb-1">
                                  Stock Quantity <span className="text-[#6E121E]">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  required
                                  value={variant.stockQuantity}
                                  onChange={(e) =>
                                    handleUpdateVariant(variant.id, {
                                      stockQuantity: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-[#FDFBF7] border border-[#E8E0D2] text-xs text-[#1E1715] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                                />
                              </div>
                            </div>

                            {/* Available Switch Toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE0] text-xs">
                              <span className="text-[#5A4E46] font-medium">
                                Available for Purchase:
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.isAvailable}
                                  onChange={(e) =>
                                    handleUpdateVariant(variant.id, { isAvailable: e.target.checked })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1E3F34]"></div>
                                <span className="ml-2 text-xs font-semibold text-[#1E1715]">
                                  {variant.isAvailable ? "ON" : "OFF"}
                                </span>
                              </label>
                            </div>

                            {/* Variant Multiple Photos (Requirement 2) */}
                            <div className="pt-3 border-t border-[#F0EBE0]">
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-1.5">
                                  <Images className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span className="text-xs font-semibold text-[#1E1715]">
                                    Photos for this Colour ({variant.selectedPhotos.length}/6)
                                  </span>
                                </div>

                                {variant.selectedPhotos.length < 6 && (
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF0DC] hover:bg-[#F3E5CE] text-[#6E121E] border border-[#C5A059] text-[11px] font-semibold transition cursor-pointer">
                                    <Upload className="w-3 h-3" />
                                    <span>Add Photos</span>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                                      onChange={(e) => handleVariantPhotosChange(variant.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>

                              {variant.photoError && (
                                <p className="text-[11px] text-red-600 mb-2 font-medium">
                                  {variant.photoError}
                                </p>
                              )}

                              {variant.selectedPhotos.length === 0 ? (
                                <p className="text-[11px] text-[#8C7A6B] font-light bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E0D2] text-center">
                                  No photos selected for this colour yet. Click &ldquo;Add Photos&rdquo; to upload up to 6 photos.
                                </p>
                              ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                                  {variant.selectedPhotos.map((photo, pIdx) => (
                                    <div
                                      key={photo.id}
                                      className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 border ${
                                        photo.isCover
                                          ? "border-[#6E121E] ring-2 ring-[#6E121E]/30"
                                          : "border-[#E8E0D2]"
                                      }`}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={photo.previewUrl}
                                        alt={`Variant photo ${pIdx + 1}`}
                                        className="w-full h-full object-cover object-top"
                                      />

                                      {/* Cover Badge */}
                                      {photo.isCover && (
                                        <div className="absolute top-1 left-1 bg-[#6E121E] text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-2xs">
                                          MAIN
                                        </div>
                                      )}

                                      {/* Actions Overlay */}
                                      <div className="absolute bottom-1 right-1 left-1 flex items-center justify-between gap-1">
                                        {!photo.isCover && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleSetVariantCoverPhoto(variant.id, photo.id)
                                            }
                                            className="bg-black/75 hover:bg-black text-white text-[8.5px] px-1 py-0.5 rounded transition cursor-pointer"
                                            title="Set as main photo for this colour"
                                          >
                                            Set Main
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveVariantPhoto(variant.id, photo.id)
                                          }
                                          className="bg-red-700/85 hover:bg-red-700 text-white p-1 rounded transition cursor-pointer ml-auto"
                                          title="Remove photo"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 4: Product Badges & Showcase Flags */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2]">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                        <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                          Product Badges & Showcase Status
                        </h2>
                      </div>
                      <span className="text-[10px] text-[#8C7A6B]">Optional Badges</span>
                    </div>

                    <p className="text-xs text-[#8C7A6B] mt-2 mb-4 font-light">
                      Enable badges to highlight this saree across the customer storefront, catalogue filters, and homepage collections. Badges can be switched ON/OFF at any time.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Arrival Switch */}
                      <label
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          formData.is_new_arrival
                            ? "bg-[#1E3F34]/5 border-[#1E3F34] shadow-xs"
                            : "bg-white border-[#E8E0D2] hover:border-[#C5A059]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="is_new_arrival"
                          checked={formData.is_new_arrival}
                          onChange={handleInputChange}
                          aria-label="New Arrival badge"
                          className="w-4 h-4 rounded text-[#1E3F34] focus:ring-[#1E3F34] border-[#E8E0D2] mt-0.5 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1E1715]">
                              New Arrival
                            </span>
                            <span className="text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#1E3F34] text-[#E5D2A4]">
                              NEW ARRIVAL
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8C7A6B] mt-1 font-light leading-relaxed">
                            Marks as fresh loom addition and displays in Homepage New Arrivals.
                          </p>
                        </div>
                      </label>

                      {/* Featured Switch */}
                      <label
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          formData.is_featured
                            ? "bg-[#FAF0DC]/50 border-[#C5A059] shadow-xs"
                            : "bg-white border-[#E8E0D2] hover:border-[#C5A059]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleInputChange}
                          aria-label="Featured badge"
                          className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] mt-0.5 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1E1715]">
                              Featured
                            </span>
                            <span className="text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF0DC] text-[#6E121E] border border-[#C5A059]">
                              FEATURED
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8C7A6B] mt-1 font-light leading-relaxed">
                            Presents in the homepage Curated Saree Showcase carousel.
                          </p>
                        </div>
                      </label>

                      {/* Best Seller Switch */}
                      <label
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          formData.is_best_seller
                            ? "bg-[#6E121E]/5 border-[#6E121E] shadow-xs"
                            : "bg-white border-[#E8E0D2] hover:border-[#C5A059]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="is_best_seller"
                          checked={formData.is_best_seller}
                          onChange={handleInputChange}
                          aria-label="Best Seller badge"
                          className="w-4 h-4 rounded text-[#6E121E] focus:ring-[#6E121E] border-[#E8E0D2] mt-0.5 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1E1715]">
                              Best Seller
                            </span>
                            <span className="text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#6E121E] text-white">
                              BEST SELLER
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8C7A6B] mt-1 font-light leading-relaxed">
                            Flags highly favored drapes for bridal and festive buyers.
                          </p>
                        </div>
                      </label>

                      {/* Limited Stock Switch */}
                      <label
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                          formData.is_limited_stock
                            ? "bg-amber-500/10 border-amber-400 shadow-xs"
                            : "bg-white border-[#E8E0D2] hover:border-[#C5A059]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="is_limited_stock"
                          checked={formData.is_limited_stock}
                          onChange={handleInputChange}
                          aria-label="Limited Stock badge"
                          className="w-4 h-4 rounded text-[#92400E] focus:ring-[#92400E] border-[#E8E0D2] mt-0.5 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1E1715]">
                              Limited Stock
                            </span>
                            <span className="text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-amber-300">
                              LIMITED STOCK
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8C7A6B] mt-1 font-light leading-relaxed">
                            Notifies buyers of limited weaver quantities remaining.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* SECTION 5: Craft & Fabric Specifications */}
                  <div>
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E0D2]">
                      <Layers className="w-4 h-4 text-[#C5A059]" />
                      <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                        Fabric, Weave & Artisan Craft
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                      {/* Fabric */}
                      <div>
                        <label
                          htmlFor="fabric"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Fabric
                        </label>
                        <input
                          id="fabric"
                          name="fabric"
                          type="text"
                          value={formData.fabric}
                          onChange={handleInputChange}
                          placeholder="e.g. Pure Mulberry Silk / Tissue Organza"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        />
                      </div>

                      {/* Craft / Weave */}
                      <div>
                        <label
                          htmlFor="craft"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Craft / Weave
                        </label>
                        <input
                          id="craft"
                          name="craft"
                          type="text"
                          value={formData.craft}
                          onChange={handleInputChange}
                          placeholder="e.g. Traditional Handloom / Banarasi Brocade"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        />
                      </div>

                      {/* Zari Type */}
                      <div>
                        <label
                          htmlFor="zari_type"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Zari Type
                        </label>
                        <input
                          id="zari_type"
                          name="zari_type"
                          type="text"
                          value={formData.zari_type}
                          onChange={handleInputChange}
                          placeholder="e.g. Pure Gold Zari / Tested Silver Zari"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        />
                      </div>

                      {/* Occasion */}
                      <div>
                        <label
                          htmlFor="occasion"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Occasion
                        </label>
                        <input
                          id="occasion"
                          name="occasion"
                          type="text"
                          value={formData.occasion}
                          onChange={handleInputChange}
                          placeholder="e.g. Bridal Muhurtham / Festive Puja"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        />
                      </div>

                      {/* Color */}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="color"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                        >
                          Color Palette
                        </label>
                        <input
                          id="color"
                          name="color"
                          type="text"
                          value={formData.color}
                          onChange={handleInputChange}
                          placeholder="e.g. Vermillion Red body with Antique Gold Temple Border"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: Boutique Narrative & Description */}
                  <div>
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8E0D2]">
                      <FileText className="w-4 h-4 text-[#C5A059]" />
                      <h2 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                        Saree Description & Boutique Notes
                      </h2>
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="description"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1.5"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Detail the pallu motifs, border weave, body textures, drape weight, and styling suggestions for this boutique piece..."
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E0D2] text-sm text-[#1E1715] placeholder-[#B5A89B] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition leading-relaxed"
                      />
                      <p className="text-[11px] text-[#8C7A6B] mt-1 font-light">
                        Displays on the product detail page and helps customers understand the heritage and craftsmanship.
                      </p>
                    </div>
                  </div>

                  {/* Submission Notice & Buttons */}
                  <div className="pt-4 border-t border-[#E8E0D2] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-[#8C7A6B] font-light">
                      <span className="text-[#6E121E] font-bold">*</span> Required fields
                      must be filled before publishing.
                    </p>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleResetForm}
                        disabled={isSubmitting || isUploadingImage}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-[#E8E0D2] bg-white hover:bg-gray-50 text-[#8C7A6B] hover:text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || isUploadingImage || isUploadingVideo}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6E121E] via-[#590D18] to-[#6E121E] text-white hover:opacity-95 text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 transform active:scale-98"
                      >
                        {isUploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading Photograph...</span>
                          </>
                        ) : isUploadingVideo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading Video...</span>
                          </>
                        ) : isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving Saree...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-[#C5A059]" />
                            <span>Publish Saree to Catalogue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Sidebar: Live Catalogue Card Preview & Helper Info */}
              <div className="lg:col-span-4 space-y-6">
                {/* Live Preview Card */}
                <div className="bg-[#FAF7F2] rounded-3xl border border-[#C5A059]/40 p-6 shadow-xs sticky top-24">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D2] mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <h3 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                        Catalogue Live Preview
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#FAF6EE] text-[#6E121E] px-2 py-0.5 rounded-full border border-[#C5A059]/30">
                      Live
                    </span>
                  </div>

                  {/* Miniature Saree Card Representation */}
                  <div className="bg-white rounded-2xl border border-[#E8E0D2] overflow-hidden shadow-2xs">
                    {/* Saree Image Box (Shows uploaded preview or elegant category swatch) */}
                    <div className="relative aspect-[3/4] bg-stone-100 flex flex-col items-center justify-center overflow-hidden">
                      {selectedPhotos.length > 0 ? (
                        <>
                          {/* Real Selected Cover Image Preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              selectedPhotos.find((p) => p.isCover)?.previewUrl ||
                              selectedPhotos[0]?.previewUrl
                            }
                            alt="Live Saree Preview"
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                          {/* Multi-photo indicator on preview card */}
                          {selectedPhotos.length > 1 && (
                            <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                              <Images className="w-3 h-3 text-[#C5A059]" />
                              <span>{selectedPhotos.length} photos</span>
                            </span>
                          )}
                        </>
                      ) : (
                        /* Graceful Swatch Placeholder */
                        <div className="p-4 text-center flex flex-col items-center justify-center h-full">
                          <div className="w-12 h-12 rounded-full bg-white/80 border border-[#C5A059]/40 flex items-center justify-center text-[#6E121E] shadow-xs mb-2">
                            <Sparkles className="w-5 h-5 text-[#C5A059]" />
                          </div>
                          <span className="text-xs font-serif-luxury font-bold text-[#6E121E]">
                            {CATEGORIES.find((c) => c.value === formData.category)?.label ||
                              "Heritage Silks"}
                          </span>
                          <span className="text-[10px] text-[#8C7A6B] mt-0.5">
                            Category Default Preview
                          </span>
                        </div>
                      )}

                      {/* Stock Status Badge */}
                      <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/95 text-[#1E3F34] border border-[#A7F3D0]/60 shadow-2xs">
                        {formData.stock_status}
                      </span>

                      {/* SKU Tag */}
                      <span className="absolute bottom-3 left-3 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/75 text-white backdrop-blur-xs">
                        {formData.sku ? formData.sku : "SKU-CODE"}
                      </span>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C7A6B]">
                          {CATEGORIES.find((c) => c.value === formData.category)?.label ||
                            "Heritage Silks"}
                        </span>
                        <h4 className="font-serif-luxury text-base font-bold text-[#1E1715] leading-snug line-clamp-2">
                          {formData.name ? formData.name : "Your Saree Name Here"}
                        </h4>
                      </div>

                      {/* Price Display */}
                      <div className="flex items-baseline gap-1.5 pt-1 border-t border-[#F0EBE0]">
                        {formData.price && !isNaN(Number(formData.price)) ? (
                          <>
                            <span className="text-base font-bold text-[#6E121E]">
                              ₹{Number(formData.price).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-[#8C7A6B]">INR</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-[#8C7A6B]">
                            Price on Inquiry
                          </span>
                        )}
                      </div>

                      {/* Attributes preview */}
                      {(formData.fabric || formData.craft || formData.color) && (
                        <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                          {formData.fabric && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#5A4E46] border border-[#E8E0D2]">
                              {formData.fabric}
                            </span>
                          )}
                          {formData.craft && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#5A4E46] border border-[#E8E0D2]">
                              {formData.craft}
                            </span>
                          )}
                          {formData.color && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF6EE] text-[#5A4E46] border border-[#E8E0D2]">
                              {formData.color}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supabase Storage Notice */}
                  <div className="mt-5 p-3.5 rounded-xl bg-[#FAF6EE] border border-[#C5A059]/30 text-xs text-[#5A4E46] space-y-1">
                    <p className="font-semibold text-[#6E121E] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Supabase Storage Integration</span>
                    </p>
                    <p className="text-[11px] text-[#8C7A6B] leading-relaxed font-light">
                      Photographs uploaded here are stored in the <code className="font-mono text-[#6E121E]">saree-images</code> bucket and served publicly to customer cards, product detail pages, and WhatsApp previews.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#E8E0D2] bg-[#FAF7F2] py-4 text-center text-xs text-[#8C7A6B]">
            <p>
              {SHOP_CONFIG.brandName} Boutique Administration • Armoor, Telangana
            </p>
          </footer>
        </div>
      )}
    </AdminGuard>
  );
}
