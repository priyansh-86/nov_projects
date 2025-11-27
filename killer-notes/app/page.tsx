export default function Home() {
  return (
    <div className="h-full flex flex-col p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white/90">Dashboard</h2>
          <p className="text-white/40 mt-1">Welcome back, ready to write something epic?</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1 */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
           <h3 className="text-white/40 text-sm font-medium uppercase tracking-wider">Total Notes</h3>
           <p className="text-4xl font-bold text-white mt-2">0</p>
        </div>
        {/* Card 2 */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
           <h3 className="text-white/40 text-sm font-medium uppercase tracking-wider">Favorites</h3>
           <p className="text-4xl font-bold text-purple-400 mt-2">0</p>
        </div>
        {/* Card 3 */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
           <h3 className="text-white/40 text-sm font-medium uppercase tracking-wider">Tags</h3>
           <p className="text-4xl font-bold text-blue-400 mt-2">0</p>
        </div>
      </div>

      {/* Recent Notes Section */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <h3 className="text-xl font-semibold text-white/80 mb-6">Recent Notes</h3>
        
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-white/10 rounded-xl bg-black/20">
           <p className="text-white/40 mb-2">No notes created yet.</p>
           <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
             + Create your first note
           </button>
        </div>
      </div>
    </div>
  );
}