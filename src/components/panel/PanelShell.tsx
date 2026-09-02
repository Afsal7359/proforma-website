import Link from "next/link";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { initials } from "@/lib/format";
import type { Session } from "@/lib/session";
import { PanelNav, type NavItem } from "./PanelNav";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  tutor: "Coach",
  client: "Athlete",
};

export function PanelShell({
  session,
  nav,
  children,
}: {
  session: Session;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <header className="panel-topbar">
        <div className="inner">
          <Link href="/" className="brand" aria-label="Proforma Co home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark-alt.png" alt="" width={32} height={32} />
            <span className="brand-text">
              <span className="name">PROFORMA CO</span>
              <span className="sub">Sports Consultancy</span>
            </span>
          </Link>

          <div className="panel-user">
            <span className="panel-role">{ROLE_LABEL[session.role]}</span>
            <div className="who">
              <b>{session.name}</b>
              <span>{session.loginId}</span>
            </div>
            <div className="panel-avatar" aria-hidden="true">
              {initials(session.name)}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="panel-body">
        <PanelNav items={nav} />
        <main className="panel-main">{children}</main>
      </div>
    </div>
  );
}

export function PageHead({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <>
      {breadcrumb && (
        <div className="breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={b.label} style={{ display: "contents" }}>
              {i > 0 && <span>/</span>}
              {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </div>
      )}
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  text,
  action,
}: {
  icon?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="ico">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  icon?: string;
  accent?: "blue" | "gold" | "green";
}) {
  return (
    <div className={`stat-card${accent ? ` accent-${accent}` : ""}`}>
      {icon && (
        <span className="spark">
          <Icon name={icon} />
        </span>
      )}
      <span className="k">{label}</span>
      <span className="v">{value}</span>
      {detail && <span className="d">{detail}</span>}
    </div>
  );
}
