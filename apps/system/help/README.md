# Desktop Help

Help is a small, static window. It identifies the service as a beta, links to the support email, and explains that the Linux terminal's guest filesystem is temporary and separate from account files. It has no editable document, network connection, or account-file access. Closing the window releases the app instance.

`tests/help-workflow.test.mjs` checks the support link, wording, layout, and repeated open/close against a registered account. Desktop, phone-sized and 4K-sized layouts passed locally; desktop and phone-sized layouts passed on the live test site. These are viewport-emulation checks, not physical-device testing.
