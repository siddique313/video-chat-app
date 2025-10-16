import ChatPageContent from "@/app/chat/page";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
          Loading...
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
