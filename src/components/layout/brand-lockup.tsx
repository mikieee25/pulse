import Image from "next/image"

export function BrandLockup({ variant = "full", priority = false }: { variant?: "full" | "compact"; priority?: boolean }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2.5">
        <Image src="/DOE LOGO OFFICIAL PNG.png" alt="Department of Energy Philippines" width={30} height={30} priority={priority} className="size-[30px] rounded-full" />
        <span className="h-7 w-px bg-line" aria-hidden="true" />
        <Image src="/pulseicon.svg" alt="" width={30} height={30} priority={priority} className="size-[30px] rounded-lg" />
        <span className="font-serif text-base font-medium tracking-wide text-paper">PULSE</span>
      </div>
    )
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-[500px] items-center justify-center gap-4">
      <Image src="/DOE LOGO OFFICIAL PNG.png" alt="Department of Energy Philippines" width={72} height={72} priority={priority} className="size-14 shrink-0 rounded-full sm:size-[72px]" />
      <span className="h-14 w-px shrink-0 bg-line sm:h-16" aria-hidden="true" />
      <Image src="/pulselogo.svg" alt="PULSE — Personnel & Unit Lifecycle System for Equipment" width={400} height={104} priority={priority} className="h-auto min-w-0 flex-1" />
    </div>
  )
}
