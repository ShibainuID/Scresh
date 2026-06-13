import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/button";

export default function RegisterPage() {
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
      <section className="fixed left-0 right-0 top-0 z-0 flex h-[30vh] flex-col justify-end px-8 pb-10 pt-10 md:sticky md:left-auto md:right-auto md:min-h-screen md:px-12 md:py-12">
        <div className="space-y-2">
          <h1 className="text-white">Registrasi</h1>
          <p className="text-white/72">Daftarkan koperasi Anda.</p>
        </div>
      </section>

      <section className="relative z-10 mt-[30vh] min-h-[70vh] rounded-t-[40px] bg-white px-8 pt-14 text-forest md:mt-0 md:flex md:min-h-screen md:items-center md:justify-center md:rounded-none md:px-12 md:py-12">
        <div className="mx-auto w-full max-w-md pb-8">
          <AuthForm
            title="Data Koperasi"
            description="Lengkapi profil koperasi dan petugas."
            action={registerAction}
            autofillPresets={[
              {
                cooperativeName: "Koperasi Melati Jaya",
                cooperativeRegistrationNumber: "BH-3273-2026-117",
                cooperativeAddress: "Jl. Melati Raya No. 17",
                cooperativeCity: "Bandung",
                cooperativeProvince: "Jawa Barat",
                cooperativeContactPhone: "081245671117",
                commodityFocus: "Sayur segar, cabai, tomat",
                name: "Arif Wibowo",
                email: "arif.melati.{rand}@koperasi.id",
                password: "Password123",
                role: "staff",
              },
            ]}
            autofillMemoryMode="register"
            autofillShortcuts={{
              p: {
                cooperativeName: "Koperasi Melati Jaya",
                cooperativeRegistrationNumber: "BH-3273-2026-117",
                cooperativeAddress: "Jl. Melati Raya No. 17",
                cooperativeCity: "Bandung",
                cooperativeProvince: "Jawa Barat",
                cooperativeContactPhone: "081245671117",
                commodityFocus: "Sayur segar, cabai, tomat",
                name: "Arif Wibowo",
                email: "arif.melati.{rand}@koperasi.id",
                password: "Password123",
                role: "staff",
              },
              m: {
                cooperativeName: "Koperasi Melati Jaya",
                cooperativeRegistrationNumber: "BH-3273-2026-117",
                cooperativeAddress: "Jl. Melati Raya No. 17",
                cooperativeCity: "Bandung",
                cooperativeProvince: "Jawa Barat",
                cooperativeContactPhone: "081245671117",
                commodityFocus: "Sayur segar, cabai, tomat",
                name: "Nadia Putri",
                email: "nadia.melati.{rand}@koperasi.id",
                password: "Password123",
                role: "manager",
              },
              s: {
                cooperativeName: "Koperasi Melati Jaya",
                cooperativeRegistrationNumber: "BH-3273-2026-117",
                cooperativeAddress: "Jl. Melati Raya No. 17",
                cooperativeCity: "Bandung",
                cooperativeProvince: "Jawa Barat",
                cooperativeContactPhone: "081245671117",
                commodityFocus: "Sayur segar, cabai, tomat",
                name: "Dewi Lestari",
                email: "dewi.supervisor.{rand}@koperasi.id",
                password: "Password123",
                role: "supervisor",
              },
              b: {
                cooperativeName: "Koperasi Melati Jaya",
                cooperativeRegistrationNumber: "BH-3273-2026-117",
                cooperativeAddress: "Jl. Melati Raya No. 17",
                cooperativeCity: "Bandung",
                cooperativeProvince: "Jawa Barat",
                cooperativeContactPhone: "081245671117",
                commodityFocus: "Sayur segar, cabai, tomat",
                name: "Bagas Pranata",
                email: "bagas.partner.{rand}@koperasi.id",
                password: "Password123",
                role: "partner",
              },
            }}
            submitLabel="Sign Up"
            roleSelect
            fields={[
              {
                name: "cooperativeName",
                label: "Nama Legal Koperasi",
                autoComplete: "organization",
                placeholder: "Koperasi Melati Jaya",
                suggestion: "cooperative",
              },
              {
                name: "cooperativeRegistrationNumber",
                label: "Nomor Badan Hukum / NIK",
                placeholder: "13524xxxxxx",
                required: false,
              },
              {
                name: "cooperativeAddress",
                label: "Alamat Koperasi",
                autoComplete: "street-address",
                placeholder: "Jl. Pasar Induk No. 12",
              },
              {
                name: "cooperativeCity",
                label: "Kota / Kabupaten",
                autoComplete: "address-level2",
                placeholder: "Bandung",
              },
              {
                name: "cooperativeProvince",
                label: "Provinsi",
                autoComplete: "address-level1",
                placeholder: "Jawa Barat",
              },
              {
                name: "cooperativeContactPhone",
                label: "Nomor Kontak Koperasi",
                type: "tel",
                autoComplete: "tel",
                placeholder: "08xxxxxxxxxx",
              },
              {
                name: "commodityFocus",
                label: "Komoditas Utama",
                placeholder: "Cabai, tomat, sayur daun",
              },
              {
                name: "name",
                label: "Nama Pengguna",
                autoComplete: "name",
                placeholder: "Nama lengkap pengguna",
              },
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
                autoComplete: "new-password",
                placeholder: "Minimal 8 karakter",
              },
            ]}
          />

          <p className="mt-8 text-center text-sm text-[#646464]">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-semibold text-forest underline">
              Masuk
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
