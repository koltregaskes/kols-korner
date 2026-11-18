# Cost Breakdown - Kol's Korner

**Last Updated:** December 25, 2025
**Current Version:** 2.1.0

This document outlines all costs associated with running your Notion-powered static site.

---

## 💰 Baseline Costs (v2.1.0)

### **Baseline: free-tier services only**

The baseline build is designed to run on free-tier services. Optional features below add costs at each provider's published prices.

---

## 🆓 Free Services (Baseline)

### 1. **GitHub**
- **Service:** GitHub Pages hosting + GitHub Actions CI/CD
- **Cost:** FREE ✅
- **Limits:**
  - 1 GB storage for Pages site
  - 100 GB bandwidth/month
  - 2,000 GitHub Actions minutes/month (free tier)
- **Estimated Usage:**
  - ~1 build/hour = 24 builds/day = ~720 builds/month
  - ~2 minutes per build = ~1,440 minutes/month
  - **Status:** Well within free tier ✅

**Pricing Link:** [GitHub Pricing](https://github.com/pricing)

### 2. **Notion**
- **Service:** Notion API (Content Management System)
- **Cost:** FREE ✅
- **Limits:**
  - API rate limit: 3 requests/second (enforced as average over 1 minute)
  - No monthly request limit on free plan
- **Estimated Usage:**
  - 1 database query per build
  - ~720 API calls/month
  - **Status:** Well within limits ✅

**Pricing Link:** [Notion Pricing](https://www.notion.so/pricing)

### 3. **Node.js**
- **Service:** Build tool (runs on GitHub Actions)
- **Cost:** FREE ✅ (open source)

---

## 💵 Future Costs (Planned Features)

### Sprint 5+: AI-Generated Summaries

#### **Anthropic Claude API**

**Service:** Auto-generate article summaries for content without manual summaries

**Model:** Claude 3.5 Haiku (recommended for cost efficiency)

**Pricing (as of Dec 2025):**
- Input: $0.80 per million tokens (~$0.0008 per 1,000 tokens)
- Output: $4.00 per million tokens (~$0.004 per 1,000 tokens)

**Pricing Link:** [Anthropic Pricing](https://www.anthropic.com/pricing)

**Estimated Usage:**

| Scenario | Articles/Month | Avg Article Length | Input Tokens | Output Tokens | Cost/Month |
|----------|----------------|-------------------|--------------|---------------|------------|
| **Light** | 4 articles | 2,000 words | ~12,000 | ~600 | **$0.01** |
| **Medium** | 20 articles | 2,000 words | ~60,000 | ~3,000 | **$0.06** |
| **Heavy** | 100 articles | 2,000 words | ~300,000 | ~15,000 | **$0.30** |

**Assumptions:**
- Average article: 2,000 words ≈ 2,700 tokens
- Prompt overhead: ~200 tokens
- Summary output: ~150 tokens (max 160 chars as requested)
- Total per article: ~3,000 input + ~150 output = ~$0.003 per summary

**Optimization Tips:**
- Only generate summaries for articles WITHOUT manual summaries
- Cache generated summaries in `data/notion.json` to avoid regeneration
- Run summary generation only when new articles are published (not every build)

**Implementation Note:**
```javascript
// Estimated API call per article
const response = await fetch('https://api.anthropic.com/v1/messages', {
  // Prompt: ~200 tokens
  // Article content: ~2,700 tokens
  // Response: ~150 tokens
  // Total cost: ~$0.003
});
```

**Required Setup:**
- Add `ANTHROPIC_API_KEY` to GitHub Secrets
- Sign up at [Anthropic Console](https://console.anthropic.com)
- Get API key from dashboard

---

### Sprint 6+: Newsletter Automation

#### **X (Twitter) API**

**Service:** Fetch tweets from specified accounts for weekly newsletter content

**Pricing Tiers (as of Dec 2025):**

| Tier | Cost/Month | Tweet Reads | Our Estimate |
|------|------------|-------------|--------------|
| **Free** | $0 | 1,500/month | ⚠️ Insufficient |
| **Basic** | **$100** | 10,000/month | ✅ Sufficient |
| **Pro** | $5,000 | 1M/month | Overkill |

**Pricing Link:** [X API Pricing](https://developer.x.com/en/products/x-api)

**Estimated Usage:**

**Scenario:** Weekly newsletter gathering tweets from 3 accounts
- Accounts: @koltregaskes, @koltregaskes2, @axylusion
- Frequency: Once per week (52 times/year)
- Tweets per account: ~50 tweets/week (7 days worth)
- Total API calls: 3 accounts × 50 tweets = **150 tweet reads/week**
- Monthly: 150 × 4.3 weeks = **~645 reads/month**

**Free Tier:** 1,500 reads/month → ✅ **Sufficient!**

**BUT:** Free tier has limited endpoint access. May need Basic tier ($100/month) for:
- Tweet search functionality
- User timeline access
- Full metadata

**Alternative (Recommended):**
- Use RSS feeds instead (FREE)
- Use third-party aggregators like Zapier (lower cost)
- Manual curation until user base justifies $100/month

**Implementation:**
```javascript
// Weekly GitHub Action runs Sunday at midnight
// Fetches last 7 days of tweets from 3 accounts
// ~150 API calls per week = 645/month
// Free tier: Possible but limited
// Basic tier ($100/month): Full access
```

**Required Setup:**
- Apply for X Developer Account
- Create App in X Developer Portal
- Add to GitHub Secrets:
  - `TWITTER_API_KEY`
  - `TWITTER_API_SECRET`
  - `TWITTER_ACCESS_TOKEN`
  - `TWITTER_ACCESS_SECRET`

---

#### **Newsletter Service (Buttondown or Substack)**

**Option 1: Buttondown** (Recommended)

| Plan | Cost/Month | Subscribers | Features |
|------|------------|-------------|----------|
| **Free** | $0 | Up to 100 | Basic features, Buttondown branding |
| **Standard** | **$9** | Up to 1,000 | Remove branding, automation, analytics |
| **Professional** | $29 | Up to 10,000 | Priority support, custom domain |

**Pricing Link:** [Buttondown Pricing](https://buttondown.email/pricing)

**Estimated Usage:**
- Start with **Free tier** (0-100 subscribers)
- Upgrade to **$9/month** when you hit 100 subscribers
- Clean interface, developer-friendly API
- Easy integration with GitHub Actions

**Option 2: Substack** (Alternative)

| Plan | Cost/Month | Notes |
|------|------------|-------|
| **Free** | $0 | Takes 10% of paid subscriptions |

**Pricing Link:** [Substack Pricing](https://substack.com/going-paid)

**Comparison:**
- **Buttondown:** Better for tech/automation, clean API
- **Substack:** Better for monetization, larger audience, discovery features

---

## 📊 Total Cost Scenarios

### **Baseline (v2.1.0)**
```
GitHub Pages:        $0.00
Notion API:          $0.00
Node.js:             $0.00
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:               free-tier baseline
```

### **With AI Summaries (Medium Usage)**
```
GitHub Pages:        $0.00
Notion API:          $0.00
Claude API:          $0.06  (20 articles/month)
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:               $0.06/month ✅
```

### **With Newsletter (Basic Setup)**
```
GitHub Pages:        $0.00
Notion API:          $0.00
Claude API:          $0.30  (summaries + newsletter generation)
X API (Free tier):   $0.00  (limited features)
Buttondown (Free):   $0.00  (<100 subscribers)
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:               $0.30/month ✅
```

### **With Newsletter (Full Automation)**
```
GitHub Pages:        $0.00
Notion API:          $0.00
Claude API:          $1.00  (heavy usage)
X API (Basic):       $100.00  (10K reads/month)
Buttondown (Standard): $9.00  (>100 subscribers)
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:               $110.00/month ⚠️
```

### **Enterprise Scale (Hypothetical)**
```
GitHub:              $4.00  (GitHub Team for private repos)
Notion API:          $0.00  (still free)
Claude API:          $10.00  (1000 articles/month)
X API (Basic):       $100.00
Buttondown (Pro):    $29.00  (>1K subscribers)
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:               $143.00/month
```

---

## 💡 Cost Optimization Strategies

### 1. **AI Summaries**
- ✅ Only generate summaries for articles WITHOUT manual ones
- ✅ Use Haiku (cheapest model) instead of Sonnet or Opus
- ✅ Cache summaries in build output (don't regenerate)
- ✅ Limit summary length (150 tokens max vs 500+)
- ✅ Batch API calls during build, not on-demand

**Savings:** ~70% (from $0.30 → $0.09/month for 100 articles)

### 2. **Twitter/X API**
- ✅ Use Free tier initially (1,500 reads/month)
- ✅ Consider RSS feeds instead (completely free)
- ✅ Use Zapier/IFTTT for automation ($19.99/month, cheaper than X Basic)
- ✅ Manual curation until user base justifies $100/month
- ✅ Cache fetched tweets to avoid re-fetching

**Savings:** $100/month (Free tier vs Basic)

### 3. **Newsletter Service**
- ✅ Start with free tier (Buttondown/Substack)
- ✅ Only upgrade when necessary (>100 subscribers)
- ✅ Consider self-hosted alternatives (Listmonk - free but requires server)

**Savings:** $9-29/month (stay on free tier longer)

### 4. **GitHub Actions**
- ✅ Reduce build frequency (hourly → every 2-4 hours)
- ✅ Only build when Notion content changes (webhook trigger)
- ✅ Use self-hosted runners for free builds (requires always-on computer)

**Savings:** Stay within the free tier (an hourly build estimates ~1,440 of 2,000 minutes)

---

## 📈 Cost Growth Projections

### Year 1 (Months 1-12)
- **Months 1-3:** free-tier baseline (baseline features only)
- **Months 4-6:** $0.10/month (add AI summaries, light usage)
- **Months 7-9:** $9/month (upgrade Buttondown, 100+ subscribers)
- **Months 10-12:** $10/month (heavier AI usage)

### Year 2 (Subscriber Growth)
- **500 subscribers:** $9/month (Buttondown Standard)
- **1,000 subscribers:** $9/month (still on Standard)
- **2,000 subscribers:** $29/month (upgrade to Professional)

### Year 3 (Full Automation)
- **Add X API:** +$100/month (if newsletter automation justified)
- **Total:** $129-139/month

---

## 🎯 Recommended Approach

### **Phase 1: Stay Free ($0/month)**
- Use current features (v2.1.0)
- Write manual summaries in Notion
- Build audience organically
- **When to move on:** 50+ subscribers or 20+ articles/month

### **Phase 2: Add AI ($0.10-0.50/month)**
- Enable Claude API for auto-summaries
- Start with Haiku model (cheapest)
- Cache aggressively
- **When to move on:** AI saving you 2+ hours/month

### **Phase 3: Newsletter Service ($9/month)**
- Upgrade Buttondown when you hit 100 subscribers
- Keep manual curation for X/Twitter content
- **When to move on:** 500+ subscribers or monetization

### **Phase 4: Full Automation ($110/month)**
- Add X API Basic tier
- Automate newsletter generation
- **Only if:** Revenue > $200/month OR time savings > 10 hours/month

---

## 🔍 API Rate Limits Reference

### **Notion API**
- **Rate Limit:** 3 requests/second (average over 1 minute)
- **Max Burst:** ~50 requests in 10 seconds
- **Estimated Usage:** 1 request/hour (720/month)
- **Headroom:** 99.9% under limit ✅

### **Claude API (Haiku)**
- **Rate Limit:** 50 requests/minute (free tier)
- **Billing model:** usage-based (see the provider's pricing page)
- **Overage:** Just pay for what you use
- **Monitoring:** Dashboard at console.anthropic.com

### **X (Twitter) API**
- **Free Tier:** 1,500 tweet reads/month
- **Basic Tier:** 10,000 tweet reads/month + 50 posts/month
- **Reset:** Monthly
- **Overage:** Must upgrade tier (no pay-per-use)

### **GitHub Actions**
- **Free Tier:** 2,000 minutes/month
- **Estimated Usage:** ~1,440 minutes/month at hourly builds
- **Overage:** $0.008/minute (Linux runners)
- **Monitoring:** Settings → Billing → Actions

---

## 📞 Support Links

- **Anthropic Console:** [https://console.anthropic.com](https://console.anthropic.com)
- **X Developer Portal:** [https://developer.x.com](https://developer.x.com)
- **Buttondown Dashboard:** [https://buttondown.email](https://buttondown.email)
- **GitHub Billing:** [https://github.com/settings/billing](https://github.com/settings/billing)
- **Notion Settings:** [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)

---

## 💰 Bottom Line

**Baseline:** free-tier services only ✅

**Near Future (AI summaries):** $0.10-1.00/month - Essentially free ✅

**With Newsletter (<100 subscribers):** $0.30/month - Still negligible ✅

**Full Automation (500+ subscribers):** $110/month - Only when revenue justifies it

**Recommendation:** Start free, add features as your audience and revenue grow. The beauty of this architecture is that you can scale costs gradually based on actual usage and value.

---

**Questions about costs?** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open an issue on GitHub.
