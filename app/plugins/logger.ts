import { logger } from '~/utils/logger';

export default defineNuxtPlugin(() => {
  // Log levels in consola:
  // 0 = silent, 1 = error, 2 = warn, 3 = info (default), 4 = debug, 5 = trace
  if (import.meta.env.PROD) {
    // Production: suppress debug/trace, show info and above
    logger.level = 3;
  }
  else {
    // Development: show all levels including debug
    logger.level = 4;
  }
});
