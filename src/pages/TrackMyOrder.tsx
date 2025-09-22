// src/pages/TrackMyOrder.tsx
import { useState } from "react";
import axios from "axios";
import { CheckCircle, Circle, Truck, Package, MapPin } from "lucide-react";

interface ScanDetail {
  date?: string;
  status?: string;
  location?: string;
}

interface TrackingInfo {
  orderId: string;
  referenceId: string;
  awbNumber: string;
  courier: string;
  expectedDelivery?: string | null;
  status: string;
  statusTime?: string | null;
  scanDetail: ScanDetail[];
}

const STAGES = [
  { key: "ORDERED", label: "Order Placed", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "IN_TRANSIT", label: "In Transit", icon: Circle },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

function mapStatusToStage(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("pickup") || normalized.includes("pending"))
    return "ORDERED";
  if (normalized.includes("shipped")) return "SHIPPED";
  if (normalized.includes("in transit")) return "IN_TRANSIT";
  if (normalized.includes("out for delivery")) return "OUT_FOR_DELIVERY";
  if (normalized.includes("delivered")) return "DELIVERED";
  return "ORDERED";
}

export default function TrackMyOrder() {
  const [awbNumber, setAwbNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!awbNumber) return;
    setLoading(true);
    setError("");
    setTracking(null);

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/track-order/${awbNumber}`);
      if (res.data.success) {
        setTracking(res.data.tracking);
      } else {
        setError(res.data.message || "Order not found");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Order not found / not shipped");
    } finally {
      setLoading(false);
    }
  };

  const activeStage = tracking ? mapStatusToStage(tracking.status) : "ORDERED";
  const activeIndex = STAGES.findIndex((s) => s.key === activeStage);

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-brand-primary">
        Track My Order
      </h1>

      {/* Input + Button */}
      <div className="space-y-4">
        <input
          type="text"
          value={awbNumber}
          onChange={(e) => setAwbNumber(e.target.value)}
          placeholder="Enter your AWB Number"
          className="w-full p-3 border rounded-xl focus:outline-brand-primary"
        />
        <button
          onClick={handleTrack}
          disabled={loading || !awbNumber}
          className="w-full bg-[#d4a441] text-white py-3 rounded-xl border border-gray-300 hover:bg-[#a94d2c]             hover:text-white disabled:opacity-100 transition-all duration-200 ease-in-out transform hover:scale-                    105 cursor-pointer"

        >
          {loading ? "Checking..." : "Track Order"}
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-red-600 mt-4 font-medium">{error}</p>}

      {/* Tracking Details */}
      {tracking && (
        <div className="mt-6 p-4 border rounded-xl bg-gray-50">
          <h2 className="font-semibold text-lg mb-2">Tracking Details</h2>
          <p>Status: {tracking.status}</p>
          <p>Courier: {tracking.courier}</p>
          <p>AWB: {tracking.awbNumber}</p>
          {tracking.expectedDelivery && (
            <p>Expected Delivery: {tracking.expectedDelivery}</p>
          )}

{/* Timeline */}
<div className="mt-6 font-inter">
  <h3 className="font-medium mb-4 text-gray-700">Order Progress</h3>

  <div className="flex justify-between items-center relative">
    {STAGES.map((stage, index) => {
      const Icon = stage.icon;
      const isCompleted = index < activeIndex;
      const isCurrent = index === activeIndex;
      const isDelivered = stage.key === "DELIVERED";

      // Determine icon background
      let bgColor = "bg-white";
      let borderColor = "border-gray-300";
      let textColor = "text-gray-400";

      if (isCompleted) {
        bgColor = "bg-[#d4a441]";
        borderColor = "border-[#d4a441]";
        textColor = "text-white";
      }
      if (isCurrent) {
        bgColor = "bg-[#d4a441]";
        borderColor = "border-[#d4a441]";
        textColor = "text-white";
      }
      if (isDelivered && isCompleted) {
        bgColor = "bg-[#22c55e]";
        borderColor = "border-[#22c55e]";
        textColor = "text-white";
      }

      return (
        <div key={stage.key} className="flex flex-col items-center relative flex-1">
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 ${bgColor} ${borderColor} ${textColor}`}
          >
            <Icon size={20} />
          </div>

          {/* Label */}
          <p
            className={`mt-2 text-sm text-center font-medium ${
              isCurrent ? "text-[#d4a441]" : isDelivered && isCompleted ? "text-[#22c55e]" : "text-gray-500"
            }`}
          >
            {stage.label}
          </p>

          {/* Connecting Line */}
          {index < STAGES.length - 1 && (
            <div
              className={`absolute top-5 left-1/2 h-1 w-full z-0 ${
                index < activeIndex ? "bg-brand-primary" : "bg-gray-300"
              }`}
              style={{ transform: "translateX(50%)", height: "2px" }}
            ></div>
          )}
        </div>
      );
    })}
  </div>
</div>

          {/* History (scan details if available) */}
          {tracking.scanDetail.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">History</h3>
              <ol className="border-l ml-4">
                {tracking.scanDetail.map((scan, idx) => (
                  <li key={idx} className="mb-4 pl-4">
                    <div className="text-sm text-gray-600">{scan.date}</div>
                    <div className="font-medium">{scan.status}</div>
                    {scan.location && (
                      <div className="text-sm text-gray-500">{scan.location}</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
