# Data handling and production separation

The interface is prefilled with authored synthetic data. Email fields require the
reserved example domain, and registration codes are synthetic. These restrictions
do not guarantee that a name or address typed by a visitor is fictional. Please
use only the supplied examples and avoid entering personal data.

Request data stays in process memory on the local server, keyed by a browser cookie.
It is not written to files, a database, browser storage, analytics or application
logs. Restart, reset and expiry remove the applicable data. The cookie is HttpOnly
and SameSite=Strict; it isolates examples rather than identifying a real user.
The local API is not suitable for shared production use.

Document actions create fixed metadata records. No document bytes are accepted,
read, stored, downloaded or forwarded. Review decisions are simulated. No KYC,
screening, payments or account opening take place.

The production application remains in a separate private repository. Its secrets,
service accounts, operational settings, customer data, original documents and
history are excluded. This edition has no production URL or provider configuration.
Even private repositories must keep active credentials outside Git.

Development dependencies and installation can access package registries. The running
app has no external API, font, image or telemetry integration. The browser tests
assert same-origin requests during the individual workflow. This is not a guarantee
about every browser extension, operating system or third-party hosting environment.
