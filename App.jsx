import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function App() {
  // --- Game Constants ---
  const PRICE_PER_M2 = 20;
  const SEED_COST_PER_M2 = 6;
  const MAINT_PER_M2 = 1;
  const YIELD_PER_M2_KG = 0.42;
  const PRICE_PER_KG = 23;
  const CYCLE_SECONDS = 20;

  // --- State ---
  const [balance, setBalance] = useState(20000);
  const [plots, setPlots] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      size: null,
      status: "available", // available | owned | planted | growing | ready
      plantedAt: null,
      progress: 0,
    }))
  );
  const [selectedSize, setSelectedSize] = useState(100);

  // --- Helpers ---
  function priceForSize(size) {
    return size * PRICE_PER_M2;
  }
  function cycleCostForSize(size) {
    return size * (SEED_COST_PER_M2 + MAINT_PER_M2);
  }
  function harvestIncomeForSize(size) {
    return size * YIELD_PER_M2_KG * PRICE_PER_KG;
  }
  function netProfitForSize(size) {
    return harvestIncomeForSize(size) - cycleCostForSize(size);
  }

  // --- Actions ---
  function buyPlot(plotId) {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plotId || p.status !== "available") return p;
        const cost = priceForSize(selectedSize);
        if (balance < cost) return p;
        setBalance((b) => b - cost);
        return { ...p, size: selectedSize, status: "owned" };
      })
    );
  }

  function plantPlot(plotId) {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plotId || p.status !== "owned") return p;
        const cost = cycleCostForSize(p.size);
        if (balance < cost) return p;
        setBalance((b) => b - cost);
        return { ...p, status: "planted", plantedAt: Date.now(), progress: 0 };
      })
    );
  }

  function harvestPlot(plotId) {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plotId || p.status !== "ready") return p;
        const income = harvestIncomeForSize(p.size);
        setBalance((b) => b + income);
        return { ...p, status: "owned", plantedAt: null, progress: 0 };
      })
    );
  }

  // --- Growth Timer ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPlots((prev) =>
        prev.map((p) => {
          if (p.status === "planted" || p.status === "growing") {
            const elapsed = (now - p.plantedAt) / 1000;
            const progress = Math.min((elapsed / CYCLE_SECONDS) * 100, 100);
            if (progress >= 100) {
              return { ...p, status: "ready", progress: 100 };
            }
            return { ...p, status: "growing", progress };
          }
          return p;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Dashboard Stats ---
  const ownedPlots = plots.filter((p) => p.status !== "available").length;
  const farmedArea = plots.reduce((sum, p) => sum + (p.size || 0), 0);

  // --- Images for each stage ---
  function getImageForStatus(status) {
    switch (status) {
      case "available":
        return "https://via.placeholder.com/100x80/ccc/000?text=Land";
      case "owned":
        return "https://via.placeholder.com/100x80/eee/000?text=Empty";
      case "planted":
        return "https://via.placeholder.com/100x80/77dd77/000?text=Seed";
      case "growing":
        return "https://via.placeholder.com/100x80/fdfd96/000?text=Growing";
      case "ready":
        return "https://via.placeholder.com/100x80/ffb347/000?text=Harvest";
      default:
        return "";
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🌾 Rice Farm Game</h1>

      {/* Dashboard */}
      <motion.div
        className="mb-6 p-4 bg-white rounded shadow grid grid-cols-3 gap-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="font-semibold">Balance</h2>
          <p className="text-lg font-mono">₱{Math.round(balance)}</p>
        </div>
        <div>
          <h2 className="font-semibold">Owned Plots</h2>
          <p className="text-lg">{ownedPlots}</p>
        </div>
        <div>
          <h2 className="font-semibold">Farmed Area</h2>
          <p className="text-lg">{farmedArea} m²</p>
        </div>
      </motion.div>

      {/* Plot size selector */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Plot Size:</label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(Number(e.target.value))}
          className="p-2 border rounded"
        >
          <option value={100}>100 m²</option>
          <option value={500}>500 m²</option>
          <option value={1000}>1000 m²</option>
        </select>
        <span className="ml-4 text-sm text-gray-600">
          Price: ₱{priceForSize(selectedSize)} | Net Profit per cycle: ₱
          {Math.round(netProfitForSize(selectedSize))}
        </span>
      </div>

      {/* Land Grid */}
      <div className="grid grid-cols-4 gap-4">
        {plots.map((p) => (
          <motion.div
            key={p.id}
            className="p-3 rounded shadow text-center bg-white"
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="font-bold">Plot #{p.id}</h3>
            <p>{p.size ? `${p.size} m²` : "—"}</p>
            <p className="capitalize">{p.status}</p>

            {/* Image */}
            <motion.img
              src={getImageForStatus(p.status)}
              alt={p.status}
              className="mx-auto mt-2 rounded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />

            {/* Progress bar */}
            {p.status === "growing" && (
              <div className="mt-2 w-full bg-gray-300 h-2 rounded">
                <motion.div
                  className="bg-green-600 h-2 rounded"
                  style={{ width: `${p.progress}%` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${p.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}

            <div className="mt-2 space-x-1">
              {p.status === "available" && (
                <motion.button
                  onClick={() => buyPlot(p.id)}
                  whileTap={{ scale: 0.9 }}
                  className="px-2 py-1 text-sm border rounded bg-green-200"
                >
                  Buy
                </motion.button>
              )}
              {p.status === "owned" && (
                <motion.button
                  onClick={() => plantPlot(p.id)}
                  whileTap={{ scale: 0.9 }}
                  className="px-2 py-1 text-sm border rounded bg-blue-200"
                >
                  Plant
                </motion.button>
              )}
              {p.status === "ready" && (
                <motion.button
                  onClick={() => harvestPlot(p.id)}
                  whileTap={{ scale: 0.9 }}
                  className="px-2 py-1 text-sm border rounded bg-yellow-300"
                >
                  Harvest
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Notes */}
      <div className="mt-6 text-gray-600 text-sm">
        <p>
          ⏳ Crops take {CYCLE_SECONDS}s to grow (demo speed). Replace placeholder
          images with real rice crop photos for realism.
        </p>
      </div>
    </div>
  );
}
