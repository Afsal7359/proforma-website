import Link from "next/link";
import { CheckMark } from "@/components/Icon";

/**
 * Split-screen frame shared by /login and /change-password: the dark hero band
 * on the left, the form on the right.
 */
export function AuthShell({
  children,
  asideTitle,
  asideText,
  asidePoints,
}: {
  children: React.ReactNode;
  asideTitle: string;
  asideText: string;
  asidePoints: string[];
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark-alt.png" alt="" width={38} height={38} />
          <span className="brand-text">
            <span className="name">PROFORMA CO</span>
            <span className="sub">Sports Consultancy</span>
          </span>
        </Link>

        <div>
          <h2>{asideTitle}</h2>
          <p>{asideText}</p>
          <ul className="auth-points">
            {asidePoints.map((p) => (
              <li key={p}>
                <CheckMark />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <footer>
          Football-only coaching consultancy · Operating pan-India
        </footer>
      </aside>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
