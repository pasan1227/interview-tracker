export const BCRYPT_COST = 12;
export const VERIFICATION_TOKEN_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const TWO_FACTOR_TOKEN_TTL_MS = 10 * 60 * 1000;
// Invitations are clicked by humans through email — 7 days gives
// recipients plenty of time without leaving stale invites dangling.
export const INVITATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
