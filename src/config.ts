// accesses a variable inside of process.env, throwing an error if it's not found
// always run this method in advance (i.e. upon initialisation) so that the error is thrown as early as possible
// caching the values improves performance - accessing process.env many times is bad
const cache: { [key: string]: any } = {};

const accessEnv = (key: string, defaultValue?: string): string => {
  if (!(key in process.env)) {
    if (defaultValue) return defaultValue;
    throw new Error(`${key} not found in process.env`);
  }

  if (cache[key]) return cache[key];

  cache[key] = process.env[key];

  return cache[key];
};

const config = {
  server: {
    port: Number(accessEnv("PORT", "8080")),
    db: accessEnv("DB", "mongodb://mongodb:27017/room-finder"),
    log: Boolean(accessEnv("LOG", "true")),
    redisPassword: accessEnv("REDIS_PASSWORD"),
  },
  planning: {
    start: accessEnv("PLANNING_START", "2019-09-01"),
    end: accessEnv("PLANNING_END", "2020-01-01"),
  },
};

export default config;
