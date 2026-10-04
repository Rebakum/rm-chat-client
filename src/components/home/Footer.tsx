import Image from "next/image";
import Link from "next/link";

interface FooterProps {
  portalHref: string;
}

export default function Footer({ portalHref }: FooterProps) {
  return (
    <footer className="bg-[#222220] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex rounded py-1"
              aria-label="Rahmah Institute"
            >
              <Image
                src="/Rahmah-Institute-Logo.png"
                alt="Rahmah Institute"
                width={150}
                height={32}
                className="h-8 w-auto object-contain "
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
              A secure communication space for the Rahmah Institute student and
              teacher community.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#90c844]">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <a href="#features" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white">
                  About Institute
                </a>
              </li>
              <li>
                <Link href={portalHref} className="hover:text-white">
                  Student Portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#90c844]">Community</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <a href="#community-rules" className="hover:text-white">
                  Community Rules
                </a>
              </li>
              <li>
                <a href="#community-rules" className="hover:text-white">
                  Privacy &amp; Safety
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Student/Teacher Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#90c844]">
              Rahmah Web Chat
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Connect with verified members and keep your learning conversations
              in one place.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Rahmah Institute. All rights reserved.
          </p>
          <p>Built for respectful learning and communication.</p>
        </div>
      </div>
    </footer>
  );
}
