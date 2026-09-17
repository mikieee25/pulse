import Image from "next/image";

export function BrandLockup({
  variant = "full",
  priority = false,
}: {
  variant?: "full" | "compact";
  priority?: boolean;
}) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2.5">
        <Image
          src="/DOE LOGO OFFICIAL PNG.png"
          alt="Department of Energy Philippines"
          width={30}
          height={30}
          priority={priority}
          className="size-[30px] rounded-full"
        />
        <span className="h-7 w-px bg-line" aria-hidden="true" />
        <Image
          src="/pulseicon.svg"
          alt=""
          width={30}
          height={30}
          priority={priority}
          className="size-[30px] rounded-lg"
        />
        <span className="font-sans text-base font-medium tracking-wide text-paper">
          PULSE
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-[760px] items-center justify-center gap-3 sm:gap-4">
      <Image
        src="/DOE LOGO OFFICIAL PNG.png"
        alt="Department of Energy Philippines"
        width={72}
        height={72}
        priority={priority}
        className="size-14 shrink-0 rounded-full sm:size-[72px]"
      />
      <span className="h-14 w-px shrink-0 bg-line sm:h-16" aria-hidden="true" />
      <span
        className="relative min-w-0 flex-1"
        aria-label="PULSE — Personnel & Unit Lifecycle System for Equipment"
      >
        <Image
          src="/pulselogo.svg"
          alt=""
          width={400}
          height={104}
          priority={priority}
          className="block h-auto w-full"
        />
        <Image
          src="/pulselogo-dark-text.svg"
          alt=""
          width={400}
          height={104}
          priority={priority}
          className="pointer-events-none absolute inset-0 hidden h-auto w-full dark:block"
          aria-hidden="true"
        />
      </span>
      <span
        className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-transparent p-1 sm:h-24 sm:w-32"
        aria-label="Bagong Pilipinas"
      >
        <Image
          src="/Bagong Pilipinas.png"
          alt="Bagong Pilipinas"
          width={512}
          height={512}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </span>
    </div>
  );
}
