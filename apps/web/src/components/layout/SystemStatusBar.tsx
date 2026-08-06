"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, WifiOff, RefreshCcw } from "lucide-react";

export function SystemStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <div className="min-h-8 bg-navy-950 border-t border-navy-800 flex items-center px-3 sm:px-4 justify-between text-[10px] sm:text-xs text-slate-300 z-50">
      <div className="flex items-center space-x-4">
        <span className="flex items-center">
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              System Online
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-500 mr-1.5" />
              <span className="text-red-400">Offline Mode</span>
            </>
          )}
        </span>
        
        {isSyncing && (
          <span className="flex items-center text-gold-400">
            <RefreshCcw className="w-3 h-3 mr-1.5 animate-spin" />
            Syncing data...
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-4 opacity-75">
        <span>IMSSA Media v2.0.0</span>
        {isOnline && <span className="hidden items-center sm:flex"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1" /> All services operational</span>}
      </div>
    </div>
  );
}
