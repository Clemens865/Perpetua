# 🤖 Claude SDK vs Agent SDK Analysis for Perpetua

**Date:** October 22, 2025
**Decision Required:** Which SDK to use for Perpetua's development

---

## 📊 Analysis Summary

### TL;DR Recommendation: **Stick with `@anthropic-ai/sdk` v0.67.0**

**Why:** The "Agent SDK" is not a separate package—it's **the standard SDK with agent-specific features** built in. We already have what we need!

---

## 🔍 Key Findings

### 1. **No Separate Agent SDK Package**
```bash
npm view @anthropic-ai/agent-sdk
# Result: 404 Not Found ❌
```

The "Claude Agent SDK" mentioned in documentation refers to:
- The standard `@anthropic-ai/sdk` package **with extended capabilities**
- Additional tooling in **Claude Code/Agent harness** (separate product)
- **Not a different npm package**

### 2. **Standard SDK Already Has Agent Features**

The `@anthropic-ai/sdk` (v0.67.0) **already includes:**

✅ **Extended Thinking**
- Opus 4 and Sonnet 4.5 support extended thinking
- Beta header: `interleaved-thinking-2025-05-14`
- Think between tool calls
- Summary or full thinking output

✅ **Computer Use**
- Updated tool: `computer_20250124`
- Beta header: `computer-use-2025-01-24`
- Advanced commands: hold_key, scroll, triple_click, wait
- OSWorld score: 61.4% (up from 42.2%)

✅ **Parallel Tool Use**
- Multiple tools in single request
- Concurrent execution

✅ **Streaming Responses**
- Server-sent events (SSE)
- Real-time token streaming

✅ **Tools & Function Calling**
- Custom tool definitions
- Automatic tool execution
- Tool result handling

---

## 📦 What We Currently Have

```json
{
  "@anthropic-ai/sdk": "^0.32.1"  // Currently installed
  // Latest: 0.67.0 (we're behind)
}
```

**We should upgrade to v0.67.0 for:**
- Latest extended thinking features
- Updated computer use capabilities
- Bug fixes and improvements

---

## 🎯 What Perpetua Needs

### Core Requirements
1. ✅ **Extended Thinking** - For deep reasoning in 8-stage cycle
2. ✅ **Streaming** - Real-time stage progress
3. ✅ **Tool Use** - Computer use for SEARCHING stage
4. ✅ **Context Management** - Long conversations
5. ✅ **Parallel Execution** - Multiple agents/stages

### All Available in Standard SDK ✅

---

## 🔄 Comparison Table

| Feature | Standard SDK | "Agent SDK" | Perpetua Needs? |
|---------|--------------|-------------|-----------------|
| **Core API** | ✅ | ✅ | ✅ Required |
| **Extended Thinking** | ✅ (v0.67.0) | ✅ | ✅ Required |
| **Computer Use** | ✅ (beta) | ✅ | ✅ Planned |
| **Streaming** | ✅ | ✅ | ✅ Required |
| **Tool Calling** | ✅ | ✅ | ✅ Required |
| **Parallel Tools** | ✅ | ✅ | ⚠️ Nice-to-have |
| **Agent Skills** | ❌ | ✅ | ⚠️ Future |
| **MCP Integration** | ❌ | ✅ | ⚠️ Future |
| **Context Compaction** | Manual | Automatic | ⚠️ Nice-to-have |
| **Hooks** | ❌ | ✅ | ❌ Not needed |
| **Subagents** | ❌ | ✅ | ⚠️ Future |

**Legend:**
- ✅ Required = Must have for Week 2
- ⚠️ Nice-to-have = Future enhancement
- ❌ Not needed = Don't need this feature

---

## 🚀 Recommendation

### **Use `@anthropic-ai/sdk` v0.67.0**

**Reasons:**
1. ✅ **Has everything we need** for Weeks 1-4
2. ✅ **Well-documented** and stable
3. ✅ **Active development** (latest: Oct 16, 2025)
4. ✅ **Extended Thinking support** built-in
5. ✅ **Computer Use beta** available
6. ✅ **No migration needed** - just upgrade version

### **When to Consider "Agent SDK" Features**

**After Week 8-12:**
- When we need **Agent Skills** (dynamic capability loading)
- When we want **MCP server integration** (tool extensibility)
- When we implement **Subagents** (parallel specialized agents)
- When we need **automatic context compaction**

**Note:** These features may be added to the standard SDK or remain CLI-specific.

---

## 💡 Action Plan

### Immediate (Week 2)
```bash
# Upgrade to latest SDK
npm install @anthropic-ai/sdk@latest
# or
pnpm update @anthropic-ai/sdk
```

**Current:** v0.32.1
**Latest:** v0.67.0
**Gap:** 35 versions behind!

### Implementation
1. ✅ Use standard SDK for all API calls
2. ✅ Enable Extended Thinking with beta header
3. ✅ Implement streaming for real-time updates
4. ⏳ Add Computer Use for SEARCHING stage (Week 4)
5. ⏳ Consider Agent SDK features for Week 8+

---

## 📚 Key SDK Features to Use

### 1. Extended Thinking (Priority 1)
```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 10000
  },
  messages: [...]
});

// Access thinking
console.log(response.thinking);
```

### 2. Streaming (Priority 1)
```typescript
const stream = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  stream: true,
  messages: [...]
});

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    console.log(event.delta.text);
  }
}
```

### 3. Tool Use (Priority 2)
```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web',
      input_schema: { type: 'object', properties: {...} }
    }
  ],
  messages: [...]
});
```

### 4. Computer Use (Priority 3 - Week 4)
```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  tools: [{
    type: 'computer_20250124',
    display_width_px: 1920,
    display_height_px: 1080,
    display_number: 1
  }],
  betas: ['computer-use-2025-01-24'],
  messages: [...]
});
```

---

## 🎯 Conclusion

### Decision: **Stay with `@anthropic-ai/sdk`**

**Summary:**
- ✅ Standard SDK has all features we need
- ✅ No separate "Agent SDK" package exists
- ✅ Extended Thinking & Computer Use already supported
- ✅ Just need to upgrade from v0.32.1 → v0.67.0
- ✅ Agent-specific features (Skills, MCP) can be added later

**Next Steps:**
1. Upgrade SDK to v0.67.0
2. Implement Extended Thinking in ExplorationEngine
3. Add streaming support for real-time updates
4. Plan Computer Use integration for Week 4

---

**Document Version:** 1.0
**Last Updated:** October 22, 2025
**Status:** ✅ Decision Made - Proceed with standard SDK
