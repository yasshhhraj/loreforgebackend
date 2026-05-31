import * as userRepo from '../repositories/user.repository';

export async function listUsers() {
  return userRepo.findAll();
}

export async function createUser(payload: any) {
  return userRepo.create(payload);
}
