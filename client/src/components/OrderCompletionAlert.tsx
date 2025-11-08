import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import alarmSound from "@assets/danger-alarm-sound-effect-meme_1762562209864.mp3";

export function OrderCompletionAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const lastCheckedOrdersRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!orders) return;

    const completedOrderIds = orders
      .filter(order => order.status === "completed")
      .map(order => order.id);

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      lastCheckedOrdersRef.current = new Set(completedOrderIds);
      return;
    }

    const newCompletedOrders = completedOrderIds.filter(
      id => !lastCheckedOrdersRef.current.has(id)
    );

    if (newCompletedOrders.length > 0) {
      setShowAlert(true);
      startAlarmAndVoice();
    }

    lastCheckedOrdersRef.current = new Set(completedOrderIds);
  }, [orders]);

  const startAlarmAndVoice = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.loop = true;
      alarmAudioRef.current.play().catch(console.error);
    }

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance("Please check the box. Please check the box.");
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    };

    speak();
    speechIntervalRef.current = setInterval(speak, 5000);
  };

  const stopAlarmAndVoice = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }

    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }

    speechSynthesis.cancel();
  };

  const handleOkClick = () => {
    stopAlarmAndVoice();
    setShowAlert(false);
  };

  useEffect(() => {
    return () => {
      stopAlarmAndVoice();
    };
  }, []);

  return (
    <>
      <audio ref={alarmAudioRef} src={alarmSound} preload="auto" />
      <Dialog open={showAlert} onOpenChange={(open) => {
        if (!open) {
          handleOkClick();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <AlertCircle className="w-24 h-24 text-destructive mb-6 animate-pulse" />
            <h2 className="text-3xl font-bold mb-4">Order Completed!</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Please check the box
            </p>
            <Button
              onClick={handleOkClick}
              size="lg"
              className="w-full h-16 text-2xl font-bold"
              data-testid="button-dismiss-alert"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
