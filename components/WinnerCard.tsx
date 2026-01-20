
import React from 'react';
import { Winner } from '../types';

interface WinnerCardProps {
  winner: Winner;
  index: number;
  delay?: number;
}

const WinnerCard: React.FC<WinnerCardProps> = ({ winner, index, delay = 0 }) => {
  const isPremium = winner.reward === 'Premium Access';
  
  return (
    <div 
      className={`animate-reveal relative overflow-hidden p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl border ${
        isPremium 
          ? 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white shadow-xl ring-8 ring-indigo-500/10' 
          : 'bg-white border-slate-200 shadow-lg text-slate-800'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isPremium && (
        <>
          <div className="absolute top-[-20%] right-[-10%] opacity-10 rotate-12">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div className="absolute bottom-2 right-4 flex gap-1">
             <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
             <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
             <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
          </div>
        </>
      )}
      
      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
          isPremium ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
        }`}>
          {isPremium ? (
            <><span className="text-sm">👑</span> Premium Access</>
          ) : (
            <><span className="text-sm">💵</span> 10k Reward</>
          )}
        </div>
        <span className={`text-xl font-black italic ${isPremium ? 'text-white/40' : 'text-slate-200'}`}>
          #{index + 1}
        </span>
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-xl font-extrabold truncate leading-tight tracking-tight">{winner.name}</h3>
        <p className={`text-sm font-semibold ${isPremium ? 'text-indigo-100' : 'text-slate-400'}`}>
          Age: {winner.age}
        </p>
      </div>

      <div className={`mt-6 pt-5 border-t ${isPremium ? 'border-white/10' : 'border-slate-100'}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 opacity-50 ${isPremium ? 'text-white' : 'text-slate-400'}`}>
          Contact Info
        </p>
        <p className={`text-sm font-medium font-mono truncate ${isPremium ? 'text-white' : 'text-slate-600'}`}>
          {winner.contact}
        </p>
      </div>
    </div>
  );
};

export default WinnerCard;
