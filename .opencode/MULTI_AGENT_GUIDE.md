# Multi-Agent Usage Guide

This guide explains how to use OpenCode's multi-agent system for faster, more efficient development.

## Agent Overview

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **Athena** | Meta-agent with safety gates (bash:ask) | General tasks, plugin management, agent optimization |
| **Athena-GOD** | Unrestricted meta-agent (bash:allow) | System administration, unrestricted tasks |
| **Backend** | API development, databases, auth | Backend features, API endpoints, database work |
| **Frontend** | UI/UX, React, Vue, CSS, a11y | Frontend features, UI components, styling |
| **General** | Full-stack, DevOps, documentation | Cross-domain tasks, infrastructure, docs |
| **Hermes** | Learning new tools/frameworks | Learning new technologies, creating skill files |
| **Testing** | Unit, integration, e2e tests | Writing tests, coverage analysis, CI setup |
| **Explore** | Codebase exploration, analysis | Understanding code, architecture analysis |

## How to Use Multi-Agent System

### 1. Single Agent Usage

For simple tasks, use one agent directly:

```
# Example: Create a new API endpoint
→ Athena-GOD: "Create a REST API endpoint for user authentication"

# Example: Build a React component
→ Athena-GOD: "Create a login form component with validation"
```

### 2. Parallel Agent Usage (Recommended for Speed)

For complex tasks, launch multiple agents simultaneously:

```
# Example: Build a complete feature
→ Athena-GOD: "Build user authentication system"

This will automatically:
1. Dispatch to Backend agent for API endpoints
2. Dispatch to Frontend agent for login UI
3. Dispatch to Testing agent for auth tests
4. Dispatch to General agent for documentation
```

### 3. Sequential Agent Usage

For tasks that depend on each other:

```
# Example: Learn and implement
1. → Hermes: "Learn Next.js App Router patterns"
2. → Frontend: "Implement dashboard using App Router patterns"
3. → Testing: "Write tests for dashboard components"
```

### 4. Agent Chaining

Chain agents for complex workflows:

```
# Example: Full feature development
1. → Explore: "Analyze current auth system architecture"
2. → Backend: "Implement OAuth2 endpoints based on analysis"
3. → Frontend: "Create login UI with OAuth integration"
4. → Testing: "Write integration tests for OAuth flow"
5. → General: "Update API documentation"
```

## Practical Examples

### Example 1: Bug Fix

```
# Fast approach (parallel)
→ Athena-GOD: "Fix the login timeout bug"

Agents will work simultaneously:
- Backend: Investigate server-side timeout
- Frontend: Check client-side handling
- Testing: Reproduce and verify fix

# Sequential approach (if needed)
1. → Explore: "Find login timeout implementation"
2. → Backend: "Fix server-side timeout logic"
3. → Testing: "Write regression test"
```

### Example 2: New Feature

```
# Complete feature development
→ Athena-GOD: "Add user profile management feature"

Automatic dispatch:
- Backend: User CRUD endpoints, database schema
- Frontend: Profile page, edit form, avatar upload
- Testing: Unit tests, integration tests
- General: API documentation, setup guide
```

### Example 3: Refactoring

```
# Codebase refactoring
→ Athena-GOD: "Refactor authentication to use JWT"

Workflow:
1. → Explore: "Map current auth implementation"
2. → Backend: "Implement JWT authentication"
3. → Frontend: "Update auth context for JWT"
4. → Testing: "Update auth tests for JWT"
5. → General: "Update auth documentation"
```

## Best Practices

### 1. Be Specific in Your Requests

**Good**: "Create a REST API endpoint for user registration with email validation, password hashing, and JWT token generation"

**Bad**: "Make user stuff"

### 2. Use Parallel When Possible

For independent tasks, let agents work simultaneously:

```
# Good: Parallel work
→ Athena-GOD: "Build complete user management system"
(Agents work on different parts simultaneously)

# Bad: Unnecessary sequential
→ Backend: "Create user API"
→ Wait for completion
→ Frontend: "Create user UI"
→ Wait for completion
→ Testing: "Write user tests"
```

### 3. Provide Context

Help agents understand your project:

```
# Good: With context
→ Athena-GOD: "Add user authentication using Next.js App Router, Prisma ORM, and PostgreSQL"

# Bad: Without context
→ Athena-GOD: "Add authentication"
```

### 4. Let Agents Specialize

Don't ask Backend agent to do Frontend work. Let each agent focus on its domain.

### 5. Use Explore for Understanding

Before making changes, use Explore agent:

```
# Good: Understand first
1. → Explore: "Analyze current auth system"
2. → Backend: "Improve auth based on analysis"

# Bad: Jump straight in
→ Backend: "Rewrite entire auth system"
```

## Token Efficiency Tips

### 1. Use Shared Instructions

All agents now reference `AGENTS.md` for common instructions, reducing token usage by 40-60%.

### 2. Be Concise

Short, clear requests use fewer tokens:

```
# Good: 15 tokens
"Create user registration endpoint"

# Bad: 50 tokens
"Please create a new REST API endpoint that handles user registration with email validation and password hashing"
```

### 3. Batch Similar Tasks

Group related tasks together:

```
# Good: One request
"Create user CRUD endpoints: create, read, update, delete"

# Bad: Separate requests
"Create user create endpoint"
"Create user read endpoint"
"Create user update endpoint"
"Create user delete endpoint"
```

### 4. Use Project-Local Overrides

For project-specific patterns, create local agent overrides:

```
# Create .opencode/agents/backend.md with project-specific instructions
# This avoids repeating project conventions in every request
```

## Troubleshooting

### Agent Not Responding

1. Check if agent is available: `opencode agents list`
2. Verify agent permissions in `~/.config/opencode/agents/`
3. Check for syntax errors in agent files

### Slow Performance

1. Use parallel agents for independent tasks
2. Provide specific context to reduce back-and-forth
3. Use Explore agent before complex changes

### Wrong Agent Selected

1. Be more specific in your request
2. Mention the domain: "For the backend, create..."
3. Check agent routing in Athena's configuration

## Advanced Usage

### Custom Agent Workflows

Create project-specific workflows in `AGENTS.md`:

```markdown
## Project Workflow
1. Explore existing code
2. Implement changes
3. Write tests
4. Update documentation
5. Commit with conventional commits
```

### Agent Composition

Combine agents for complex tasks:

```
# Full-stack feature with infrastructure
→ Athena-GOD: "Deploy new feature with Docker, CI/CD, and monitoring"

This triggers:
- Backend: API implementation
- Frontend: UI implementation
- Testing: Test suite
- General: Docker, CI/CD, documentation
- DevOps: Deployment configuration
```

### Performance Monitoring

Track agent usage in `~/.config/opencode/improver/token-audit.md`:

```markdown
## Token Usage Patterns
- Backend agent: ~2000 tokens per request
- Frontend agent: ~1800 tokens per request
- Parallel usage: 40% faster than sequential
```

## Quick Reference

### Common Commands

```bash
# List available agents
opencode agents list

# Check agent status
opencode agents status

# View agent logs
opencode agents logs [agent-name]
```

### Agent Selection Guide

| Task Type | Primary Agent | Supporting Agents |
|-----------|---------------|-------------------|
| API Development | Backend | Testing, General |
| UI Components | Frontend | Testing, Explore |
| Database Work | Backend | Explore, Testing |
| DevOps/Infrastructure | General | Backend, Frontend |
| Learning New Tech | Hermes | Explore |
| Code Analysis | Explore | Backend, Frontend |
| Testing | Testing | Backend, Frontend |
| Documentation | General | Explore |

## Summary

- **Use parallel agents** for faster development
- **Be specific** in your requests
- **Let agents specialize** in their domains
- **Use Explore** to understand before changing
- **Leverage shared instructions** for token efficiency
- **Batch similar tasks** together

The multi-agent system is designed to make you more productive. Use it wisely!