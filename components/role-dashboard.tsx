import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  HandCoins,
  House,
  Landmark,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Store,
  UsersRound,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { Role, SessionPrincipal } from "@/lib/domain/auth";
import { roleHomePath, roleLabels } from "@/lib/domain/rbac";
import { LogoutButton } from "./logout-button";

type DashboardMetric = {
  label: string;
  value: string;
  status?: string;
};

type DashboardAction = {
  label: string;
  description: string;
  href?: string;
};

type DashboardCta = {
  label: string;
  href: string;
};

type DashboardWidget = {
  title: string;
  description?: string;
  metrics?: DashboardMetric[];
  actions?: DashboardAction[];
  cta?: DashboardCta;
  content?: ReactNode;
  span?: "half" | "full";
  tone?: "white" | "forest" | "orange";
};

type RoleDashboardProps = {
  role: Role;
  roleTitle?: string;
  session: SessionPrincipal;
  cooperativeName: string;
  location: string;
  activeModule: string;
  widgets: DashboardWidget[];
  headerRight?: ReactNode;
};

type RoleNavItem = {
  label: string;
  href?: string;
  icon: IconName;
  featured?: boolean;
};

const roleNavItems: Record<Role, RoleNavItem[]> = {
  staff: [
    // { label: "Home", href: "/staff", icon: "home" },
    { label: "Stock", href: "/staff/batches", icon: "stock" },
    { label: "Scresh", href: "/staff/scan", icon: "scresh", featured: true },
    { label: "Distribusi", href: "/staff/movements", icon: "tasks" },
  ],
  credit: [
    // { label: "Home", icon: "home" },
    { label: "Members", href: "/credit", icon: "members" },
    { label: "Risk", href: "/credit", icon: "loans", featured: true },
    { label: "Sharing", href: "/credit", icon: "verified" },
  ],
  manager: [
    // { label: "Home", icon: "home" },
    // { label: "Scresh", href: "/manager", icon: "scresh" },
    { label: "Credit", href: "/manager", icon: "loans" },
    { label: "Approvals", href: "/manager", icon: "approval", featured: true },
    { label: "Reports", href: "/manager", icon: "reports" },
  ],
  supervisor: [
    // { label: "Home", icon: "home" },
    // { label: "Loans", href: "/supervisor", icon: "loans" },
    { label: "Flags", href: "/supervisor/audit", icon: "shield" },
    {
      label: "Audit",
      href: "/supervisor/audit",
      icon: "audit",
      featured: true,
    },
    { label: "Reports", href: "/supervisor/audit", icon: "reports" },
  ],
  partner: [
    // { label: "Home", icon: "home" },
    { label: "Portfolio", href: "/partner", icon: "portfolio" },
    { label: "Insight", href: "/partner", icon: "reports", featured: true },
    { label: "Financing", href: "/partner", icon: "financing" },
    { label: "Verified", href: "/partner", icon: "verified" },
  ],
  admin: [
    // { label: "Home", icon: "home" },
    { label: "Users", href: "/admin", icon: "members" },
    { label: "Audit", href: "/admin", icon: "audit", featured: true },
    { label: "Approvals", href: "/admin", icon: "approval" },
    { label: "Reports", href: "/admin", icon: "reports" },
  ],
};

export function RoleDashboard({
  role,
  roleTitle,
  session,
  cooperativeName,
  location,
  activeModule,
  widgets,
  headerRight,
}: RoleDashboardProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-[#effbd6] to-lime pb-28 text-forest">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 md:px-8">
        <aside>
          <DashboardHeader session={session} right={headerRight} />
          <IdentityCard
            activeModule={activeModule}
            cooperativeName={cooperativeName}
            location={location}
            role={role}
            roleTitle={roleTitle}
          />
        </aside>

        <section className="grid items-stretch gap-5 sm:grid-cols-2">
          {widgets.map((widget) => (
            <WidgetCard key={widget.title} widget={widget} />
          ))}
        </section>
      </div>

      <BottomNavigation role={role} />
    </main>
  );
}

function DashboardHeader({
  session,
  right,
}: {
  session: SessionPrincipal;
  right?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-white text-lg font-bold text-forest">
          {getInitials(session.user.name)}
        </div>
        <div className="min-w-0">
          <p className="text-base leading-5 text-forest/65">Selamat pagi!</p>
          <p className="truncate text-2xl font-bold leading-8 text-forest">
            {session.user.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {right}
        <IconButton label="Kalender" icon="calendar" />
        <LogoutButton />
      </div>
    </header>
  );
}

function IdentityCard({
  activeModule,
  cooperativeName,
  location,
  role,
  roleTitle,
}: {
  activeModule: string;
  cooperativeName: string;
  location: string;
  role: Role;
  roleTitle?: string;
}) {
  return (
    <section className="rounded-[32px] bg-lime p-7 text-forest">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
          <Icon name="store" className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-bold leading-5">{cooperativeName}</p>
          <p className="text-sm leading-5">{location}</p>
        </div>
      </div>
      <h1 className="font-sans text-[2.25rem] font-medium leading-none tracking-normal md:text-[2.5rem]">
        {roleTitle ?? `${roleLabels[role]} Koperasi`}
      </h1>
      <p className="mt-3 text-lg leading-6">Modul aktif: {activeModule}</p>
    </section>
  );
}

function WidgetCard({ widget }: { widget: DashboardWidget }) {
  const toneClass =
    widget.tone === "forest"
      ? "bg-forest text-white"
      : widget.tone === "orange"
        ? "bg-orange text-forest"
        : "bg-white text-forest";
  const descriptionClass =
    widget.tone === "white" || !widget.tone
      ? "text-forest/65"
      : widget.tone === "orange"
        ? "text-forest/75"
        : "text-white/78";

  return (
    <section
      className={widget.span === "full" ? "h-full sm:col-span-2" : "h-full"}
    >
      {widget.cta && !widget.metrics && !widget.actions && !widget.content ? (
        <Link
          className="flex h-full min-h-[140px] items-center justify-between gap-5 rounded-[28px] bg-white p-5 text-forest transition hover:brightness-[0.98]"
          href={widget.cta.href}
        >
          <span>
            <span className="block font-sans text-2xl font-semibold leading-8 tracking-normal">
              {widget.title}
            </span>
            {widget.description ? (
              <span className="mt-1 block text-sm leading-5 text-forest/65">
                {widget.description}
              </span>
            ) : null}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="h-7 w-7 shrink-0"
            strokeWidth={2.25}
          />
        </Link>
      ) : (
        <div
          className={`flex h-full min-h-[140px] flex-col rounded-[28px] p-5 ${toneClass}`}
        >
          <div className="mb-5">
            <p className="font-sans text-2xl font-semibold leading-8 tracking-normal">
              {widget.title}
            </p>
            {widget.description ? (
              <p className={`mt-1 text-sm leading-5 ${descriptionClass}`}>
                {widget.description}
              </p>
            ) : null}
          </div>

          {widget.metrics ? (
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              {widget.metrics.map((metric) => (
                <div
                  className={`rounded-[18px] p-4 ${
                    widget.tone === "forest"
                      ? "bg-forest text-white"
                      : "bg-white text-forest"
                  }`}
                  key={metric.label}
                >
                  <p
                    className={`font-sans text-4xl font-bold leading-9 tracking-normal ${
                      widget.tone === "forest" ? "text-lime" : ""
                    }`}
                  >
                    {metric.value}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-5 ${
                      widget.tone === "forest" ? "text-white" : "text-forest/70"
                    }`}
                  >
                    {metric.label}
                  </p>
                  {metric.status ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-normal">
                      {metric.status}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {widget.actions ? (
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              {widget.actions.map((action) => {
                const className =
                  "rounded-[18px] bg-lime/35 px-4 py-3 text-left text-forest transition hover:bg-lime/55 focus:outline-none focus:ring-2 focus:ring-forest/20";
                const content = (
                  <>
                    <span className="block text-sm font-bold">
                      {action.label}
                    </span>
                    <span className="mt-1 block text-xs leading-4 text-forest/70">
                      {action.description}
                    </span>
                  </>
                );

                return action.href ? (
                  <Link
                    className={className}
                    href={action.href}
                    key={action.label}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    className={className}
                    key={action.label}
                    type="button"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ) : null}

          {widget.content ? (
            <div className="flex-1">{widget.content}</div>
          ) : null}

          {widget.cta ? (
            <Link
              className={`inline-flex rounded-[12px] px-4 py-3 text-sm font-bold transition ${
                widget.tone === "forest"
                  ? "bg-lime text-forest hover:bg-lime/85"
                  : "bg-forest text-white hover:bg-forest/90"
              }`}
              href={widget.cta.href}
            >
              {widget.cta.label}
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}

function BottomNavigation({ role }: { role: Role }) {
  const navItems = roleNavItems[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-forest/10 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-xl items-end justify-around gap-1">
        {navItems.map((item) => (
          <Link
            className={`flex flex-col items-center justify-end gap-1 text-center text-xs text-forest ${
              item.featured ? "-mt-9" : ""
            }`}
            href={item.href ?? roleHomePath[role]}
            key={item.label}
          >
            <span
              className={`grid place-items-center ${
                item.featured
                  ? "h-20 w-20 rounded-full bg-lime shadow-[0_-8px_22px_rgba(181,233,48,0.35)]"
                  : "h-8 w-8"
              }`}
            >
              <Icon
                name={item.icon}
                className={item.featured ? "h-9 w-9" : "h-7 w-7"}
              />
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function IconButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <button
      aria-label={label}
      className="grid h-14 w-14 place-items-center rounded-full bg-lime text-forest transition hover:bg-lime/80"
      type="button"
    >
      <Icon name={icon} className="h-7 w-7" />
    </button>
  );
}

type IconName =
  | "approval"
  | "audit"
  | "calendar"
  | "financing"
  | "home"
  | "loans"
  | "members"
  | "portfolio"
  | "reports"
  | "scresh"
  | "shield"
  | "stock"
  | "store"
  | "tasks"
  | "verified";

const icons: Record<IconName, LucideIcon> = {
  approval: ClipboardCheck,
  audit: FileSearch,
  calendar: CalendarDays,
  financing: Landmark,
  home: House,
  loans: HandCoins,
  members: UsersRound,
  portfolio: ChartNoAxesCombined,
  reports: ClipboardList,
  scresh: Sprout,
  shield: ShieldCheck,
  stock: Boxes,
  store: Store,
  tasks: PackageCheck,
  verified: BadgeCheck,
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  const Component = icons[name];
  return (
    <Component aria-hidden="true" className={className} strokeWidth={2.25} />
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
