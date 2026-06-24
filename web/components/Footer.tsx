import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)" }} className="text-[#1c3a2a]">
      {/* Footer links */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#2d5a3d]">
        <div>
          <p className="font-bold text-[#1c3a2a] mb-3">Our Store</p>
          <p className="font-semibold text-[#1c3a2a]">Lingaswamy DC</p>
          <p>Eduloore, Nalgonda</p>
          <p>Telangana – 508205</p>
        </div>
        <div>
          <p className="font-bold text-[#1c3a2a] mb-3">Contact</p>
          <p>support@place2place.app</p>
          <p>+91 85001 36964</p>
        </div>
        <div className="md:text-right">
          <p className="text-[#1c3a2a]/50 text-xs mb-3">🌿 Place2Place © 2026</p>
          <div className="flex gap-4 md:justify-end">
            <Link href="#" className="hover:text-[#1c3a2a] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#1c3a2a] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#1c3a2a] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
