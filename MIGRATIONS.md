# Alembic Migration Workflow

## Why we replaced startup schema mutation
- Runtime `ALTER TABLE` at app startup is race-prone under multi-instance deploys.
- Concurrent startups can attempt incompatible schema writes simultaneously.
- Schema changes were not versioned, so rollback/history and environment parity were unreliable.
- Drift accumulated between local/staging/production over time.

## Single migration source of truth
- Alembic config: `alembic.ini`
- Migration runtime: `alembic/env.py`
- Version history: `alembic/versions/*`
- SQLAlchemy metadata source: `models.Base.metadata`

## Commands
- Generate a revision:
  - `alembic revision -m "describe_change"`
- Autogenerate from ORM metadata:
  - `alembic revision --autogenerate -m "describe_change"`
- Upgrade:
  - `alembic upgrade head`
- Downgrade one step:
  - `alembic downgrade -1`
- Check current version:
  - `alembic current`

## Deployment pipeline (production-safe)
1. Deploy code package.
2. Run `alembic upgrade head` as a pre-start release step.
3. Start app process.
4. Health-check app and DB connectivity.

## Startup schema safety
- App verifies DB schema version at startup in production via `app/db/schema_guard.py`.
- If DB revision does not match expected head, startup fails fast with a clear error.
- Control flags:
  - `ENFORCE_SCHEMA_VERSION=true|false`
  - `REQUIRED_ALEMBIC_REVISION=<revision>` (optional override)

## Rollback strategy
- Schema downgrade scripts should be used only for reversible non-destructive changes.
- For production incidents, preferred rollback is:
  1. restore from managed DB snapshot / PITR
  2. redeploy previous application version
- This avoids destructive data-loss rollbacks in hot production paths.

## Multi-instance protection
- Migrations run once before app replicas scale out.
- App instances are prevented from starting on stale schema revisions.

