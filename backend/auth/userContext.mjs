import { findUserById } from "../repositories/userRepository.mjs";

export function assertUserExists(userId) {
  const parsed = Number(userId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error("Invalid user id");
    error.statusCode = 400;
    throw error;
  }

  const user = findUserById(parsed);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
}
