import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useOrderStore } from "../store/orderStore";
import { Activity, Database, Zap, WifiOff, Wifi, Play } from "lucide-react";

export function DebugOverlay() {
  const [isOpen, setIsOpen] = useState(true);
  const [domCount, setDomCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<any>(null); // window.performance.memory is non-standard
  const [ipcStats, setIpcStats] = useState<string | null>(null);
  const [isMonkeyTesting, setIsMonkeyTesting] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  const ordersCount = useOrderStore((state) => state.orders.length);

  // Poll for DOM/Memory stats
  useEffect(() => {
    const interval = setInterval(() => {
      setDomCount(document.getElementsByTagName("*").length);

      // @ts-ignore
      if (window.performance && window.performance.memory) {
        // @ts-ignore
        setMemory(window.performance.memory);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Frame rate monitor
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    const loop = () => {
      const now = performance.now();
      frames++;
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    const anim = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleSeed = async () => {
    alert("Seeding is disabled for Supabase");
  };

  const handleIPCBenchmark = async () => {
    setIpcStats("Running...");
    const start = performance.now();
    for (let i = 0; i < 500; i++) {
      await invoke("ping");
    }
    const end = performance.now();
    const avg = (end - start) / 500;
    setIpcStats(`${avg.toFixed(2)}ms avg`);
  };

  const monkeyIntervalRef = useRef<number | null>(null);

  const toggleMonkeyTest = () => {
    if (isMonkeyTesting) {
      setIsMonkeyTesting(false);
      if (monkeyIntervalRef.current) clearInterval(monkeyIntervalRef.current);
    } else {
      setIsMonkeyTesting(true);
      monkeyIntervalRef.current = window.setInterval(() => {
        // Simulate "chaos"
        const buttons = document.getElementsByTagName("button");
        if (buttons.length > 0) {
          const randomBtn = buttons[Math.floor(Math.random() * buttons.length)];
          // Avoid clicking ourselves to stop the test
          if (!randomBtn.closest("#debug-overlay")) {
            randomBtn.click();
          }
        }

        // Simulate Input
        const inputs = document.getElementsByTagName("input");
        if (inputs.length > 0) {
          const randomInput = inputs[
            Math.floor(Math.random() * inputs.length)
          ] as HTMLInputElement;
          randomInput.value = Math.random().toString(36).substring(7);
          randomInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, 50); // Very fast 20ms? 50ms is safer for "high speed" without complete lockup
    }
  };

  const [supabaseStatus, setSupabaseStatus] = useState<string>("Not tested");

  const testSupabaseConnection = async () => {
    setSupabaseStatus("Testing...");
    try {
      const { supabase } = await import("../lib/supabase");

      // Test 1: Simple query
      const { data, error } = await supabase
        .from("products")
        .select("count")
        .limit(1);

      if (error) {
        setSupabaseStatus(`❌ Error: ${error.message}`);
        console.error("Supabase test failed:", error);
      } else {
        setSupabaseStatus(`✅ Connected!`);
        console.log("Supabase test successful:", data);
      }
    } catch (err: any) {
      setSupabaseStatus(`❌ Failed: ${err.message}`);
      console.error("Supabase test error:", err);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black/80 text-white p-2 rounded-full shadow-lg border border-white/20"
        >
          <Activity size={20} />
        </button>
      </div>
    );
  }

  return (
    <div
      id="debug-overlay"
      className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-green-400 p-4 rounded-lg shadow-2xl border border-green-500/30 w-80 font-mono text-xs backdrop-blur-md"
    >
      <div className="flex justify-between items-center mb-4 border-b border-green-500/30 pb-2">
        <h3 className="font-bold flex items-center gap-2 text-white">
          <Activity size={14} /> QA Sandbox
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-white"
        >
          x
        </button>
      </div>

      <div className="space-y-4">
        {/* Telemetry */}
        <div className="grid grid-cols-2 gap-2 text-gray-300">
          <div>
            <div className="text-gray-500 text-[10px] uppercase">DOM Nodes</div>
            <div className="font-bold text-lg text-white">{domCount}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase">FPS</div>
            <div className="font-bold text-lg text-white">{fps}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase">
              Orders Count
            </div>
            <div className="font-bold text-lg text-white">{ordersCount}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase">
              Memory Limit
            </div>
            <div className="font-bold text-lg text-white">
              {memory
                ? `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)}MB`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleSeed}
            className="w-full flex items-center justify-between px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 rounded text-blue-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database size={14} /> Seed 10k Orders
            </div>
          </button>

          <button
            onClick={toggleMonkeyTest}
            className={`w-full flex items-center justify-between px-3 py-2 border rounded transition-colors ${isMonkeyTesting ? "bg-red-900/30 border-red-500 animate-pulse text-red-200" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}`}
          >
            <div className="flex items-center gap-2">
              <Zap size={14} />{" "}
              {isMonkeyTesting ? "Stop Monkey" : "Start Monkey Test"}
            </div>
          </button>

          <button
            onClick={handleIPCBenchmark}
            className="w-full flex items-center justify-between px-3 py-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded text-purple-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Play size={14} /> IPC Benchmark
            </div>
            <span>{ipcStats || ""}</span>
          </button>

          <button
            onClick={testSupabaseConnection}
            className="w-full flex items-center justify-between px-3 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 rounded text-green-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database size={14} /> Supabase Test
            </div>
            <span>{supabaseStatus}</span>
          </button>

          <button
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`w-full flex items-center justify-between px-3 py-2 border rounded transition-colors ${isSimulatedOffline ? "bg-orange-900/30 border-orange-500 text-orange-200" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}`}
          >
            <div className="flex items-center gap-2">
              {isSimulatedOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
              Slow 3G / Offline
            </div>
            <span>{isSimulatedOffline ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
