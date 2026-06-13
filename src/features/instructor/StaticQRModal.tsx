import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Copy, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface StaticQRModalProps {
  token: string | null;
  onClose: () => void;
}

export function StaticQRModal({ token, onClose }: StaticQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!token) return null;

  const url = `${window.location.origin}/attend/${token}`;

  const handleDownload = () => {
    if (!qrRef.current) return;
    const qrCanvas = qrRef.current.querySelector('canvas');
    if (!qrCanvas) {
      toast.error("Could not find QR Code image.");
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale up for crisp rendering
    const scale = 3;
    canvas.width = 280 * scale;
    canvas.height = 360 * scale;
    
    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${22 * scale}px sans-serif`;
    ctx.fillText(displayTitle, canvas.width / 2, 50 * scale);
    
    // Draw Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = `normal ${14 * scale}px sans-serif`;
    ctx.fillText(displaySubtitle, canvas.width / 2, 80 * scale);
    
    // Draw QR Code
    ctx.drawImage(qrCanvas, 40 * scale, 120 * scale, 200 * scale, 200 * scale);

    const pngUrl = canvas.toDataURL("image/png");
      
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `Attendance_QR_${token}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast.success("QR Code image downloaded successfully!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  let displayTitle = "Static QR Code";
  let displaySubtitle = "Scan this QR code to sign in";

  if (token && token.startsWith("STAT-")) {
    const lastDashIdx = token.lastIndexOf('-');
    if (lastDashIdx > 5) {
      const datePart = token.substring(lastDashIdx + 1);
      const middlePart = token.substring(5, lastDashIdx);
      const periodPart = middlePart.split('_').pop();

      if (datePart.length === 8) {
        const formattedDate = `${datePart.substring(0,4)}-${datePart.substring(4,6)}-${datePart.substring(6,8)}`;
        displayTitle = `Class ${formattedDate} (${periodPart})`;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div ref={qrRef} className="bg-white p-6 flex flex-col items-center rounded-2xl">
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center" style={{ color: '#1e293b' }}>{displayTitle}</h2>
          <p className="text-sm text-slate-500 text-center mb-6" style={{ color: '#64748b' }}>
            {displaySubtitle}
          </p>

          <div 
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-2"
          >
            <QRCodeCanvas
              value={url}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"H"}
              includeMargin={false}
            />
          </div>
        </div>

        <div className="flex flex-col w-full gap-3 mt-4">
          <Button 
            onClick={handleDownload}
            className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download QR Image
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleCopyLink}
            className="w-full font-bold text-slate-700 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy URL Link"}
          </Button>
        </div>
      </div>
    </div>
  );
}
