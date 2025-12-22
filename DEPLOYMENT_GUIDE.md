# Deployment Safety Guide

This guide documents the deployment strategy for Life OS, including branching, merging, auto-deployments, and rollback procedures to ensure production stability.

---

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [When to Merge](#when-to-merge)
3. [Vercel Auto-Deployments](#vercel-auto-deployments)
4. [Rollback Procedures](#rollback-procedures)
5. [Avoiding Breaking Changes](#avoiding-breaking-changes)
6. [Pre-Deployment Checklist](#pre-deployment-checklist)

---

## Branching Strategy

### Branch Types

Life OS follows a **feature branch workflow** with the following branch structure:

#### 1. `main` (Production Branch)
- **Purpose**: Production-ready code that's automatically deployed to Vercel
- **Protection**: Should be protected with branch protection rules
- **Deployment**: Auto-deploys to production on every push
- **Stability**: Must always be in a working state

#### 2. `claude/feature-name-xxxxx` (Feature Branches)
- **Purpose**: Development of new features or bug fixes
- **Naming**: `claude/<descriptive-name>-<session-id>`
- **Examples**:
  - `claude/setup-deployment-workflow-4REEq`
  - `claude/add-ratings-system-5XYZp`
  - `claude/fix-auth-bug-9ABCq`
- **Lifecycle**: Created from main → developed → merged back to main → deleted
- **Deployment**: Auto-deploys to preview URLs (not production)

#### 3. `staging` (Optional Staging Branch)
- **Purpose**: Pre-production testing environment
- **Protection**: Protected branch for final QA before production
- **Deployment**: Auto-deploys to staging environment
- **Usage**: Feature branches merge to staging first, then staging merges to main

### Branch Protection Rules

**Recommended settings for `main` branch:**
```
✓ Require pull request before merging
✓ Require status checks to pass
✓ Require branches to be up to date
✓ Require conversation resolution before merging
✗ Allow force pushes (NEVER)
✗ Allow deletions (NEVER)
```

**Why these matter:**
- **No force pushes**: Prevents rewriting history and breaking deployments
- **No direct pushes**: All changes go through PR review process
- **Status checks required**: Build must pass before merge
- **Up to date**: Prevents merge conflicts in production

---

## When to Merge

### Merge Criteria

Only merge to `main` when **ALL** of the following are true:

#### 1. ✅ Build Passes
```bash
npm run build
```
- No TypeScript errors
- No compilation errors
- All routes register correctly

#### 2. ✅ Testing Complete
- Manual testing of new features completed
- Existing functionality still works
- No console errors in browser
- Mobile responsiveness verified

#### 3. ✅ Code Review Complete (if team)
- At least one approval from team member
- All review comments addressed
- No unresolved conversations

#### 4. ✅ Environment Variables Set
- All required env vars documented in `.env.example`
- Production env vars configured in Vercel dashboard
- No hardcoded secrets or API keys in code

#### 5. ✅ Database Changes Handled
- Migration scripts created and tested
- Backward compatibility maintained
- Data loss prevention measures in place

#### 6. ✅ No Breaking Changes (or planned)
- API endpoint changes documented
- Frontend/backend compatibility maintained
- Deprecation warnings added if needed

### Merge Process

**Step 1: Update feature branch from main**
```bash
git checkout claude/feature-name-xxxxx
git fetch origin
git merge origin/main
# Resolve any conflicts
npm run build  # Verify build still works
```

**Step 2: Create Pull Request**
```bash
# Push your branch
git push -u origin claude/feature-name-xxxxx

# Create PR via GitHub CLI or web interface
gh pr create --base main --head claude/feature-name-xxxxx \
  --title "feat: Add ratings system" \
  --body "Adds comprehensive ratings system with perceived vs actual analysis..."
```

**Step 3: Wait for Vercel Preview Deployment**
- Vercel automatically creates a preview deployment for the PR
- Preview URL appears in PR comments
- Test the preview deployment thoroughly

**Step 4: Merge when ready**
```bash
# Via GitHub web interface (recommended):
# Click "Merge pull request" → "Confirm merge"

# Or via CLI:
gh pr merge <pr-number> --merge --delete-branch
```

**Step 5: Verify production deployment**
- Monitor Vercel dashboard for deployment status
- Visit production URL and verify changes
- Check for any errors in Vercel logs

### When NOT to Merge

**🚫 Never merge if:**
- Build is failing
- Untested code changes
- During high-traffic periods (if applicable)
- Breaking changes without migration plan
- Missing required environment variables
- Unresolved merge conflicts

**⚠️ Delay merging if:**
- Close to end of day (merge early in day for monitoring)
- Friday afternoon (avoid weekend incidents)
- Before holidays or team vacations
- During critical business events

---

## Vercel Auto-Deployments

### How It Works

Vercel automatically deploys your application based on Git activity:

#### Production Deployments
**Trigger**: Push to `main` branch
**URL**: Your configured production domain (e.g., `lifeos.vercel.app`)
**Process**:
1. Vercel detects push to `main`
2. Clones repository
3. Installs dependencies (`npm install`)
4. Runs build command (`npm run build`)
5. Deploys to production CDN
6. Updates DNS to point to new deployment
7. Sends deployment notification

**Duration**: Typically 1-3 minutes

#### Preview Deployments
**Trigger**: Push to any non-production branch or PR creation
**URL**: Unique preview URL (e.g., `lifeos-git-claude-feature-xxxxx.vercel.app`)
**Process**: Same as production, but deploys to preview URL
**Lifetime**: Available until branch is deleted

### Deployment Configuration

**Location**: `vercel.json` or Vercel dashboard

**Key Settings:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "OPENROUTER_API_KEY": "@openrouter-api-key"
  }
}
```

**Environment Variables:**
- **Development**: Set in `.env.local` (gitignored)
- **Preview**: Set in Vercel dashboard under "Preview" environment
- **Production**: Set in Vercel dashboard under "Production" environment

### Monitoring Deployments

**Vercel Dashboard:**
- Real-time build logs
- Deployment status (Building → Ready → Error)
- Performance metrics
- Error tracking

**GitHub Integration:**
- Deployment status checks on PRs
- Preview URLs in PR comments
- Build success/failure notifications

**Notifications:**
- Configure in Vercel → Project Settings → Notifications
- Options: Email, Slack, Discord, webhooks
- Events: Deployment started, succeeded, failed

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- **Critical bug** detected in production
- **Data corruption** or loss occurring
- **Performance degradation** (site unusable)
- **Security vulnerability** exposed
- **Complete site outage**

### Rollback Methods

#### Method 1: Vercel Dashboard (Fastest - Recommended)

**Steps:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the last known good deployment
3. Click the three dots (•••) → "Promote to Production"
4. Confirm the promotion
5. **Done**: Previous deployment is now live (takes ~30 seconds)

**Pros:**
- Fastest method (< 1 minute)
- No git operations needed
- Can rollback to any previous deployment
- No code changes required

**Cons:**
- Temporary fix only
- Still need to fix the bug in code

#### Method 2: Git Revert (Permanent Fix)

**For single commit causing issue:**
```bash
# Identify the bad commit
git log --oneline main

# Revert the specific commit
git revert <bad-commit-hash>

# Push to main (triggers new deployment)
git push origin main
```

**For multiple commits:**
```bash
# Revert a range of commits
git revert <oldest-bad-commit>^..<newest-bad-commit>

# Or revert to a specific point
git revert --no-commit <bad-commit-1> <bad-commit-2> <bad-commit-3>
git commit -m "Revert: Roll back broken feature"
git push origin main
```

**Pros:**
- Creates permanent fix in git history
- Maintains clean audit trail
- Can be reviewed via PR (if required)

**Cons:**
- Takes longer (5-10 minutes with build)
- Requires git knowledge
- May have merge conflicts

#### Method 3: Git Reset (Use with Caution)

**⚠️ Only use if you have force push access and understand risks**

```bash
# Find the last good commit
git log --oneline main

# Reset to that commit
git reset --hard <good-commit-hash>

# Force push (overwrites main)
git push --force origin main
```

**Pros:**
- Completely removes bad commits
- Clean history

**Cons:**
- **DANGEROUS**: Rewrites git history
- Breaks other developers' local repos
- Requires force push access
- Can cause data loss
- **NOT RECOMMENDED** for production

### Post-Rollback Actions

**Immediately after rollback:**
1. ✅ Verify production is working
2. ✅ Announce rollback to team (if applicable)
3. ✅ Document the issue (incident log)
4. ✅ Create GitHub issue for the bug

**Within 24 hours:**
1. 🔍 Investigate root cause
2. 🔧 Fix the bug in a new feature branch
3. 🧪 Test thoroughly
4. 📋 Create PR with fix
5. ✅ Merge after review and testing

**Incident Report Template:**
```markdown
# Incident Report: [Brief Description]

## Timeline
- **Detected**: YYYY-MM-DD HH:MM UTC
- **Rollback Started**: YYYY-MM-DD HH:MM UTC
- **Resolved**: YYYY-MM-DD HH:MM UTC
- **Duration**: X minutes

## Impact
- Users affected: [Number or "All"]
- Features impacted: [List]
- Data loss: [Yes/No - describe if yes]

## Root Cause
[Detailed explanation]

## Resolution
- Rollback method: [Vercel Dashboard / Git Revert]
- Rollback to: [Deployment ID or commit hash]

## Prevention
- [ ] Added test coverage
- [ ] Updated deployment checklist
- [ ] Documented edge case
- [ ] Improved monitoring
```

---

## Avoiding Breaking Changes

### Backend API Changes

#### Safe Changes (Non-Breaking)
✅ **Adding new endpoints**
```typescript
// Safe: New endpoint doesn't affect existing ones
app.get('/api/new-feature', handler);
```

✅ **Adding optional fields to requests**
```typescript
// Safe: Optional field with default
interface Request {
  required_field: string;
  optional_field?: string;  // Optional, won't break existing clients
}
```

✅ **Adding fields to responses**
```typescript
// Safe: Existing clients ignore new fields
return {
  existing_field: 'value',
  new_field: 'value',  // Clients will ignore if they don't expect it
};
```

✅ **Adding new query parameters (optional)**
```typescript
// Safe: Optional parameter
const filter = req.query.new_filter || 'default';
```

#### Breaking Changes (Dangerous)
🚫 **Removing endpoints**
```typescript
// BREAKING: Existing clients will get 404
// app.delete('/api/old-endpoint', handler);  // Don't remove!

// Instead: Deprecate first
app.delete('/api/old-endpoint', (req, res) => {
  console.warn('Deprecated endpoint called');
  res.setHeader('Warning', '299 - "Deprecated, use /api/new-endpoint"');
  // Still handle the request
});
```

🚫 **Changing endpoint URLs**
```typescript
// BREAKING
// Old: /api/users/:id
// New: /api/v2/users/:id

// Solution: Keep both, redirect old to new
app.get('/api/users/:id', (req, res) => {
  res.redirect(308, `/api/v2/users/${req.params.id}`);
});
```

🚫 **Removing or renaming fields**
```typescript
// BREAKING
interface OldResponse {
  user_name: string;  // Clients expect this
}

interface NewResponse {
  username: string;  // Different field name breaks clients
}

// Solution: Return both during transition
interface TransitionResponse {
  username: string;
  user_name: string;  // Deprecated but still works
}
```

🚫 **Changing field types**
```typescript
// BREAKING
// Old: { count: "5" }  // string
// New: { count: 5 }     // number

// Solution: Add new field or version API
{ count_string: "5", count: 5 }
```

🚫 **Making optional fields required**
```typescript
// BREAKING
interface OldRequest {
  field?: string;  // Optional
}

interface NewRequest {
  field: string;  // Now required - breaks existing clients!
}

// Solution: Keep optional, validate and provide default
```

### Frontend Breaking Changes

#### Safe Changes
✅ CSS-only visual updates
✅ Adding new components
✅ Adding new pages/routes
✅ Improving error messages
✅ Adding optional props to components

#### Breaking Changes
🚫 Removing pages/routes users may have bookmarked
🚫 Removing localStorage keys that affect state
🚫 Changing URL structure without redirects
🚫 Removing required props from public components

### Database Migration Safety

#### Safe Migrations
✅ **Adding new tables**
```sql
-- Safe: Doesn't affect existing tables
CREATE TABLE new_feature (...);
```

✅ **Adding nullable columns**
```sql
-- Safe: Existing rows get NULL
ALTER TABLE users ADD COLUMN bio TEXT;
```

✅ **Adding indexes**
```sql
-- Safe: Improves performance, doesn't change data
CREATE INDEX idx_users_email ON users(email);
```

#### Dangerous Migrations
🚫 **Dropping columns with data**
```sql
-- DANGEROUS: Data loss!
ALTER TABLE users DROP COLUMN important_data;

-- Solution: Multi-step process
-- 1. Stop using the column in code
-- 2. Deploy and wait
-- 3. Then drop the column in separate migration
```

🚫 **Renaming columns**
```sql
-- DANGEROUS: Breaks existing queries
ALTER TABLE users RENAME COLUMN old_name TO new_name;

-- Solution: Multi-step
-- 1. Add new column
-- 2. Copy data
-- 3. Update code to use new column
-- 4. Deploy
-- 5. Drop old column later
```

🚫 **Changing column types (without casting)**
```sql
-- DANGEROUS: May fail or lose data
ALTER TABLE users ALTER COLUMN age TYPE VARCHAR;

-- Solution: Create new column, migrate data, swap
```

### Strategy: Blue-Green Deployments

For risky changes, use a multi-phase rollout:

**Phase 1: Add new functionality (keep old)**
```typescript
// Support both old and new
if (req.body.new_field) {
  // Use new logic
} else {
  // Use old logic
}
```

**Phase 2: Deploy and monitor**
- Deploy with both old and new code paths
- Monitor for errors
- Verify new code path works

**Phase 3: Deprecate old functionality**
```typescript
// Warn when old path is used
if (!req.body.new_field) {
  console.warn('Using deprecated code path');
}
```

**Phase 4: Remove old functionality**
```typescript
// Only new code path remains
// Can safely remove old code
```

---

## Pre-Deployment Checklist

### Before Merging to Main

Use this checklist for every merge:

#### 🏗️ Build & Tests
- [ ] `npm run build` succeeds without errors
- [ ] No TypeScript errors
- [ ] All routes register correctly in build output
- [ ] No console errors in browser
- [ ] Manual testing completed for new features

#### 🔐 Security
- [ ] No API keys or secrets in code
- [ ] Environment variables documented in `.env.example`
- [ ] All env vars set in Vercel dashboard
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation on all user inputs

#### 📦 Dependencies
- [ ] `package.json` and `package-lock.json` in sync
- [ ] No unnecessary dependencies added
- [ ] Security vulnerabilities checked (`npm audit`)
- [ ] Large dependencies justified

#### 🗃️ Database
- [ ] Migration scripts created (if schema changes)
- [ ] Migrations tested locally
- [ ] Backward compatibility maintained
- [ ] No data loss risk
- [ ] Rollback plan for migrations

#### 📱 Frontend
- [ ] Mobile responsiveness verified
- [ ] Works in Chrome, Firefox, Safari
- [ ] No broken images or assets
- [ ] Loading states implemented
- [ ] Error states handled

#### 🔄 API
- [ ] No breaking changes to existing endpoints
- [ ] New endpoints documented
- [ ] Error handling implemented
- [ ] Rate limiting considered (if needed)
- [ ] Response times acceptable

#### 📝 Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] Comments added for complex logic
- [ ] Deployment notes added (if special steps needed)

#### 🚀 Deployment
- [ ] Preview deployment tested
- [ ] No breaking changes for existing users
- [ ] Rollback plan identified
- [ ] Deployment scheduled for low-traffic time
- [ ] Team notified of deployment (if applicable)

### After Deployment

- [ ] Production site loads correctly
- [ ] New features work in production
- [ ] No errors in Vercel logs
- [ ] Database connections working
- [ ] API endpoints responding
- [ ] Monitor for 15 minutes after deploy
- [ ] Check error tracking service (if configured)

---

## Emergency Contacts & Resources

### Vercel Dashboard
- **URL**: https://vercel.com/dashboard
- **Use for**: Deployments, rollbacks, logs, environment variables

### GitHub Repository
- **URL**: [Your repo URL]
- **Use for**: Code review, PR merges, branch management

### Supabase Dashboard
- **URL**: https://app.supabase.com
- **Use for**: Database, migrations, logs

### Monitoring
- **Vercel Analytics**: Real-time performance
- **Vercel Logs**: Runtime logs and errors
- **Browser DevTools**: Client-side errors

---

## Common Deployment Scenarios

### Scenario 1: Hotfix for Production Bug

**Situation**: Critical bug found in production, needs immediate fix

**Steps:**
1. **Rollback immediately** (Vercel dashboard method)
2. Create hotfix branch from last good commit
3. Make minimal fix
4. Test thoroughly
5. Create PR with "HOTFIX" label
6. Fast-track review if team
7. Merge and deploy
8. Monitor closely

**Timeline**: 15-30 minutes

### Scenario 2: Large Feature Release

**Situation**: New feature with database changes and API updates

**Steps:**
1. Create feature branch
2. Develop feature with comprehensive testing
3. Create migration scripts
4. Deploy to staging first (if available)
5. QA testing on staging
6. Create detailed PR with:
   - Feature description
   - Testing notes
   - Rollback plan
   - Migration steps
7. Schedule deployment for off-peak hours
8. Merge to main
9. Monitor closely for 1 hour
10. Announce feature to users

**Timeline**: 1-2 days

### Scenario 3: Dependency Update

**Situation**: Need to update npm packages for security

**Steps:**
1. Create branch: `claude/update-dependencies-xxxxx`
2. Update packages: `npm update` or `npm install package@latest`
3. Run `npm audit fix` for security issues
4. Test thoroughly (especially breaking changes)
5. Check build output for changes
6. Create PR with changelog
7. Merge after testing

**Timeline**: 1-2 hours

---

## Best Practices Summary

### ✅ DO
- Merge during business hours for monitoring
- Test preview deployments thoroughly
- Keep commits small and focused
- Write clear commit messages
- Document breaking changes
- Have rollback plan ready
- Monitor after deployment
- Use feature flags for risky features

### 🚫 DON'T
- Force push to main
- Merge untested code
- Deploy on Fridays
- Skip the build check
- Ignore TypeScript errors
- Hardcode secrets
- Make breaking changes without notice
- Merge late at night

---

## Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Vercel Deployment Docs**: https://vercel.com/docs/deployments
- **Git Best Practices**: https://git-scm.com/book/en/v2
- **Supabase Migrations**: https://supabase.com/docs/guides/database/migrations

---

## Questions or Issues?

If you encounter deployment issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set
4. Check Supabase connection
5. Review recent commits for breaking changes
6. Use rollback if needed
7. Document the issue for future reference

Remember: **When in doubt, rollback first, fix later.** Production stability is priority #1.
