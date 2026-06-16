# Incident Response Scripts

These scripts are sanitized copies of the operational scripts used during recovery.

Before running any script in production:

- review it line by line,
- replace placeholders with freshly rotated secrets only when needed,
- prefer running from a maintenance window,
- never commit real `.env` values or private keys.

Some scripts were one-off recovery actions and are kept for audit/replay reference, not as a polished deployment framework.