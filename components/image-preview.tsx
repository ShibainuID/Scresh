type ImageSlot = {
  alt: string;
  className: string;
  src: string;
};

const imageSlots: ImageSlot[] = [
  {
    alt: "Cold storage",
    className:
      "left-1/2 top-1/2 h-[69.44%] w-[44.64%] -translate-x-1/2 -translate-y-1/2 rounded-[30.4%]",
    src: "/preview/coldstorage.png",
  },
  {
    alt: "Eggplant",
    className: "left-[24%] top-[7%] h-[27.22%] w-[17.5%] rounded-[28.57%]",
    src: "/preview/eggplant.jpeg",
  },
  {
    alt: "Cucumber",
    className: "right-[22%] -top-[3%] h-[26.11%] w-[16.79%] rounded-[27.66%]",
    src: "/preview/cucumber.jpeg",
  },
  {
    alt: "Tomato",
    className: "bottom-[5%] left-[20%] h-[27.78%] w-[17.86%] rounded-[26%]",
    src: "/preview/tomato.jpeg",
  },
  {
    alt: "Lettuce",
    className: "bottom-[8%] right-[25%] h-[26.67%] w-[17.14%] rounded-[27.08%]",
    src: "/preview/lettuce.png",
  },
];

export function ImagePreview() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-[1] aspect-[560/360] w-[min(92vw,560px)]"
    >
      {imageSlots.map((image) => (
        <div
          key={image.alt}
          aria-label={image.alt}
          className={`absolute overflow-hidden bg-white/45 shadow-[0_14px_36px_rgba(1,52,37,0.12)] ${image.className}`}
          role="img"
          style={{
            backgroundImage: image.src ? `url(${image.src})` : undefined,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
      ))}
    </div>
  );
}
