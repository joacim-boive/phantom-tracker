"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface QuickAddFABProps {
  onQuickAdd: () => Promise<boolean>;
  disabled?: boolean;
  className?: string;
}

export function QuickAddFAB({
  onQuickAdd,
  disabled = false,
  className,
}: QuickAddFABProps) {
  const t = useTranslations("entry");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = useCallback(async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    // Trigger haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      const success = await onQuickAdd();
      
      if (success) {
        setShowSuccess(true);
        
        // Success haptic
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onQuickAdd, isLoading, disabled]);

  return (
    <motion.div
      className={cn("fixed bottom-6 right-6 z-50", className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {!isLoading && !showSuccess && !disabled && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
          >
            <span className="bg-card text-card-foreground text-sm px-3 py-1.5 rounded-lg shadow-lg border">
              {t("quickAdd")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        size="lg"
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90",
          showSuccess && "bg-emerald-500 hover:bg-emerald-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <Loader2 className="w-6 h-6 animate-spin" />
            </motion.div>
          ) : showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Ripple effect on press */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
