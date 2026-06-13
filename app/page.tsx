import { Button } from "@/components/button";
import { ImagePreview } from "@/components/image-preview";

export default function Home() {
  return (
    <main className="relative flex min-h-full flex-1 overflow-hidden bg-gradient-2">
      <div className="absolute z-0 -top-44 left-1/2 h-9/10 min-h-205 w-[160vw] -translate-x-1/2 overflow-hidden rounded-b-full bg-white blur-[100px]"></div>
      <section className="relative z-10 gap-y-6 h-full top-24 flex flex-col justify-center items-center w-full">
        <h1 className="text-forest"></h1>
        <ImagePreview />
        <h1 className="text-forest text-center">
          Don&apos;t Guess,
          <br />
          Just Scresh.
        </h1>
        <p className="text-foreground max-sm:text-forest">
          Aplikasi companion koperasi
        </p>
        <Button size="lg" href="/login">
          Daftarkan koperasimu
        </Button>
      </section>
    </main>
  );
}
