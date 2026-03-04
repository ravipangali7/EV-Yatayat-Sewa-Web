import { Link } from 'react-router-dom';
import type { SiteSetting } from '@/modules/website/types';

export function PublicFooter({ siteSetting }: { siteSetting: SiteSetting | null }) {
  const footerText = siteSetting?.footer_text || '';
  const name = siteSetting?.name || 'EV Yatayat Sewa';

  return (
    <footer className="border-t border-border py-8 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center text-muted-foreground text-sm">
          {footerText ? (
            <p className="max-w-2xl mx-auto">{footerText}</p>
          ) : null}
          <p className="mt-4">&copy; {new Date().getFullYear()} {name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
