import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function CameraViewer() {
  return (
    <div className="py-8">
      <Card className="glass p-12 text-center max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Camera Viewer</h2>
        <p className="text-muted-foreground">
          Camera streaming is not available in this deployment. WebSocket functionality has been disabled for serverless hosting.
        </p>
      </Card>
    </div>
  );
}
