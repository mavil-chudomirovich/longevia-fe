---
name: codegraph
description: Use CodeGraph knowledge graph to trace call hierarchies, state management, API services, routes, and assess blast-radius impact in the vegan-support-application codebase.
---

# CodeGraph Skill for vegan-support-application

## When to use CodeGraph
When investigating architecture, understanding flows, finding symbol usages, or refactoring in `vegan-support-application`:
1. **Prioritize CodeGraph over multi-step grep/read**:
   - Use the MCP tool `codegraph_explore` or CLI `codegraph explore "<query>"`.
   - Examples:
     - Trace state & queries: `codegraph explore "where is useAuth or auth queries consumed"`
     - Trace API flow: `codegraph explore "how do components call api services"`
     - Check call hierarchy: `codegraph callers <symbol_name>`
     - Check callees: `codegraph callees <symbol_name>`
     - Check impact before refactoring: `codegraph impact <symbol_name>`
2. **Auto-sync & Freshness**:
   - CodeGraph watches file changes and auto-syncs.
   - Run `codegraph status` or `codegraph sync` if manual verification is needed.
