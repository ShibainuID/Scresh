import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  backHref: string;
  rightAction?: React.ReactNode;
};

export function PageHeader({ title, backHref, rightAction }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        className="grid h-12 w-12 place-items-center rounded-full bg-lime text-forest transition hover:bg-lime/85"
        href={backHref}
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={2.25} />
      </Link>

      <h1 className="flex-1 text-center font-sans text-2xl font-semibold leading-8 text-forest">
        {title}
      </h1>

      {rightAction ? (
        <div className="h-12 w-12">{rightAction}</div>
      ) : (
        <div className="h-12 w-12" />
      )}
    </header>
  );
}
