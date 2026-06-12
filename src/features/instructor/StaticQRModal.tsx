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
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) {
      toast.error("Could not find QR Code image.");
      return;
    }
    
    // Create a temporary link to download the canvas as an image
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
      
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-2">Static QR Code</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Download this QR code and paste it into your PowerPoint presentation.
        </p>

        <div 
          ref={qrRef} 
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6"
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

        <div className="flex flex-col w-full gap-3">
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
