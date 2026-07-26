import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url === "https://...") {
    return new Redis({
      url: "https://placeholder.upstash.dev",
      token: "placeholder_token_for_build",
    });
  }
  return new Redis({ url, token });
}

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = createRedis();
  }
  return _redis;
}

let _freeHourly: Ratelimit | null = null;
function getFreeHourly() {
  if (!_freeHourly) {
    _freeHourly = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:free:hourly",
    });
  }
  return _freeHourly;
}

let _freeDaily: Ratelimit | null = null;
function getFreeDaily() {
  if (!_freeDaily) {
    _freeDaily = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(50, "24 h"),
      analytics: true,
      prefix: "ratelimit:free:daily",
    });
  }
  return _freeDaily;
}

let _proHourly: Ratelimit | null = null;
function getProHourly() {
  if (!_proHourly) {
    _proHourly = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(100, "1 h"),
      analytics: true,
      prefix: "ratelimit:pro:hourly",
    });
  }
  return _proHourly;
}

let _uploadDaily: Ratelimit | null = null;
function getUploadDailyUnused() {
  if (!_uploadDaily) {
    _uploadDaily = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "24 h"),
      analytics: true,
      prefix: "ratelimit:upload",
    });
  }
  return _uploadDaily;
}

export async function checkMessageLimit(userId: string, plan: string) {
  if (plan === "pro" || plan === "enterprise") {
    const { success, remaining } = await getProHourly().limit(userId);
    return { allowed: success, limit: 100, window: "hour", remaining: remaining ?? 0 };
  }
  const [hourly, daily] = await Promise.all([
    getFreeHourly().limit(userId),
    getFreeDaily().limit(userId),
  ]);
  if (!daily.success) {
    return { allowed: false, limit: 50, window: "day", remaining: 0 };
  }
  if (!hourly.success) {
    return { allowed: false, limit: 10, window: "hour", remaining: daily.remaining ?? 0 };
  }
  return { allowed: true, limit: 50, window: "day", remaining: daily.remaining ?? 0 };
}