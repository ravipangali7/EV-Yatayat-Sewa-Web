import { ReactNode } from "react";
import { useI18n } from "@/i18n/I18nProvider";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { lang } = useI18n();
  return (
    <div className={`ev-app min-h-dvh ${lang === "ne" ? "lang-ne" : ""}`} lang={lang}>
      <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-[var(--ev-bg)] shadow-[0_0_40px_rgba(16,60,40,0.06)]">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
