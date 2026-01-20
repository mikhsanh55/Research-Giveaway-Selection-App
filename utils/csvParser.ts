
import { Participant } from '../types';

export const parseCSVData = (csvContent: string): Participant[] => {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const participants: Participant[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser for this specific format
    // Handling quoted values if needed, but for this dataset simple split works mostly
    // We use a regex to split by comma but ignore commas inside quotes
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    
    if (parts.length >= 3) {
      const name = parts[0].replace(/"/g, '').trim();
      const age = parts[1].replace(/"/g, '').trim();
      const contact = parts[2].replace(/"/g, '').trim();

      if (name && contact) {
        participants.push({
          id: `p-${i}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          age,
          contact
        });
      }
    }
  }

  return participants;
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
