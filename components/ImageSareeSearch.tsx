"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Search,
  Eye,
  MessageCircle,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { Saree } from "@/types/saree";
import { formatCurrency, getWhatsAppUrl } from "@/config/shop";
import {
  extractEmbeddingFromFile,
  searchSareesByVisualEmbedding,
  VisualEmbedding,
  VisualSearchResults,
  SareeSearchResult,
} from "@/lib/imageSearch";

interface ImageSareeSearchProps {
  catalogueSarees: Saree[];
  onActiveSearchChange?: (isActive: boolean) => void;
  className?: string;
}

export default function ImageSareeSearch({
  catalogueSarees,
  onActiveSearchChange,
  className = "",
}: ImageSareeSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<VisualSearchResults | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);

    // Validate MIME / extension
    const validExtensions = /\.(jpe?g|png|webp)$/i;
    const isImage = file.type.startsWith("image/") || validExtensions.test(file.name);

    if (!isImage) {
      setErrorMessage("Unsupported file format. Please select a JPG, JPEG, PNG, or WEBP photo.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("The photo is too large (max 15 MB). Please choose a smaller file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setSearchResults(null);
    setHasSearched(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setSearchResults(null);
    setHasSearched(false);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (onActiveSearchChange) onActiveSearchChange(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!searchResults?.hasMatch) {
      handleClear();
    }
  };

  const executeVisualSearch = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Extract visual embedding from uploaded file (spatial color, structure, texture)
      const embedding: VisualEmbedding = await extractEmbeddingFromFile(selectedFile);

      // 2. Perform genuine visual similarity comparison against real catalogue sarees
      const results = await searchSareesByVisualEmbedding(
        embedding,
        catalogueSarees.length > 0 ? catalogueSarees : []
      );

      setSearchResults(results);
      setHasSearched(true);
      if (onActiveSearchChange) {
        onActiveSearchChange(true);
      }

      // Smooth scroll to results
      setTimeout(() => {
        resultsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to process the photo. Please try another saree image.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden File and Camera Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        aria-label="Upload Saree Photo"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take Photo with Camera"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Main Search by Image Trigger CTA Button */}
      {!isOpen && !hasSearched && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Search sarees by uploading an image or photo"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#C5A059]/60 bg-[#FAF6EE] hover:bg-[#F4ECE1] text-[#6E121E] text-xs font-semibold uppercase tracking-wider transition shadow-2xs hover:shadow-xs group cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
          <span>Search by Image</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#6E121E]/10 rounded text-[#6E121E] font-medium hidden md:inline">
            Visual Match
          </span>
        </button>
      )}

      {/* Upload Interface Panel */}
      {isOpen && (
        <div className="w-full bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/50 shadow-lg p-4 sm:p-6 mb-8 animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#E8E0D2]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#6E121E]/10 text-[#6E121E] text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>Visual Saree Discovery</span>
              </div>
              <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1E1715]">
                Search Catalogue by Saree Photo
              </h3>
              <p className="text-xs text-[#5A4E46] mt-0.5 max-w-xl">
                Upload a photo, screenshot, or snap a picture to find matching colours, borders, weaves, and patterns in our real Armoor collection.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close image search interface"
              className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-[#6E121E] hover:bg-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Area / Image Preview */}
          <div className="mt-5">
            {!previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? "border-[#6E121E] bg-[#FAF0DC]/50 scale-[1.01]"
                    : "border-[#C5A059]/50 hover:border-[#C5A059] bg-white/60 hover:bg-white"
                }`}
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#6E121E] shadow-2xs">
                    <Upload className="w-6 h-6 text-[#C5A059]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#1E1715]">
                      Drag and drop your saree photo here
                    </p>
                    <p className="text-xs text-[#8C7A6B] mt-0.5">
                      Supports JPG, JPEG, PNG, or WEBP (up to 15 MB)
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#E5D2A4]" />
                      <span>Browse Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#C5A059]/60 bg-white hover:bg-[#FAF6EE] text-[#1E1715] hover:text-[#6E121E] text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Take Camera Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Selected Image State with Actions */
              <div className="bg-white rounded-2xl border border-[#E8E0D2] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-[#C5A059] shadow-sm bg-stone-100 flex-shrink-0">
                    <Image
                      src={previewUrl}
                      alt="Customer uploaded saree photo"
                      fill
                      className="object-cover object-center"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1E3F34]/10 text-[#1E3F34]">
                      <CheckCircle2 className="w-3 h-3 text-[#1E3F34]" /> Photo Loaded
                    </span>
                    <h4 className="text-sm font-bold text-[#1E1715] truncate max-w-[200px] sm:max-w-xs">
                      {selectedFile?.name || "Uploaded Saree"}
                    </h4>
                    <p className="text-xs text-[#8C7A6B]">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ""} • Visual Feature Analysis Ready
                    </p>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#6E121E] hover:underline cursor-pointer"
                      >
                        Change Photo
                      </button>
                      <span className="text-stone-300">•</span>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs font-semibold text-[#8C7A6B] hover:text-red-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Find Sarees Action */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={executeVisualSearch}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#6E121E] hover:bg-[#590D18] disabled:opacity-75 text-white text-xs font-semibold uppercase tracking-wider transition shadow-md cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing Visual Weaves...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 text-[#E5D2A4]" />
                        <span>Find Sarees</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-[#E8E0D2] hover:bg-[#FAF6EE] text-[#5A4E46] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Matching Results Section */}
      {hasSearched && (
        <div
          ref={resultsContainerRef}
          className="mb-12 pt-4 border-t border-[#E8E0D2] animate-in fade-in duration-300"
        >
          {/* Results Bar / Header */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/40 p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {previewUrl && (
                <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-[#C5A059] shadow-xs flex-shrink-0">
                  <Image
                    src={previewUrl}
                    alt="Query saree thumbnail"
                    fill
                    className="object-cover object-center"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1E1715]">
                    {searchResults?.hasMatch ? "Matching Sarees" : "Search by Image Results"}
                  </h3>
                  {searchResults?.hasMatch && (
                    <span className="px-2 py-0.5 rounded-full bg-[#1E3F34] text-white text-[11px] font-bold">
                      {searchResults.totalMatchesCount} Found
                    </span>
                  )}
                </div>
                {searchResults?.querySummary && (
                  <p className="text-xs text-[#5A4E46] mt-0.5">
                    Analyzed Palette: <span className="font-semibold text-[#1E1715]">{searchResults.querySummary.dominantColorName}</span> • Structure: <span className="font-semibold text-[#1E1715]">{searchResults.querySummary.textureStyle}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Actions: Change Photo / Show All */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C5A059]/60 bg-white hover:bg-[#FAF6EE] text-[#1E1715] text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Try Another Photo</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#E8E0D2] hover:border-[#6E121E] text-[#6E121E] text-xs font-semibold transition cursor-pointer"
                title="Return to full catalogue view"
              >
                <X className="w-3.5 h-3.5" />
                <span>View All Sarees</span>
              </button>
            </div>
          </div>

          {/* Case 1: NO MATCH */}
          {!searchResults?.hasMatch && (
            <div className="text-center py-16 px-4 bg-[#FAF7F2] rounded-3xl border border-[#E8E0D2] max-w-2xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-full bg-white border border-[#C5A059]/50 flex items-center justify-center mx-auto mb-4 text-[#6E121E] shadow-xs">
                <Search className="w-8 h-8 text-[#C5A059]" />
              </div>
              <h4 className="font-serif-luxury text-2xl font-bold text-[#1E1715] mb-2">
                No matching sarees found
              </h4>
              <p className="text-sm text-[#5A4E46] max-w-md mx-auto mb-6 leading-relaxed">
                We could not find sufficiently similar weaves or color palettes in our active online catalogue for this photo.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    fileInputRef.current?.click();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#E5D2A4]" />
                  <span>Try another photo</span>
                </button>

                <a
                  href={getWhatsAppUrl(
                    `Hello Gangadhar garu, I tried searching with a saree photo on the SaiSrujana website. Could you check if similar sarees or uncatalogued drapes are available in your Armoor store?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#A7F3D0]" />
                  <span>Inquire on WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Case 2: RESULTS FOUND */}
          {searchResults?.hasMatch && (
            <div className="space-y-12">
              {/* Closest Match (Top Result) */}
              {searchResults.closestMatch && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                    <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                      Closest Match
                    </h4>
                    <span className="text-xs text-[#8C7A6B] font-light hidden sm:inline">
                      • Highest visual alignment in color, border & weave
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <VisualResultCard
                      result={searchResults.closestMatch}
                      isPrimary
                    />
                  </div>
                </div>
              )}

              {/* Similar Sarees */}
              {searchResults.similarMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6E121E]" />
                    <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                      Similar Sarees
                    </h4>
                    <span className="text-xs text-[#8C7A6B] font-light hidden sm:inline">
                      • Visually related shades, motifs and fabrics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.similarMatches.map((res) => (
                      <VisualResultCard key={res.saree.id} result={res} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated Visual Result Card component with genuine traits breakdown, Price, View Saree & WhatsApp Enquiry
 */
function VisualResultCard({
  result,
  isPrimary = false,
}: {
  result: SareeSearchResult;
  isPrimary?: boolean;
}) {
  const { saree, matchingTraits, tier } = result;

  const enquiryWhatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I found "${saree.name}" (SKU: ${saree.sku}) via Image Search on the SaiSrujana website. Please share availability and current pricing.`
  );

  return (
    <div
      className={`group bg-[#FAF7F2] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
        isPrimary
          ? "border-[#C5A059] shadow-md ring-1 ring-[#C5A059]/40 bg-gradient-to-b from-[#FAF6EE] to-[#FAF7F2]"
          : "border-[#E8E0D2] hover:border-[#C5A059] shadow-xs hover:shadow-md"
      }`}
    >
      <div>
        {/* Image Area */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
          <Link href={`/sarees/${saree.id}`} className="block w-full h-full">
            <Image
              src={saree.image}
              alt={saree.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </Link>

          {/* Visual Match Tier Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
            {tier === "exact" ? (
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-[#1E3F34] text-white shadow-xs">
                Exact Visual Match
              </span>
            ) : isPrimary ? (
              <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-[#6E121E] text-[#E5D2A4] border border-[#C5A059] shadow-xs">
                Closest Match
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[9.5px] uppercase font-bold tracking-wider bg-white/90 backdrop-blur-md text-[#1E1715] border border-[#E8E0D2] shadow-xs">
                Similar Saree
              </span>
            )}
          </div>

          {/* Quick Details Hover */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Link
              href={`/sarees/${saree.id}`}
              className="w-full py-2 px-3 bg-white/95 backdrop-blur-md text-[#1E1715] hover:text-[#6E121E] text-xs font-semibold rounded-lg shadow-sm border border-[#E8E0D2] flex items-center justify-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>View Saree</span>
            </Link>
          </div>
        </div>

        {/* Content & Specs */}
        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-[#8C7A6B] mb-1.5">
            <span className="font-medium text-[#C5A059] flex items-center gap-1">
              <Tag className="w-3 h-3" /> {saree.categoryLabel}
            </span>
            <span className="text-[10px] font-mono text-[#8C7A6B]">{saree.sku}</span>
          </div>

          <Link href={`/sarees/${saree.id}`}>
            <h3 className="font-serif-luxury text-base font-bold text-[#1E1715] leading-snug mb-1.5 group-hover:text-[#6E121E] transition line-clamp-1">
              {saree.name}
            </h3>
          </Link>

          {/* Colour and Fabric Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] text-[#5A4E46]">
            {saree.color && (
              <span className="px-2 py-0.5 bg-white rounded border border-[#E8E0D2]">
                {saree.color}
              </span>
            )}
            {saree.fabric && (
              <span className="px-2 py-0.5 bg-white rounded border border-[#E8E0D2]">
                {saree.fabric}
              </span>
            )}
          </div>

          {/* Genuine Visual Match Traits */}
          {matchingTraits.length > 0 && (
            <div className="mb-3.5 p-2 rounded-lg bg-white/70 border border-[#C5A059]/30 text-[10.5px] text-[#6E121E] space-y-0.5">
              {matchingTraits.slice(0, 2).map((trait, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#C5A059] flex-shrink-0" />
                  <span className="truncate">{trait}</span>
                </div>
              ))}
            </div>
          )}

          {/* Price & Stock */}
          <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-[#E8E0D2]/50">
            <span className="text-sm font-semibold text-[#6E121E]">
              {formatCurrency(saree.price)}
            </span>
            <span className="text-[10.5px] font-medium text-[#1E3F34] bg-[#E8F3EE] px-2 py-0.5 rounded">
              {saree.stockStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="p-5 pt-0 space-y-2">
        <Link
          href={`/sarees/${saree.id}`}
          className="w-full py-2.5 px-3 rounded-xl border border-[#6E121E] text-[#6E121E] hover:bg-[#6E121E] hover:text-white text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Saree</span>
        </Link>

        <a
          href={enquiryWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 rounded-xl bg-[#1E3F34] hover:bg-[#285345] text-white text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#A7F3D0]" />
          <span>Enquire Now</span>
        </a>
      </div>
    </div>
  );
}
