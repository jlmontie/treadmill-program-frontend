# Rate Limiting Implementation Notes

## Current Implementation

**File:** `src/lib/rate-limit.ts`  
**Type:** In-memory Map-based rate limiting  
**Status:** ✅ Acceptable for current deployment

## Current Deployment Context

- **Platform:** Vercel (serverless)
- **Users:** Authenticated users only (trainers managing athletes)
- **Access:** Protected by Supabase Auth + middleware
- **Risk Level:** Low (trusted user base)

## How It Works

```typescript
// In-memory store per serverless instance
const rateLimitStore = new Map<string, RateLimitEntry>()

// Each Vercel instance has its own Map
// Rate limits are PER INSTANCE, not global
```

## Why This Is Acceptable

1. **Authenticated Users Only**
   - Only authorized trainers can access the dashboard
   - Middleware enforces authentication on all routes
   - Low risk of malicious abuse

2. **Defense in Depth**
   - Rate limiting is a secondary protection
   - Primary protection is authentication + RLS
   - Helps prevent accidental bugs from causing issues

3. **Practical Limits**
   - Even per-instance limits provide protection
   - A malicious user would need to coordinate requests across instances
   - For the current scale, this is sufficient

## Limitations

### On Vercel (Serverless)

```
Example: 30 req/min limit with 3 instances running

User makes 90 requests in 1 minute:
- Instance A: 30 requests → All allowed (at limit)
- Instance B: 30 requests → All allowed (at limit)  
- Instance C: 30 requests → All allowed (at limit)

Result: User made 90 requests, all allowed
Effective limit: ~3x configured limit (varies by traffic distribution)
```

### When to Upgrade

Consider upgrading to Redis-based rate limiting if:

1. **User base expands** to include untrusted/public users
2. **Abuse detected** in logs showing excessive requests
3. **Cost concerns** from Supabase API overuse
4. **Compliance requirements** for strict rate limiting

## Upgrade Paths

### Option 1: Vercel KV (Easiest)
```bash
# Install
npm install @vercel/kv

# Enable in Vercel dashboard (free tier: 30k requests/day)

# Update src/lib/rate-limit.ts
import { kv } from '@vercel/kv'

export async function rateLimit(identifier: string, config: RateLimitConfig) {
  const key = `ratelimit:${identifier}`
  const current = await kv.incr(key)
  
  if (current === 1) {
    await kv.expire(key, config.windowSeconds)
  }
  
  return {
    success: current <= config.limit,
    remaining: Math.max(0, config.limit - current),
    // ...
  }
}
```

**Pros:** Official Vercel solution, free tier, simple migration  
**Cons:** Vercel-specific (not portable)

### Option 2: Upstash Redis (Most Portable)
```bash
# Install
npm install @upstash/redis @upstash/ratelimit

# Sign up at upstash.com (free tier: 10k requests/day)

# Use their rate limiting library
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
```

**Pros:** Works anywhere, portable, full control  
**Cons:** Extra service to manage

### Option 3: Remove Rate Limiting
For authenticated-only apps with RLS, you could argue rate limiting in server actions is unnecessary since:
- Database has connection pooling limits
- Supabase has built-in rate limiting
- RLS prevents data access issues
- Auth prevents unauthorized access

**Pros:** Simplest, fewer dependencies  
**Cons:** No protection against buggy code loops

## Recommendation

**For Current State (Q1 2026):**
- ✅ Keep existing in-memory implementation
- ✅ Document limitations (this file)
- ✅ Monitor Supabase usage
- ⏭️ Defer Redis upgrade until needed

**Trigger for Upgrade:**
- Supabase API usage > 80% of quota
- Evidence of abuse in logs
- User base > 50 active trainers
- Public-facing features added

## Monitoring

Add to your monitoring dashboard:
- Supabase API request count
- Failed auth attempts
- Unusual patterns in request logs

## Related Files

- `src/lib/rate-limit.ts` - Current implementation
- `src/lib/supabase/auth.ts` - Uses rate limiting in `withAuthRateLimited()`
- `docs/production-readiness-plan.md` - P1-5 section
