import { SvgIcon } from "./SvgIcon";

export interface TripStep {
  title: string;
  detail: string;
  time?: string;
  state: "done" | "current" | "upcoming";
}

export function TripTimeline({ steps }: { steps: TripStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const active = step.state !== "upcoming";
        return (
          <li key={step.title} className="flex gap-3">
            <div className="flex w-6 flex-col items-center">
              <span
                className={`mt-1 h-3.5 w-3.5 rounded-full border-2 ${
                  active ? "border-[#1C8C42] bg-[#1C8C42]" : "border-[#C5D5CB] bg-white"
                }`}
              />
              {!last && <span className={`w-0.5 flex-1 ${active ? "bg-[#1C8C42]" : "bg-[#D7E4DC]"}`} />}
            </div>
            <div className={`min-w-0 flex-1 ${last ? "pb-1" : "pb-5"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-bold ${active ? "text-[#163024]" : "text-[#8AA094]"}`}>{step.title}</p>
                  <p className="text-xs text-[#6D7B74]">{step.detail}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-[#1C8C42]">
                  {step.time && <span>{step.time}</span>}
                  {step.state === "done" && <SvgIcon name="check" className="h-3.5 w-3.5" />}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
