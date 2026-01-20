
export interface Participant {
  id: string;
  name: string;
  age: string;
  contact: string;
}

export type RewardType = '10k' | 'Premium Access';

export interface Winner extends Participant {
  reward: RewardType;
  drawTimestamp: number;
  received: boolean;
}

export interface DrawStats {
  totalParticipants: number;
  totalWinners: number;
  remainingPrizes: number;
}
