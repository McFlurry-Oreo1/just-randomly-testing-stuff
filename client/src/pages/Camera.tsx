
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera as CameraIcon, Video, Square, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { io, Socket } from "socket.io-client";
import SimplePeer from "simple-peer";

export default function Camera() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());

  useEffect(() => {
    // Connect to Socket.IO
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("stream-requested", (adminSocketId: string) => {
      if (streamRef.current) {
        createPeerConnection(adminSocketId, true);
      }
    });

    socket.on("signal", ({ from, signal }: { from: string; signal: any }) => {
      const peer = peersRef.current.get(from);
      if (peer) {
        peer.signal(signal);
      } else if (streamRef.current) {
        createPeerConnection(from, false, signal);
      }
    });

    return () => {
      socket.disconnect();
      peersRef.current.forEach(peer => peer.destroy());
      peersRef.current.clear();
    };
  }, []);

  const createPeerConnection = (targetSocketId: string, initiator: boolean, initialSignal?: any) => {
    if (!streamRef.current) return;

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: streamRef.current,
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("signal", {
        to: targetSocketId,
        signal,
      });
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    peer.on("close", () => {
      peersRef.current.delete(targetSocketId);
    });

    if (initialSignal) {
      peer.signal(initialSignal);
    }

    peersRef.current.set(targetSocketId, peer);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
      setHasPermission(true);
      toast({
        title: "Camera Access Granted",
        description: "You can now start streaming to admin",
      });
    } catch (error) {
      setHasPermission(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use this feature",
        variant: "destructive",
      });
    }
  };

  const startStreaming = () => {
    if (!streamRef.current || !user) {
      toast({
        title: "No Camera Access",
        description: "Please grant camera permission first",
        variant: "destructive",
      });
      return;
    }

    socketRef.current?.emit("register-streamer", user.id);
    setIsStreaming(true);

    toast({
      title: "Streaming Started",
      description: "Admin can now see your live video feed",
    });
  };

  const stopStreaming = () => {
    peersRef.current.forEach(peer => peer.destroy());
    peersRef.current.clear();
    
    setIsStreaming(false);
    toast({
      title: "Streaming Stopped",
      description: "Live video feed has been stopped",
    });
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Live Camera</h1>
        <p className="text-muted-foreground">
          Share your camera with admin for live streaming
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4 relative">
            {hasPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <CameraIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Camera access not requested</p>
                </div>
              </div>
            )}
            {hasPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-destructive/30 mx-auto mb-4" />
                  <p className="text-destructive">Camera access denied</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              data-testid="video-camera-feed"
            />
            {isStreaming && (
              <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-sm font-semibold">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            {hasPermission === null && (
              <Button
                onClick={requestCameraPermission}
                size="lg"
                data-testid="button-request-camera"
              >
                <CameraIcon className="mr-2 h-5 w-5" />
                Request Camera Access
              </Button>
            )}

            {hasPermission && !isStreaming && (
              <Button
                onClick={startStreaming}
                size="lg"
                variant="default"
                data-testid="button-start-streaming"
              >
                <Video className="mr-2 h-5 w-5" />
                Start Streaming to Admin
              </Button>
            )}

            {isStreaming && (
              <Button
                onClick={stopStreaming}
                size="lg"
                variant="destructive"
                data-testid="button-stop-streaming"
              >
                <Square className="mr-2 h-5 w-5" />
                Stop Streaming
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Privacy Notice</h3>
          <p className="text-sm text-muted-foreground">
            When you start streaming, your camera feed will be sent to the admin in real-time via WebRTC. 
            The admin can view your video feed and capture screenshots or recordings. 
            You can stop streaming at any time by clicking the "Stop Streaming" button.
          </p>
        </Card>
      </div>
    </div>
  );
}
