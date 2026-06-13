import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/button";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-forest text-white md:grid md:grid-cols-[0.9fr_1.1fr]">
      <Button
        className="fixed left-6 top-6 z-[5] gap-2 bg-transparent px-0 text-white hover:brightness-100"
        href="/"
        size="sm"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        Kembali
      </Button>
      <section className="fixed left-0 right-0 top-0 z-0 flex h-[34vh] flex-col justify-end px-8 pb-12 pt-10 md:sticky md:left-auto md:right-auto md:min-h-screen md:px-12 md:py-12">
        <div className="space-y-2">
          <h1 className="text-white">Masuk</h1>
          <p className="text-white/72">
            Gunakan email dan password yang sudah terdaftar.
          </p>
        </div>
      </section>

      <section className="relative z-10 mt-[34vh] min-h-[66vh] rounded-t-[40px] bg-white px-8 pt-16 text-forest md:mt-0 md:flex md:min-h-screen md:items-center md:justify-center md:rounded-none md:px-12 md:py-12">
        <div className="mx-auto w-full max-w-md pb-8">
          <AuthForm
            title="Autentikasi"
            description="Gunakan akun koperasi yang sudah terdaftar."
            action={loginAction}
            autofillPresets={[
              { email: "siti.melati@koperasi.id", password: "Password123" },
            ]}
            autofillMemoryMode="login"
            autofillShortcuts={{
              p: { email: "siti.melati@koperasi.id", password: "Password123" },
              m: { email: "budi.melati@koperasi.id", password: "Password123" },
              s: { email: "dina.supervisor@koperasi.id", password: "Password123" },
              b: { email: "raka.partner@koperasi.id", password: "Password123" },
            }}
            submitLabel="Sign In"
            fields={[
              {
                name: "email",
                label: "Email",
                type: "email",
                autoComplete: "email",
                placeholder: "nama@koperasi.id",
              },
              {
                name: "password",
                label: "Password",
                type: "password",
                autoComplete: "current-password",
                placeholder: "Masukkan password",
              },
            ]}
          />

          <p className="mt-8 text-center text-sm text-[#646464]">
            Belum pernah mendaftar?{" "}
            <Link
              href="/register"
              className="font-semibold text-forest underline"
            >
              Registrasi
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
