export function RideScene({ vehicle = "bus" }: { vehicle?: "bus" | "van" }) {
  return (
    <div className="relative mx-auto h-40 w-full max-w-sm overflow-hidden" aria-hidden>
      <img src="/icons/skyline.svg" alt="" className="absolute inset-x-4 bottom-10 h-16 w-[calc(100%-2rem)] object-contain object-bottom opacity-90" />
      <img
        src={vehicle === "van" ? "/icons/ev-van.svg" : "/icons/ev-bus.svg"}
        alt=""
        className="absolute bottom-6 left-1/2 h-24 w-52 -translate-x-1/2 object-contain"
      />
      <img src="/icons/hills.svg" alt="" className="absolute bottom-0 left-0 h-16 w-full object-cover" />
    </div>
  );
}
