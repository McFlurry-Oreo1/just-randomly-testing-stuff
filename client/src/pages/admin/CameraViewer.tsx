
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Download, Video as VideoIcon, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import SimplePeer from "simple-peer";

interface StreamInfo {
  userId: string;
  userName: string;
  stream: MediaStream | null;
}

interface RecordingState {
  [userId: string]: {
    isRecording: boolean;
    mediaRecorder: MediaRecorder | null;
    chunks: Blob[];
    startTime: number;
  };
}

export default function CameraViewer() {
  const { toast } = useToast();
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>({});
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Admin socket connected");
      socket.emit("register-admin");
    });

    socket.on("active-streams", (userIds: string[]) => {
      userIds.forEach(userId => requestStream(userId));
    });

    socket.on("stream-available", (userId: string) => {
      requestStream(userId);
    });

    socket.on("stream-unavailable", (userId: string) => {
      const peer = peersRef.current.get(userId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(userId);
      }
      setStreams(prev => prev.filter(s => s.userId !== userId));
    });

    socket.on("signal", ({ from, signal }: { from: string; signal: any }) => {
      const peer = peersRef.current.get(from);
      if (peer) {
        peer.signal(signal);
      }
    });

    return () => {
      socket.disconnect();
      peersRef.current.forEach(peer => peer.destroy());
      peersRef.current.clear();
    };
  }, []);

  const requestStream = (userId: string) => {
    if (peersRef.current.has(userId)) return;

    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("signal", {
        to: userId,
        signal,
      });
    });

    peer.on("stream", (stream: MediaStream) => {
      setStreams(prev => {
        const existing = prev.find(s => s.userId === userId);
        if (existing) {
          return prev.map(s => s.userId === userId ? { ...s, stream } : s);
        }
        return [...prev, { userId, userName: `User ${userId.slice(0, 8)}`, stream }];
      });

      // Attach stream to video element
      setTimeout(() => {
        const video = videoRefs.current.get(userId);
        if (video && stream) {
          video.srcObject = stream;
        }
      }, 100);
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
    });

    peer.on("close", () => {
      peersRef.current.delete(userId);
      setStreams(prev => prev.filter(s => s.userId !== userId));
    });

    peersRef.current.set(userId, peer);
    socketRef.current?.emit("request-stream", userId);
  };

  const handleScreenshot = (streamInfo: StreamInfo) => {
    const video = videoRefs.current.get(streamInfo.userId);
    if (!video || !streamInfo.stream) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a');
        link.download = `screenshot-${streamInfo.userId}-${Date.now()}.jpg`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        toast({
          title: "Screenshot Saved",
          description: `Screenshot from ${streamInfo.userName} downloaded`,
        });
      }
    }, 'image/jpeg', 0.95);
  };

  const startRecording = (streamInfo: StreamInfo) => {
    if (!streamInfo.stream) {
      toast({
        title: "Recording Failed",
        description: "Stream not ready",
        variant: "destructive",
      });
      return;
    }

    try {
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(streamInfo.stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.start(100);

      setRecordingState(prev => ({
        ...prev,
        [streamInfo.userId]: {
          isRecording: true,
          mediaRecorder,
          chunks,
          startTime: Date.now(),
        },
      }));

      toast({
        title: "Recording Started",
        description: `Recording video from ${streamInfo.userName}`,
      });
    } catch (error: any) {
      toast({
        title: "Recording Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const stopRecording = async (userId: string) => {
    const recording = recordingState[userId];
    if (!recording || !recording.mediaRecorder) return;

    const stream = streams.find(s => s.userId === userId);
    if (!stream) return;

    return new Promise<void>((resolve) => {
      recording.mediaRecorder!.onstop = async () => {
        try {
          const blob = new Blob(recording.chunks, { type: 'video/webm' });
          const duration = ((Date.now() - recording.startTime) / 1000).toFixed(1);

          const link = document.createElement('a');
          link.download = `recording-${userId}-${Date.now()}.webm`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);

          toast({
            title: "Video Saved",
            description: `Recorded ${duration}s from ${stream.userName}`,
          });

          setRecordingState(prev => {
            const newState = { ...prev };
            delete newState[userId];
            return newState;
          });

          resolve();
        } catch (error: any) {
          toast({
            title: "Recording Failed",
            description: error.message,
            variant: "destructive",
          });
          resolve();
        }
      };

      recording.mediaRecorder!.stop();
    });
  };

  if (streams.length === 0) {
    return (
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Camera Streams</h1>
          <p className="text-muted-foreground">
            View and manage live camera feeds from users
          </p>
        </div>

        <Card className="p-12">
          <div className="text-center">
            <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Streams</h3>
            <p className="text-muted-foreground">
              No users are currently streaming their camera. Active streams will appear here.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Live Camera Streams</h1>
        <p className="text-muted-foreground">
          {streams.length} active {streams.length === 1 ? 'stream' : 'streams'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {streams.map((streamInfo) => {
          const isRecording = recordingState[streamInfo.userId]?.isRecording || false;
          const duration = isRecording 
            ? ((Date.now() - recordingState[streamInfo.userId].startTime) / 1000).toFixed(0)
            : 0;

          return (
            <Card key={streamInfo.userId} className="p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{streamInfo.userName}</h3>
                  <div className="flex items-center gap-2">
                    {isRecording && (
                      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span>REC {duration}s</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span>LIVE</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  User ID: {streamInfo.userId}
                </p>
              </div>

              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(streamInfo.userId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid={`video-stream-${streamInfo.userId}`}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleScreenshot(streamInfo)}
                  size="sm"
                  variant="outline"
                  disabled={isRecording || !streamInfo.stream}
                  data-testid={`button-screenshot-${streamInfo.userId}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Screenshot
                </Button>
                {!isRecording ? (
                  <Button
                    onClick={() => startRecording(streamInfo)}
                    size="sm"
                    variant="outline"
                    disabled={!streamInfo.stream}
                    data-testid={`button-record-${streamInfo.userId}`}
                  >
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={() => stopRecording(streamInfo.userId)}
                    size="sm"
                    variant="destructive"
                    data-testid={`button-stop-record-${streamInfo.userId}`}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop ({duration}s)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
