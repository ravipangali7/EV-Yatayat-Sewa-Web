import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  downloadable?: boolean;
}

export function QRCodeDisplay({ value, size = 256, downloadable = true }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `vehicle-${value}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={qrRef} className="p-4 bg-white rounded-lg">
        <QRCodeSVG value={value} size={size} />
      </div>
      {downloadable && (
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      )}
    </div>
  );
}
