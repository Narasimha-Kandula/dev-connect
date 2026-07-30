'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Heart, X } from 'lucide-react';
import Link from 'next/link';

interface MatchModalProps {
  open: boolean;
  partnerName: string;
  partnerId: string;
  matchScore?: number;
  onClose: () => void;
}

export function MatchModal({ open, partnerName, partnerId, matchScore, onClose }: MatchModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
    }
  }, [open]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-8 text-center shadow-2xl"
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>

            <motion.div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              <Heart size={40} className="text-danger" fill="currentColor" />
            </motion.div>

            <motion.h2
              className="text-3xl font-extrabold tracking-tight text-primary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              It&apos;s a Match!
            </motion.h2>

            <motion.p
              className="mt-2 text-muted-foreground"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              You and <span className="font-semibold text-foreground">{partnerName}</span> liked each other.
            </motion.p>

            {matchScore !== undefined && (
              <motion.p
                className="mt-1 text-sm text-success"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                {Math.round(matchScore * 100)}% skill match
              </motion.p>
            )}

            <motion.div
              className="mt-6 flex flex-col gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href={`/chat`} onClick={handleClose}>
                <Button className="w-full gap-2">
                  <MessageCircle size={16} /> Send a Message
                </Button>
              </Link>
              <Link href={`/profile/${partnerId}`} onClick={handleClose}>
                <Button variant="secondary" className="w-full">
                  View Profile
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
