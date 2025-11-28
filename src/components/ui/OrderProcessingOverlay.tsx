import { motion } from "framer-motion";

export default function OrderProcessingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 w-[90%] max-w-sm"
      >
        {/* Loader */}
        <motion.div
          className="w-12 h-12 border-4 rounded-full border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />

        <h2 className="text-lg font-semibold text-gray-900">
          Finalizing your order…
        </h2>

        <p className="text-sm text-gray-600 text-center">
          Please wait while we confirm your payment.
        </p>
      </motion.div>
    </div>
  );
}
