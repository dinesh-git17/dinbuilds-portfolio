## PassFX

PassFX is a zero-knowledge, local-first terminal password manager built on a simple idea: your secrets should never leave your machine, and you should be able to understand exactly how they are protected.

It does not sync.  
It does not phone home.  
It does not recover forgotten passwords.

Those are not missing features. They are the design.

### What It Is

PassFX is a terminal-based password and secrets manager for developers and security-minded users who want full ownership of their data and their threat model.

It securely stores:
- Account credentials (emails, usernames, passwords)
- Credit card details and PINs
- API keys and environment variables
- 2FA recovery codes
- Encrypted notes and miscellaneous secrets

Everything is encrypted locally using standard, well-understood cryptography. The encrypted vault lives on disk, never touches a network, and is useless without the master password.

There are no accounts, no servers, and no background processes. PassFX runs when you invoke it and disappears when you close it. Like a good Unix tool, it does its job and then gets out of the way.

### Why It Exists

I do not trust cloud password managers.

Not because they are incompetent, but because they have to be trusted at all. Cloud sync expands the attack surface dramatically: breached infrastructure, compromised accounts, silent policy changes, and incentives that shift over time.

PassFX was built around a different assumption:

If someone wants your passwords, they should need physical access to your machine and your master password.

Anything less is an unacceptable compromise.

PassFX is for people who would rather take responsibility for their own security than outsource it to a company whose business model depends on trust.

### How It Works

At its core, PassFX is split by hard security boundaries.

The cryptographic core is completely isolated from the UI. Terminal screens and convenience features never implement or touch encryption logic directly.

Key mechanics:
- A master password derives an encryption key via PBKDF2-HMAC-SHA256
- 480,000 iterations with a unique 256-bit salt slow down brute-force attacks
- Secrets are encrypted using Fernet (AES-128-CBC with HMAC-SHA256)
- Vault writes are atomic so partial saves cannot corrupt data
- File permissions are locked down (0600 files, 0700 directories)
- File locking prevents concurrent corruption
- Failed unlock attempts trigger persistent exponential backoff

If you forget your master password, your data is cryptographically inaccessible. There is no recovery mechanism because any recovery mechanism would undermine the security model.

### Interface and Usability

PassFX is a TUI built with Textual.

Despite running in a terminal, it is designed to be comfortable to use:
- Keyboard-first navigation with mouse support
- Searchable lists and modal dialogs
- Masked secret fields by default
- Automatic clipboard clearing after 15 seconds
- Auto-locking when idle

The aesthetic is intentionally opinionated. Security tools do not need to look like tax software.

### Security Philosophy

PassFX treats security as a constraint, not a checklist.

What it protects against:
- Stolen vault files
- Accidental plaintext leaks
- Clipboard snooping
- Concurrent write corruption
- Partial writes during crashes or power loss

What it does not protect against:
- A fully compromised machine
- Weak master passwords
- Physical access while the vault is unlocked

This is explicit and documented. The threat model is not implied. It is written down, tested, and enforced.

### Testing and Trust

Security guarantees in PassFX are backed by tests, not claims.

The test suite verifies that:
- No plaintext secrets ever touch disk
- Cryptographic parameters cannot be silently weakened
- Logs and exceptions never leak sensitive data
- File permissions are enforced on every write
- Vault corruption fails safely, not silently

Some tests intentionally fail if security parameters change by even one unit. The tests are the specification.

### Technical Overview

- Language: Python 3.10+
- Interface: Textual (TUI)
- Cryptography: Fernet, PBKDF2-HMAC-SHA256
- Storage: Encrypted local files only
- Distribution: PyPI and Homebrew
- License: MIT

There is no network code anywhere in the project. Adding any would be a breaking philosophical change.

### Who It’s For

PassFX is not for everyone.

It is for:
- Developers who want auditable security tools
- Users who are comfortable with terminals
- People who value control over convenience
- Anyone who wants to understand their password manager instead of trusting it blindly

If you want seamless sync across devices with zero thought, you should use a different tool, and that is perfectly reasonable.

### Closing Note

PassFX exists to prove a point.

Security software should be understandable.  
Trust should be earned through code and tests.  
And your most sensitive data should belong to you, not a cloud.

PassFX does one thing well: it stores your secrets locally, encrypts them properly, and gets out of your way.

Everything else is noise.

Github: [PassFX Repo](https://github.com/dinesh-git17/passfx)
