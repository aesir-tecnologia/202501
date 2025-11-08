# Claude AI Assistant Guide - LifeStint Project

**Purpose:** This document helps Claude understand the LifeStint project structure and documentation organization to provide better assistance.

---

## Quick Start

When helping with LifeStint, start by understanding the context:

1. **What is LifeStint?** → Read [01-product-overview-strategy.md](./01-product-overview-strategy.md)
2. **What needs to be built?** → Read [03-feature-requirements.md](./03-feature-requirements.md)
3. **How is it built?** → Read [04-technical-architecture.md](./04-technical-architecture.md)

---

## Documentation Structure

The LifeStint documentation is organized into 9 focused documents plus a master index:

### Core Documents

- **[00-master-index.md](./00-master-index.md)** - Navigation hub with reading paths by role
- **[01-product-overview-strategy.md](./01-product-overview-strategy.md)** - Product vision, business model, competitive analysis
- **[02-user-personas-flows.md](./02-user-personas-flows.md)** - User personas, onboarding, daily/weekly flows, accessibility
- **[03-feature-requirements.md](./03-feature-requirements.md)** - Complete feature specifications (most frequently referenced)
- **[04-technical-architecture.md](./04-technical-architecture.md)** - System design, tech stack, infrastructure
- **[05-database-schema.md](./05-database-schema.md)** - Database structure, RLS policies, functions
- **[06-implementation-guide.md](./06-implementation-guide.md)** - Complex technical implementations (timezone, offline sync, conflicts)
- **[07-development-roadmap.md](./07-development-roadmap.md)** - 10-phase development plan with dependencies
- **[08-success-metrics.md](./08-success-metrics.md)** - KPIs, analytics events, success criteria
- **[09-operations-compliance.md](./09-operations-compliance.md)** - Risks, monitoring, GDPR, browser compatibility, glossary

### Additional Resources

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Design tokens, component guidelines, UI patterns

---

## When to Load Which Documents

### For Feature Implementation

**Always Load:**
- [03-feature-requirements.md](./03-feature-requirements.md) - Feature specifications
- [04-technical-architecture.md](./04-technical-architecture.md) - Tech stack context

**If Database Work:**
- [05-database-schema.md](./05-database-schema.md) - Schema reference

**If Complex Feature:**
- [06-implementation-guide.md](./06-implementation-guide.md) - Implementation details

**If UI/UX Work:**
- [02-user-personas-flows.md](./02-user-personas-flows.md) - User flows
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design guidelines

### For Architecture Decisions

**Load:**
- [04-technical-architecture.md](./04-technical-architecture.md) - Current architecture
- [05-database-schema.md](./05-database-schema.md) - Database structure
- [06-implementation-guide.md](./06-implementation-guide.md) - Implementation patterns

### For Bug Fixes

**Load Based on Issue:**
- **Feature bug** → [03-feature-requirements.md](./03-feature-requirements.md)
- **Database issue** → [05-database-schema.md](./05-database-schema.md)
- **Sync/conflict issue** → [06-implementation-guide.md](./06-implementation-guide.md)
- **UI/UX issue** → [02-user-personas-flows.md](./02-user-personas-flows.md) + [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

### For Testing

**Load:**
- [03-feature-requirements.md](./03-feature-requirements.md) - Feature specs
- [02-user-personas-flows.md](./02-user-personas-flows.md) - User flows
- [07-development-roadmap.md](./07-development-roadmap.md) - Test requirements per phase

### For Documentation Updates

**Load:**
- [00-master-index.md](./00-master-index.md) - Document structure
- Relevant document being updated
- Check document dependencies before updating

---

**Last Updated:** October 24, 2025  
**Document Version:** 3.0

