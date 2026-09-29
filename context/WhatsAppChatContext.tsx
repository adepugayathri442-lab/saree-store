"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Saree, SareeVariant } from "@/types/saree";

interface WhatsAppChatContextType {
  activeSaree: Saree | null;
  activeVariant: SareeVariant | null;
  setProductChatContext: (saree: Saree | null, variant?: SareeVariant | null) => void;
}

const WhatsAppChatContext = createContext<WhatsAppChatContextType>({
  activeSaree: null,
  activeVariant: null,
  setProductChatContext: () => {},
});

export function WhatsAppChatProvider({ children }: { children: ReactNode }) {
  const [activeSaree, setActiveSaree] = useState<Saree | null>(null);
  const [activeVariant, setActiveVariant] = useState<SareeVariant | null>(null);

  const setProductChatContext = (saree: Saree | null, variant?: SareeVariant | null) => {
    setActiveSaree(saree);
    setActiveVariant(variant || null);
  };

  return (
    <WhatsAppChatContext.Provider
      value={{ activeSaree, activeVariant, setProductChatContext }}
    >
      {children}
    </WhatsAppChatContext.Provider>
  );
}

export function useWhatsAppChat() {
  return useContext(WhatsAppChatContext);
}
