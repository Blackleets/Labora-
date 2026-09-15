
import { Person } from '../types';

const STORAGE_KEY = 'labora_people';

// Interface defined in prompt
export interface IPeopleRepository {
  getAll(): Person[];
  create(person: Person): void;
  update(person: Person): void;
  delete(id: string): void;
}

export const peopleRepository: IPeopleRepository = {
  getAll: (): Person[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading people:', e);
      return [];
    }
  },

  create: (person: Person): void => {
    const list = peopleRepository.getAll();
    // Add to beginning of list
    const newList = [person, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  },

  update: (updatedPerson: Person): void => {
    const list = peopleRepository.getAll();
    const newList = list.map(p => p.id === updatedPerson.id ? updatedPerson : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  },

  delete: (id: string): void => {
    const list = peopleRepository.getAll();
    const newList = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  }
};
