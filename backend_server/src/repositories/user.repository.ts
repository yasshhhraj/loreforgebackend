import { v4 as uuidv4 } from 'uuid';

const inMemory: any[] = [];

export async function findAll() {
  return inMemory;
}

export async function create(data: any) {
  const item = { id: uuidv4(), ...data };
  inMemory.push(item);
  return item;
}
