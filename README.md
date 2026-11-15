# Help

This independently owned system application provides the rebuilt desktop's
Desktop, Account files and Documents guide. Its public `@webos/help` entrypoint
mounts synchronously and retains one topic selection per window. Buttons and
authorized `select`/`inspect` operations share the same implementation, with
explicit instance, session, resource and caller identities. Disposal removes
listeners and refuses late authorized operations. No account credentials, file
service, guest system or network request is needed by the guide itself.

The extracted `apps/system/help/` entrypoint and history are preserved unchanged.
That old guide describes the former beta and Linux guest filesystem. The new
entrypoint deliberately documents the rebuilt account-file workflow and uses
the current public mount contract; it does not load the old host interface.

Component checks use Node24:

```sh
node --experimental-vm-modules --test tests/help.test.mjs
```

Those focused checks use a synthetic DOM. Actual window hosting, keyboard input
and multiple-instance behavior require the parent's browser acceptance test.
Providing an authorized operation interface does not establish server-side
agent delegation.
