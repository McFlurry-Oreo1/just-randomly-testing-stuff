
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Download, Video as VideoIcon, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CameraStream {
  userId: string;
  userName: string;
  imageData: string;
  serverTimestamp: number;
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
  const [recordingState, setRecordingState] = useState<RecordingState>({});
  const canvasRefs = useRef<{ [userId: string]: HTMLCanvasElement }>({});
  const streamRefs = useRef<{ [userId: string]: MediaStream }>({});

  const { data: streams = [] } = useQuery<CameraStream[]>({
    queryKey: ["/api/admin/camera/streams"],
    refetchInterval: 100,
  });

  useEffect(() => {
    streams.forEach((stream) => {
      if (!canvasRefs.current[stream.userId]) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvasRefs.current[stream.userId] = canvas;
      }

      const canvas = canvasRefs.current[stream.userId];
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = stream.imageData;

      if (!streamRefs.current[stream.userId]) {
        const canvasStream = canvas.captureStream(30);
        streamRefs.current[stream.userId] = canvasStream;
      }
    });

    const activeUserIds = new Set(streams.map(s => s.userId));
    Object.keys(canvasRefs.current).forEach(userId => {
      if (!activeUserIds.has(userId)) {
        delete canvasRefs.current[userId];
        if (streamRefs.current[userId]) {
          streamRefs.current[userId].getTracks().forEach(track => track.stop());
          delete streamRefs.current[userId];
        }
      }
    });
  }, [streams]);

  const handleScreenshot = async (stream: CameraStream) => {
    try {
      await apiRequest("POST", "/api/admin/camera/capture", {
        userId: stream.userId,
        imageData: stream.imageData,
        type: 'screenshot',
      });

      const link = document.createElement('a');
      link.download = `screenshot-${stream.userId}-${Date.now()}.jpg`;
      link.href = stream.imageData;
      link.click();

      toast({
        title: "Screenshot Saved",
        description: `Screenshot from ${stream.userName} downloaded`,
      });
    } catch (error: any) {
      toast({
        title: "Screenshot Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startRecording = (stream: CameraStream) => {
    const canvasStream = streamRefs.current[stream.userId];
    if (!canvasStream) {
      toast({
        title: "Recording Failed",
        description: "Stream not ready",
        variant: "destructive",
      });
      return;
    }

    try {
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp8',
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
        [stream.userId]: {
          isRecording: true,
          mediaRecorder,
          chunks,
          startTime: Date.now(),
        },
      }));

      toast({
        title: "Recording Started",
        description: `Recording video from ${stream.userName}`,
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

          await apiRequest("POST", "/api/admin/camera/capture", {
            userId,
            imageData: stream.imageData,
            type: 'video',
          });

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
        {streams.map((stream) => {
          const isRecording = recordingState[stream.userId]?.isRecording || false;
          const duration = isRecording 
            ? ((Date.now() - recordingState[stream.userId].startTime) / 1000).toFixed(0)
            : 0;

          return (
            <Card key={stream.userId} className="p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{stream.userName}</h3>
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
                  User ID: {stream.userId}
                </p>
              </div>

              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                <img
                  src={stream.imageData}
                  alt={`Live feed from ${stream.userName}`}
                  className="w-full h-full object-cover"
                  data-testid={`img-stream-${stream.userId}`}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleScreenshot(stream)}
                  size="sm"
                  variant="outline"
                  disabled={isRecording}
                  data-testid={`button-screenshot-${stream.userId}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Screenshot
                </Button>
                {!isRecording ? (
                  <Button
                    onClick={() => startRecording(stream)}
                    size="sm"
                    variant="outline"
                    data-testid={`button-record-${stream.userId}`}
                  >
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={() => stopRecording(stream.userId)}
                    size="sm"
                    variant="destructive"
                    data-testid={`button-stop-record-${stream.userId}`}
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
