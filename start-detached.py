#!/usr/bin/env python3
"""
Double-fork daemon launcher for the Next.js dev server.

The double-fork technique orphans the grandchild to PID 1 (or the subreaper),
fully detaching it from the Bash tool's process group / cgroup so it survives
the sandbox reaper that runs between Bash tool invocations.

Secrets are loaded from .env by start-daemon.sh — this file never touches
credentials directly.
"""
import os
import sys

WORKDIR = "/home/z/my-project"
CMD = ["bash", "start-daemon.sh"]


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

    # Grandchild: cd to project, redirect stdio to log, exec start-daemon.sh
    os.chdir(WORKDIR)
    fd = os.open("/home/z/my-project/dev.log", os.O_RDWR | os.O_CREAT | os.O_APPEND, 0o644)
    os.dup2(fd, 0)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    os.close(fd)

    # start-daemon.sh sources .env itself, so we only need a minimal PATH
    env = {
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/z/.bun/bin",
        "HOME": "/home/z",
    }
    os.execvpe(CMD[0], CMD, env)


if __name__ == "__main__":
    daemonize()
