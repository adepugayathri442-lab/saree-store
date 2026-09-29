"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { getWhatsAppUrl } from "@/config/shop";

interface CameraSearchProps {
  onPhotoSelected?: (file: File, previewUrl: string) => void;
  onPhotoCleared?: () => void;
  className?: string;
  buttonLabel?: string;
}

export default function CameraSearch({
  onPhotoSelected,
  onPhotoCleared,
  className = "",
  buttonLabel = "Photo Search",
}: CameraSearchProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isChooserOpen, setIsChooserOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image MIME type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedPhoto(file);
    setPreviewUrl(url);
    setIsChooserOpen(false);

    if (onPhotoSelected) {
      onPhotoSelected(file, url);
    }
  };

  const handleClearPhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedPhoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";

    if (onPhotoCleared) {
      onPhotoCleared();
    }
  };

  const whatsappInquiryUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am inquiring from the SaiSrujana website with a saree photograph I would like to match. Could you check if similar sarees or drapes are available in Armoor?`
  );

  return (
    <div className={`relative ${className}`}>
      {/* Hidden Native File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="Upload Saree Photo from Device"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Capture Saree Photo with Device Camera"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Search Action Trigger Button */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => setIsChooserOpen((prev) => !prev)}
          title="Search using a saree photo or camera"
          aria-label="Search sarees using device camera or photo upload"
          aria-haspopup="dialog"
          aria-expanded={isChooserOpen}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer border ${
            previewUrl
              ? "bg-[#6E121E] text-white border-[#821524] shadow-sm"
              : "bg-white hover:bg-[#FAF6EE] text-[#6E121E] hover:text-[#821524] border-[#E8E0D2] hover:border-[#C5A059]"
          }`}
        >
          <Camera className="w-4 h-4 text-[#C5A059]" />
          <span className="hidden sm:inline">{previewUrl ? "Photo Attached" : buttonLabel}</span>
        </button>

        {/* Camera / Upload Mode Chooser Popover */}
        {isChooserOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#FAF7F2] rounded-xl shadow-2xl border border-[#C5A059]/40 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8E0D2]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E1715] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                Photo Saree Search
              </span>
              <button
                type="button"
                onClick={() => setIsChooserOpen(false)}
                className="text-[#8C7A6B] hover:text-[#6E121E] p-0.5"
                aria-label="Close photo search options"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {/* Option 1: Take Photo with Camera */}
              <button
                type="button"
                onClick={() => {
                  cameraInputRef.current?.click();
                  setIsChooserOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-[#2C2420] hover:bg-[#F0EAE1] hover:text-[#6E121E] transition-colors text-left cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#6E121E]" />
                <div>
                  <span className="block font-semibold">Take Photo</span>
                  <span className="text-[10px] text-[#8C7A6B]">Use phone or webcam</span>
                </div>
              </button>

              {/* Option 2: Upload from Device */}
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsChooserOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-[#2C2420] hover:bg-[#F0EAE1] hover:text-[#6E121E] transition-colors text-left cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#C5A059]" />
                <div>
                  <span className="block font-semibold">Upload Image</span>
                  <span className="text-[10px] text-[#8C7A6B]">Select JPG, PNG or WebP</span>
                </div>
              </button>
            </div>

            <p className="mt-2.5 pt-2 border-t border-[#E8E0D2] text-[10px] text-[#8C7A6B] leading-tight">
              Upload any saree photo or screenshot to match patterns and check availability.
            </p>
          </div>
        )}
      </div>

      {/* Selected Image Preview & Visual Search Assistance Card */}
      {previewUrl && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#C5A059]/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail Preview */}
            <div className="relative w-14 h-16 rounded-lg overflow-hidden border border-[#C5A059] flex-shrink-0 bg-stone-200 shadow-xs">
              <Image
                src={previewUrl}
                alt="Selected saree photo for visual search"
                fill
                className="object-cover object-center"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#6E121E] bg-[#6E121E]/10 px-2 py-0.5 rounded">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  Photo Search Preview
                </span>
              </div>
              <p className="text-xs font-semibold text-[#1E1715] truncate max-w-[200px] sm:max-w-xs">
                {selectedPhoto?.name || "Uploaded Saree Photo"}
              </p>
              <p className="text-[11px] text-[#8C7A6B] flex items-center gap-1">
                <span>
                  {selectedPhoto ? `${(selectedPhoto.size / 1024).toFixed(0)} KB` : "Image attached"}
                </span>
                <span>•</span>
                <span className="text-[#1E3F34] font-medium">Ready for Inquiry</span>
              </p>
            </div>
          </div>

          {/* Action: Direct WhatsApp matching & Clear Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3F34] text-white text-xs font-semibold rounded-lg btn-premium-whatsapp shadow-xs whitespace-nowrap cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
              <span>Match on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleClearPhoto}
              aria-label="Remove selected photo"
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-[#6E121E] text-stone-600 hover:text-white transition-colors cursor-pointer"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
