import { Phone, Mail, MapPin, MessageCircle, Navigation, User } from "lucide-react";
import { SHOP_CONFIG, getWhatsAppUrl } from "@/config/shop";

export default function ContactSection() {
  const whatsAppUrl = getWhatsAppUrl(
    `Hello Gangadhar garu, I am visiting the SaiSrujana website and would like to contact your boutique.`
  );

  return (
    <section id="contact" className="py-20 bg-[#F5EFE6]/60 border-t border-[#E8E0D2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-[#8C7A6B] mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Connect & Visit</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl text-[#1E1715] font-bold tracking-tight mb-4">
            Visit Our Store & Contact Us
          </h2>
          <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mb-4" />
          <p className="text-sm sm:text-base text-[#5A4E46] font-light leading-relaxed">
            Have questions about our saree collections or planning to visit our store in Armoor?
            Get in touch directly with {SHOP_CONFIG.contactPerson} via Phone, WhatsApp, or Email.
          </p>
        </div>

        {/* Contact & Location Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Direct Contact Details */}
          <div className="lg:col-span-6 bg-[#FAF7F2] rounded-2xl p-8 sm:p-10 border border-[#E8E0D2] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-serif-luxury text-2xl font-bold text-[#1E1715] mb-2">
                Boutique Contact
              </h3>
              <p className="text-xs sm:text-sm text-[#5A4E46] mb-8 font-light">
                Reach out for saree inquiries, photos, and direct store assistance.
              </p>

              <div className="space-y-6">
                {/* Contact Person */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center flex-shrink-0 text-[#C5A059]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C7A6B] block">
                      Contact Person
                    </span>
                    <span className="font-serif-luxury text-lg font-bold text-[#2C2420]">
                      {SHOP_CONFIG.contactPerson}
                    </span>
                    <p className="text-xs text-[#8C7A6B]">SaiSrujana Saree Store</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center flex-shrink-0 text-[#C5A059]">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C7A6B] block">
                      Phone Number
                    </span>
                    <a
                      href={`tel:${SHOP_CONFIG.phone}`}
                      className="font-serif-luxury text-lg font-bold text-[#6E121E] hover:text-[#821524] transition"
                    >
                      {SHOP_CONFIG.phoneFormatted}
                    </a>
                    <p className="text-xs text-[#8C7A6B]">Click to call directly</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center flex-shrink-0 text-[#C5A059]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C7A6B] block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${SHOP_CONFIG.email}`}
                      className="text-sm sm:text-base font-medium text-[#2C2420] hover:text-[#6E121E] transition break-all"
                    >
                      {SHOP_CONFIG.email}
                    </a>
                    <p className="text-xs text-[#8C7A6B]">Click to send an email</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Button */}
            <div className="mt-8 pt-6 border-t border-[#E8E0D2]">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-lg bg-[#1E3F34] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase btn-premium-whatsapp flex items-center justify-center gap-3 shadow-md"
              >
                <MessageCircle className="w-5 h-5 text-[#A7F3D0]" />
                <span>Chat on WhatsApp ({SHOP_CONFIG.phoneFormatted})</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visit Our Store */}
          <div className="lg:col-span-6 bg-[#FAF7F2] rounded-2xl p-8 sm:p-10 border border-[#E8E0D2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#C5A059]/15 text-[#8C6B28] text-xs font-semibold uppercase tracking-wider mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>Store Location</span>
              </div>
              <h3 className="font-serif-luxury text-2xl font-bold text-[#1E1715] mb-2">
                Visit Our Store
              </h3>
              <p className="text-xs sm:text-sm text-[#5A4E46] mb-8 font-light">
                Explore our fine Pattu, Fancy, and Daily Wear saree collections in person.
              </p>

              <div className="space-y-6">
                {/* Physical Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center flex-shrink-0 text-[#C5A059]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C7A6B] block">
                      Address
                    </span>
                    <p className="font-serif-luxury text-lg font-bold text-[#2C2420] leading-snug">
                      {SHOP_CONFIG.address}
                    </p>
                    <p className="text-xs text-[#8C7A6B]">
                      Armoor, Nizamabad District, Telangana, India
                    </p>
                  </div>
                </div>

                {/* Direct Consultation note */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#C5A059]/40 flex items-center justify-center flex-shrink-0 text-[#C5A059]">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#8C7A6B] block">
                      Store Visits & Inquiries
                    </span>
                    <p className="text-sm font-semibold text-[#2C2420]">
                      Personal Assistance by Gangadhar
                    </p>
                    <p className="text-xs text-[#8C7A6B]">
                      Feel free to call {SHOP_CONFIG.phoneFormatted} before visiting or for directions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Directions Button */}
            <div className="mt-8 pt-6 border-t border-[#E8E0D2] flex flex-col sm:flex-row gap-3">
              <a
                href={SHOP_CONFIG.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-4 px-6 rounded-lg bg-[#6E121E] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase btn-premium-primary flex items-center justify-center gap-2.5 shadow-md"
              >
                <Navigation className="w-4 h-4 text-[#E5D2A4]" />
                <span>Get Directions (Google Maps)</span>
              </a>

              <a
                href={`tel:${SHOP_CONFIG.phone}`}
                className="py-4 px-6 rounded-lg border border-[#C5A059] text-[#2C2420] hover:bg-[#FAF6EE] text-xs sm:text-sm font-semibold tracking-wider uppercase btn-premium-outline flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#C5A059]" />
                <span>Call Store</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
