import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the home page — mirrors hero, stats, about, services, team, fleet, testimonials, blog, FAQ+Contact layout */
export function HomePageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      {/* Hero */}
      <section className="relative h-[35vh] min-h-[200px] md:h-[90vh] md:min-h-[500px] lg:min-h-[600px] flex items-center overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="container relative z-10 max-w-3xl">
          <Skeleton className="h-14 w-48 mb-6 rounded-lg" />
          <Skeleton className="h-14 w-full max-w-xl mb-4 rounded-lg" />
          <Skeleton className="h-6 w-3/4 mb-8 rounded" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-16 relative z-10 container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* About */}
      <section className="section-padding-lg">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Skeleton className="h-4 w-24 mb-2 rounded" />
            <Skeleton className="h-10 w-12 mb-5 rounded" />
            <Skeleton className="h-10 w-full max-w-md mb-6 rounded-lg" />
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-4/5 mb-8 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl col-span-2" />
            </div>
          </div>
          <Skeleton className="rounded-2xl w-full aspect-square max-h-80" />
        </div>
      </section>

      {/* Services */}
      <section className="section-padding-lg">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Skeleton className="h-4 w-28 mx-auto mb-4 rounded" />
            <Skeleton className="h-2 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-md mx-auto mb-3 rounded-lg" />
            <Skeleton className="h-4 w-64 mx-auto rounded" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding-lg">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Skeleton className="h-4 w-24 mx-auto mb-4 rounded" />
            <Skeleton className="h-2 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-sm mx-auto mb-3 rounded-lg" />
            <Skeleton className="h-4 w-56 mx-auto rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border/50 p-6">
                <Skeleton className="w-28 h-28 rounded-2xl mx-auto mb-4" />
                <Skeleton className="h-4 w-20 mx-auto mb-2 rounded" />
                <Skeleton className="h-3 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="section-padding-lg">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Skeleton className="h-4 w-24 mx-auto mb-4 rounded" />
            <Skeleton className="h-2 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-64 mx-auto mb-3 rounded-lg" />
            <Skeleton className="h-4 w-48 mx-auto rounded" />
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding-lg">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Skeleton className="h-4 w-28 mx-auto mb-4 rounded" />
            <Skeleton className="h-2 w-12 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-72 mx-auto rounded-lg" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section-padding-lg">
        <div className="container">
          <div className="flex justify-between mb-14">
            <div>
              <Skeleton className="h-4 w-16 mb-2 rounded" />
              <Skeleton className="h-2 w-12 mb-4 rounded-full" />
              <Skeleton className="h-10 w-72 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
            <Skeleton className="h-10 w-24 rounded-full hidden md:block" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-44 rounded-t-2xl rounded-b-none" />
                <Skeleton className="h-20 rounded-b-2xl rounded-t-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + Contact */}
      <section className="section-padding-lg">
        <div className="container grid md:grid-cols-2 gap-12">
          <div>
            <Skeleton className="h-4 w-16 mb-2 rounded" />
            <Skeleton className="h-2 w-12 mb-4 rounded-full" />
            <Skeleton className="h-9 w-80 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-48 mb-8 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 rounded-2xl" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2 rounded" />
            <Skeleton className="h-2 w-12 mb-4 rounded-full" />
            <Skeleton className="h-9 w-64 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-40 mb-6 rounded" />
            <div className="space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Skeleton for list pages (Blog, Services): hero + search + card grid */
export function ListPageSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="animate-in fade-in duration-200">
      <section className="relative min-h-[280px] flex items-center justify-center overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="relative z-10 text-center container px-4">
          <Skeleton className="h-4 w-32 mx-auto mb-2 rounded" />
          <Skeleton className="h-12 w-56 mx-auto mb-2 rounded-lg" />
          <Skeleton className="h-5 w-72 mx-auto rounded" />
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container">
          <Skeleton className="h-12 max-w-xl w-full mb-8 rounded-xl" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: cardCount }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-48 rounded-t-2xl rounded-b-none" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Skeleton for detail pages (Blog post, Service): hero + 2-col content + sidebar */
export function DetailPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <section className="relative min-h-[280px] flex items-end py-20 overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="relative z-10 container px-4 w-full">
          <Skeleton className="h-5 w-36 mb-4 rounded" />
          <Skeleton className="h-12 w-96 max-w-full rounded-lg" />
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
            <aside>
              <Skeleton className="h-6 w-28 mb-4 rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Skeleton for About / Contact: hero + 2-col content */
export function TwoColumnPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <section className="relative min-h-[280px] flex items-center justify-center overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="relative z-10 text-center container px-4">
          <Skeleton className="h-12 w-48 mx-auto mb-2 rounded-lg" />
          <Skeleton className="h-5 w-64 mx-auto rounded" />
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-12 rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
