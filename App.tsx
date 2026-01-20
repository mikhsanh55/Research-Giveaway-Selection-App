
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Participant, Winner, RewardType } from './types';
import { RAW_CSV_DATA } from './constants';
import { parseCSVData, shuffleArray } from './utils/csvParser';
import WinnerCard from './components/WinnerCard';

declare var confetti: any;

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shufflingName, setShufflingName] = useState('');
  const [status, setStatus] = useState<'idle' | 'drawing' | 'completed'>('idle');

  useEffect(() => {
    const data = parseCSVData(RAW_CSV_DATA);
    setParticipants(data);
  }, []);

  const triggerConfetti = () => {
    const end = Date.now() + (3 * 1000);
    const colors = ['#4f46e5', '#8b5cf6', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const isValidContact = (contact: string): boolean => {
    const digitsOnly = contact.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const formatWALink = (contact: string): string => {
    let digitsOnly = contact.replace(/\D/g, '');
    if (digitsOnly.startsWith('0')) {
      digitsOnly = '62' + digitsOnly.slice(1);
    } else if (digitsOnly.startsWith('8')) {
      digitsOnly = '62' + digitsOnly;
    }
    return `https://wa.me/${digitsOnly}`;
  };

  const handleDraw = useCallback(async () => {
    const validParticipants = participants.filter(p => isValidContact(p.contact));
    
    if (validParticipants.length < 14) {
      alert(`Not enough participants with valid contact numbers (min. 10 digits). Found: ${validParticipants.length}`);
      return;
    }
    
    setWinners([]);
    setIsDrawing(true);
    setStatus('drawing');
    
    let shuffleInterval = setInterval(() => {
      const randomP = validParticipants[Math.floor(Math.random() * validParticipants.length)];
      setShufflingName(randomP.name);
    }, 100);

    const pool = shuffleArray([...validParticipants]);
    const finalWinners: Winner[] = [];
    const timestamp = Date.now();

    // Pick 1 Premium
    const pWinner = pool.pop()!;
    finalWinners.push({ ...pWinner, reward: 'Premium Access', drawTimestamp: timestamp, received: false });

    // Pick 13 10k
    for (let i = 0; i < 13; i++) {
      const cWinner = pool.pop()!;
      finalWinners.push({ ...cWinner, reward: '10k', drawTimestamp: timestamp, received: false });
    }

    await new Promise(r => setTimeout(r, 2000));
    clearInterval(shuffleInterval);

    const revealed: Winner[] = [];
    for (const w of finalWinners) {
      revealed.push(w);
      setWinners([...revealed]);
      if (w.reward === 'Premium Access') {
        triggerConfetti();
      }
      await new Promise(r => setTimeout(r, 300));
    }

    setIsDrawing(false);
    setStatus('completed');
  }, [participants]);

  const toggleReceived = (id: string) => {
    setWinners(prev => prev.map(w => w.id === id ? { ...w, received: !w.received } : w));
  };

  const handleReplaceWinner = (id: string) => {
    const currentWinner = winners.find(w => w.id === id);
    if (!currentWinner) return;

    // Filter available participants: valid contact AND not already in the winners list
    const winnerIds = new Set(winners.map(w => w.id));
    const availablePool = participants.filter(p => isValidContact(p.contact) && !winnerIds.has(p.id));

    if (availablePool.length === 0) {
      alert("No more available participants with valid contacts to replace with.");
      return;
    }

    const replacement = availablePool[Math.floor(Math.random() * availablePool.length)];
    const newWinner: Winner = {
      ...replacement,
      reward: currentWinner.reward,
      drawTimestamp: Date.now(),
      received: false
    };

    setWinners(prev => prev.map(w => w.id === id ? newWinner : w));
    
    if (newWinner.reward === 'Premium Access') {
      triggerConfetti();
    }
  };

  const premiumWinner = useMemo(() => winners.find(w => w.reward === 'Premium Access'), [winners]);
  const cashWinners = useMemo(() => winners.filter(w => w.reward === '10k'), [winners]);
  
  const statsRecap = useMemo(() => {
    const receivedCount = winners.filter(w => w.received).length;
    const pendingCount = winners.length - receivedCount;
    const percentage = winners.length > 0 ? Math.round((receivedCount / winners.length) * 100) : 0;
    return { receivedCount, pendingCount, percentage };
  }, [winners]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 selection:bg-indigo-100">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 leading-none">WinnerSelection</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Research Giveaway v1.4</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valid Entries</p>
              <p className="text-sm font-extrabold text-slate-800">{participants.filter(p => isValidContact(p.contact)).length} Participants</p>
            </div>
            <button
              onClick={handleDraw}
              disabled={isDrawing}
              className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-xl active:scale-95 flex items-center gap-2 ${
                isDrawing 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isDrawing ? 'Picking...' : status === 'completed' ? 'Redraw Winners' : 'Start Random Draw'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <div className={`transition-all duration-700 p-10 rounded-[40px] text-center shadow-2xl relative overflow-hidden mb-16 ${
          status === 'drawing' ? 'bg-indigo-900 scale-[1.02]' : 'bg-slate-900'
        }`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.3),transparent)] pointer-events-none"></div>
            
            <div className="relative z-10">
              <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                {isDrawing ? 'Algorithm Running' : status === 'completed' ? 'Draw Finished' : 'System Ready'}
              </p>
              
              <div className="h-20 flex items-center justify-center">
                {isDrawing ? (
                  <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter animate-pulse truncate max-w-full">
                    <span className="opacity-50 text-2xl not-italic mr-3 font-medium">Scanning:</span>
                    {shufflingName}
                  </h2>
                ) : status === 'completed' ? (
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                    Selected 14 Lucky Winners!
                  </h2>
                ) : (
                  <h2 className="text-4xl md:text-5xl font-black text-slate-500 tracking-tighter">
                    Awaiting Selection...
                  </h2>
                )}
              </div>
            </div>
        </div>

        {winners.length > 0 && (
          <div className="space-y-20">
            {/* Grand Prize */}
            {premiumWinner && (
              <section className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-3xl">💎</span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Grand Prize Winner</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="md:col-start-2">
                    <WinnerCard winner={premiumWinner} index={0} />
                  </div>
                </div>
              </section>
            )}

            {/* Cash Prizes */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <span className="text-3xl">💸</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Standard Winners</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {cashWinners.map((winner, idx) => (
                  <WinnerCard key={winner.id} winner={winner} index={idx + 1} />
                ))}
              </div>
            </section>

            {/* Distribution Recap */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Winners</p>
                  <p className="text-3xl font-black text-slate-900">{winners.length}</p>
               </div>
               <div className="bg-green-50 p-6 rounded-3xl shadow-sm border border-green-100">
                  <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Gifts Received</p>
                  <p className="text-3xl font-black text-green-700">{statsRecap.receivedCount}</p>
               </div>
               <div className="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-100">
                  <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Gifts Pending</p>
                  <p className="text-3xl font-black text-orange-700">{statsRecap.pendingCount}</p>
               </div>
            </section>

            {/* Official Winner Log */}
            <section className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <h3 className="font-extrabold text-slate-900 tracking-tight">Distribution Progress</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${statsRecap.percentage}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600">{statsRecap.percentage}% Completed</span>
                      </div>
                      <button 
                        onClick={() => window.print()}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                      >
                        Print Log
                      </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5 text-center w-20">Done</th>
                                <th className="px-8 py-5">Full Name</th>
                                <th className="px-8 py-5">Age</th>
                                <th className="px-8 py-5">WhatsApp Link</th>
                                <th className="px-8 py-5">Reward</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {winners.map((winner) => (
                                <tr key={winner.id} className={`transition-colors group ${winner.received ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}>
                                    <td className="px-8 py-5 text-center">
                                      <input 
                                        type="checkbox" 
                                        checked={winner.received}
                                        onChange={() => toggleReceived(winner.id)}
                                        className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                      />
                                    </td>
                                    <td className={`px-8 py-5 font-bold transition-all ${winner.received ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                      {winner.name}
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 font-semibold">{winner.age}</td>
                                    <td className="px-8 py-5">
                                      {isValidContact(winner.contact) ? (
                                        <a 
                                          href={formatWALink(winner.contact)} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-mono text-xs group/link"
                                        >
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                          {winner.contact}
                                          <svg className="w-3 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                        </a>
                                      ) : (
                                        <span className="text-slate-300 italic text-xs">Invalid Format</span>
                                      )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl inline-block ${
                                            winner.reward === 'Premium Access' 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {winner.reward}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                       <button 
                                          onClick={() => handleReplaceWinner(winner.id)}
                                          title="Replace Winner"
                                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                       >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                       </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-1000">
            <div className="w-24 h-24 bg-white shadow-2xl rounded-[32px] flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Ready for Selection</h3>
            <p className="text-slate-400 max-w-md mt-4 font-medium leading-relaxed">
              We've identified <span className="text-indigo-600 font-bold">{participants.filter(p => isValidContact(p.contact)).length}</span> verified entries with valid phone numbers.
            </p>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-12">
        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <p>© 2024 Research Prize Distribution Engine</p>
          <div className="flex gap-6">
            <span className="hover:text-indigo-600 cursor-help">Security Protocol Enabled</span>
            <span className="hover:text-indigo-600 cursor-help">WhatsApp Integration Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
