// Footer — present on customer-facing pages.
export default function Footer() {
  return (
    <footer className="mt-12 border-t border-bazaar-border bg-white">
      <div className="max-w-[1240px] mx-auto px-5 py-8 grid gap-6 md:grid-cols-3 text-[12.5px] text-bazaar-ink2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-full bg-bazaar-gold text-bazaar-ink flex items-center justify-center font-serif text-[12px] font-bold">
              ৯৯
            </span>
            <span className="font-serif text-[15px] font-bold text-bazaar-ink">Taka Bazaar</span>
          </div>
          <p className="text-bazaar-ink3 leading-relaxed">
            Everything ৳99. Smart pricing — free delivery on 3+ items and a free
            item when you order 6 or more.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-bazaar-ink mb-2">Explore</h4>
          <ul className="space-y-1">
            <li>Browse all 15 categories</li>
            <li>Visit any of 5 vendor stalls</li>
            <li>Top-selling this week</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-bazaar-ink mb-2">Get in touch</h4>
          <ul className="space-y-1 text-bazaar-ink3">
            <li>Sign up to start shopping</li>
            <li>Open your own vendor stall</li>
            <li>Reach support anytime</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bazaar-border py-3 text-center text-[11.5px] text-bazaar-ink3">
        © {new Date().getFullYear()} 99 Taka Bazaar — Ninety Nine Taka Hat
      </div>
    </footer>
  );
}