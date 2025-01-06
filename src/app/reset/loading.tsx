import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex justify-center items-center h-full w-full">
      <div>
        <Loader2 className="animate-spin" />
      </div>
    </main>
  );
}
