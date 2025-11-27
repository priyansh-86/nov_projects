// src/app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginButton from "@/components/LoginButton";
import Dashboard from "@/components/Dashboard";

// Next.js Page ab searchParams prop accept karega
export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);

  // === Logic to handle Drive "Open with" request ===
  let fileIdToOpen: string | null = null;
  const stateParam = searchParams?.state;

  if (stateParam && typeof stateParam === 'string') {
    try {
      // Drive bhejta hai: ?state={"ids":["FILE_ID"],"action":"open",...}
      // Humein isse decode karke ID nikalni hai.
      const decodedState = JSON.parse(stateParam);
      if (decodedState.ids && Array.isArray(decodedState.ids) && decodedState.ids.length > 0) {
        fileIdToOpen = decodedState.ids[0];
        console.log("Drive requesting to open file ID:", fileIdToOpen);
      }
    } catch (e) {
      console.error("Failed to parse Drive state parameter:", e);
    }
  }
  // ================================================

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500 selection:text-white relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[150px] opacity-40" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 h-full min-h-screen flex flex-col">
        {!session ? (
            // LANDING PAGE VIEW
            <div className="flex flex-col items-center justify-center flex-grow min-h-[80vh] select-none">
                <div className="relative mb-8 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative px-7 py-4 bg-black rounded-full leading-none flex items-center">
                        <span className="text-gray-200">✨ Stream without limits</span>
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500 mb-6 text-center tracking-tight">
                  Drive Cinema
                </h1>
                
                <p className="text-gray-400 mb-12 text-lg md:text-xl text-center max-w-xl leading-relaxed">
                  Turn your Google Drive into a personal streaming service. 
                  <br/>
                  <span className="text-gray-500 text-base">No downloads. No waiting. Just pure playback.</span>
                </p>
                
                <LoginButton />
            </div>
        ) : (
          // DASHBOARD VIEW (Authenticated)
          // Hum extracted file ID ko Dashboard component mein pass kar rahe hain
          <Dashboard 
            accessToken={(session as any).accessToken} 
            initialFileId={fileIdToOpen} 
          />
        )}
      </div>
    </main>
  );
}