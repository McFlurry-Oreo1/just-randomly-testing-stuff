import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Download, Video as VideoIcon, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JSZip from "jszip";

interface CameraStream {
  userId: string;
  userName: string;
  imageData: string;
  serverTimestamp: number;
}

interface RecordingState {
  [userId: string]: {
    isRecording: boolean;
    frames: string[];
    startTime: number;
    lastTimestamp: number;
  };
}

export default function CameraViewer() {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>({});
  const recordingIntervalsRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  const { data: streams = [] } = useQuery<CameraStream[]>({
    queryKey: ["/api/admin/camera/streams"],
    refetchInterval: 1000,
  });

  const latestStreamsRef = useRef<CameraStream[]>([]);

  useEffect(() => {
    latestStreamsRef.current = streams;
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
    setRecordingState(prev => ({
      ...prev,
      [stream.userId]: {
        isRecording: true,
        frames: [stream.imageData],
        startTime: Date.now(),
        lastTimestamp: stream.serverTimestamp,
      },
    }));

    const interval = setInterval(() => {
      const currentStream = latestStreamsRef.current.find(s => s.userId === stream.userId);
      if (currentStream) {
        setRecordingState(prev => {
          const current = prev[stream.userId];
          if (current && current.isRecording) {
            if (currentStream.serverTimestamp > current.lastTimestamp) {
              return {
                ...prev,
                [stream.userId]: {
                  ...current,
                  frames: [...current.frames, currentStream.imageData],
                  lastTimestamp: currentStream.serverTimestamp,
                },
              };
            }
          }
          return prev;
        });
      }
    }, 1000);

    recordingIntervalsRef.current[stream.userId] = interval;

    toast({
      title: "Recording Started",
      description: `Recording video from ${stream.userName}`,
    });
  };

  const stopRecording = async (userId: string) => {
    if (recordingIntervalsRef.current[userId]) {
      clearInterval(recordingIntervalsRef.current[userId]);
      delete recordingIntervalsRef.current[userId];
    }

    const recording = recordingState[userId];
    if (!recording) return;

    const stream = streams.find(s => s.userId === userId);
    if (!stream) return;

    try {
      await apiRequest("POST", "/api/admin/camera/capture", {
        userId,
        imageData: recording.frames[recording.frames.length - 1],
        type: 'video',
      });

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const frameDelay = 1000;
      const gifFrames: ImageData[] = [];

      for (const frameData of recording.frames) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = frameData;
        });

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        gifFrames.push(imageData);
      }

      const zip = await createVideoZip(recording.frames, userId);
      const link = document.createElement('a');
      link.download = `video-${userId}-${Date.now()}.zip`;
      link.href = URL.createObjectURL(zip);
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: "Video Saved",
        description: `Recorded ${recording.frames.length} frames from ${stream.userName}`,
      });

      setRecordingState(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    } catch (error: any) {
      toast({
        title: "Recording Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createVideoZip = async (frames: string[], userId: string): Promise<Blob> => {
    const zip = new JSZip();

    for (let i = 0; i < frames.length; i++) {
      const base64Data = frames[i].split(',')[1];
      const binaryData = atob(base64Data);
      const arrayBuffer = new Uint8Array(binaryData.length);
      for (let j = 0; j < binaryData.length; j++) {
        arrayBuffer[j] = binaryData.charCodeAt(j);
      }
      zip.file(`frame-${String(i).padStart(4, '0')}.jpg`, arrayBuffer);
    }

    const textContent = `Video Recording
User ID: ${userId}
Total Frames: ${frames.length}
Frame Rate: ~1 fps
Duration: ~${frames.length} seconds

To view: Extract frames and use video editing software to create video.
Frames are numbered sequentially (frame-0000.jpg, frame-0001.jpg, etc.)
`;
    
    zip.file('README.txt', textContent);

    return await zip.generateAsync({ type: 'blob' });
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
          const frameCount = recordingState[stream.userId]?.frames.length || 0;

          return (
            <Card key={stream.userId} className="p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{stream.userName}</h3>
                  <div className="flex items-center gap-2">
                    {isRecording && (
                      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span>REC {frameCount}f</span>
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
                    Stop ({frameCount}f)
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
