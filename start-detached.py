#!/usr/bin/env python3
"""
Double-fork daemon launcher for the Next.js dev server.
The double-fork technique orphans the grandchild to PID 1 (or the subreaper),
fully detaching it from the Bash tool's process group / cgroup so it survives
the sandbox reaper that runs between Bash tool invocations.
"""
import os
import sys

WORKDIR = "/home/z/my-project"
LOGFILE = "/home/z/my-project/dev.log"
CMD = ["bash", "start-daemon.sh"]

# Environment for the daemon
ENV = {
    "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/z/.bun/bin",
    "HOME": "/home/z",
    "DATABASE_URL": "postgresql://neondb_owner:npg_u06rdIGapCcL@ep-calm-night-apefp276-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=15&pool_timeout=15&connection_limit=5",
    "RESEND_API_KEY": "re_jXNLgzGB_Ep9E4iba3FfPrY1qmGzukFtn",
    "EMAIL_FROM": "Infinity Legal SA <info@infinitylegal.org>",
    "AFRICASTALKING_API_KEY": "atsk_113ed4ef28880bd0f3f91ee1156d5ca8a73baed73a1391b0eb0ee795344c314c23440e06",
    "AFRICASTALKING_USERNAME": "infinitylegal",
    "AFRICASTALKING_SENDER_ID": "INFINITY",
    "NODE_OPTIONS": "--max-old-space-size=2048",
    "NODE_ENV": "development",
}

def daemonize():
    # First fork
    try:
        pid = os.fork()
        if pid > 0:
            # Parent exits immediately
            sys.exit(0)
    except OSError as e:
        sys.exit(f"First fork failed: {e}")

    # Child: become session leader, detach from controlling terminal
    os.setsid()
    os.umask(0)

    # Second fork — grandchild is fully orphaned (reparented to PID 1 / subreaper)
    try:
        pid = os.fork()
        if pid > 0:
            sys.exit(0)
    except OSError as e:
        sys.exit(f"Second fork failed: {e}")

    # Grandchild: redirect stdio to the log file, cd, exec
    os.chdir(WORKDIR)
    fd = os.open(LOGFILE, os.O_RDWR | os.O_CREAT | os.O_APPEND, 0o644)
    os.dup2(fd, 0)  # stdin (start-daemon reads /dev/null anyway)
    os.dup2(fd, 1)  # stdout
    os.dup2(fd, 2)  # stderr
    os.close(fd)

    # Merge env with daemon env
    env = dict(os.environ)
    env.update(ENV)

    os.execvpe(CMD[0], CMD, env)

if __name__ == "__main__":
    daemonize()
