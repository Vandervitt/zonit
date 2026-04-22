import { useRef, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import type { LandingPageTemplate } from "@/types/schema";
import { hasWatermark } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

type Device = "mobile" | "tablet" | "desktop";

interface Props {
  data: LandingPageTemplate;
  expandedKey: string;
}

const DEVICE_CONFIG: Record<Device, { width: number | "100%"; label: string }> = {
  mobile: { width: 375, label: "Mobile" },
  tablet: { width: 768, label: "Tablet" },
  desktop: { width: "100%", label: "Desktop" },
};

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex flex-col items-center">
      {/* iPhone outer shell */}
      <div
        className="relative flex flex-col"
        style={{
          width: 393,
          height: 700,
          background: "#1a1a1a",
          borderRadius: 44,
          padding: "10px 8px",
          boxShadow:
            "inset 0 0 0 1px #3a3a3a, 0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Side buttons */}
        <div
          className="absolute"
          style={{
            left: -3, top: 100, width: 3, height: 32,
            background: "#2a2a2a", borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute"
          style={{
            left: -3, top: 142, width: 3, height: 52,
            background: "#2a2a2a", borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute"
          style={{
            left: -3, top: 204, width: 3, height: 52,
            background: "#2a2a2a", borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute"
          style={{
            right: -3, top: 158, width: 3, height: 68,
            background: "#2a2a2a", borderRadius: "0 2px 2px 0",
          }}
        />

        {/* Screen */}
        <div
          className="flex-1 overflow-hidden relative"
          style={{ borderRadius: 36, background: "#000" }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute z-20"
            style={{
              top: 10, left: "50%", transform: "translateX(-50%)",
              width: 120, height: 34,
              background: "#000",
              borderRadius: 20,
            }}
          />
          {/* Content area */}
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 36 }}>
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div
          className="mt-2 mx-auto"
          style={{ width: 120, height: 4, background: "#555", borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

export function PreviewPane({ data, expandedKey }: Props) {
  const { data: session } = useSession();
  const [device, setDevice] = useState<Device>("mobile");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const plan = (session?.user?.plan ?? "free") as PlanId;
  const showWatermark = hasWatermark(plan);

  const previewUrl = `${window.location.origin}/preview`;

  const sendToIframe = (msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  };

  const handleLoad = () => {
    setIframeLoaded(true);
    sendToIframe({ type: "PREVIEW_UPDATE", data, showWatermark });
    sendToIframe({ type: "HIGHLIGHT_BLOCK", key: expandedKey });
  };

  // Re-send when data changes (after iframe is loaded)
  useEffect(() => {
    if (iframeLoaded) sendToIframe({ type: "PREVIEW_UPDATE", data, showWatermark });
  }, [data, iframeLoaded, showWatermark]);

  // Notify iframe when expanded block changes
  useEffect(() => {
    if (iframeLoaded) sendToIframe({ type: "HIGHLIGHT_BLOCK", key: expandedKey });
  }, [expandedKey, iframeLoaded]);

  const iframeStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  };

  const renderIframe = () => (
    <iframe
      ref={iframeRef}
      src={previewUrl}
      style={iframeStyle}
      title="Landing page preview"
      onLoad={handleLoad}
    />
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Device toggle */}
      <div className="flex items-center justify-center py-4 border-b border-border bg-white shrink-0">
        <Tabs value={device} onValueChange={v => setDevice(v as Device)}>
          <TabsList className="h-9">
            <TabsTrigger value="mobile" className="gap-1.5 px-3 text-xs h-8">
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </TabsTrigger>
            <TabsTrigger value="tablet" className="gap-1.5 px-3 text-xs h-8">
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </TabsTrigger>
            <TabsTrigger value="desktop" className="gap-1.5 px-3 text-xs h-8">
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-6 px-4">
        {device === "mobile" && (
          <IPhoneFrame>
            {renderIframe()}
          </IPhoneFrame>
        )}

        {device === "tablet" && (
          <div
            style={{
              width: 768,
              height: 600,
              border: "8px solid #1a1a1a",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {renderIframe()}
          </div>
        )}

        {device === "desktop" && (
          <div
            className="w-full max-w-4xl rounded-xl overflow-hidden shadow-xl border border-border"
            style={{ height: 600 }}
          >
            {/* Browser chrome */}
            <div className="h-8 bg-slate-800 flex items-center px-3 gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="flex-1 mx-3 bg-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-400 truncate">
                {previewUrl}
              </div>
            </div>
            <div style={{ height: "calc(100% - 32px)" }}>
              {renderIframe()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
