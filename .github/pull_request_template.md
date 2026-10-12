## What changed

<!-- Describe the problem, the change, and its user or maintainer impact. -->

## Validation

<!-- List commands, devices, screenshots, or manual scenarios used to verify the change. -->

- [ ] Relevant automated checks pass.
- [ ] Documentation is updated when behavior, setup, compatibility, or protocol shape changed.
- [ ] Generated mirrors were updated through their canonical generator.
- [ ] No credentials, private logs, or unrelated generated artifacts are included.
- [ ] Hardware-only validation still needed is called out below.

## Platform and release impact

<!-- List affected targets and any compatibility, migration, security, or release implications. -->

<!-- For version/tag/upload work, include the decision table from RELEASING.md#choosing-a-version:
Target/routes | last public | uploaded/reserved + build | proposed + build | class + user-visible reason | shared milestone/applicability.
Fixing or completing an existing promise is patch regardless of implementation size.
A rebuild is not a new feature; shared minor milestones are not per-store counters.
For ordinary PRs, say "No release/version change" instead of inventing a bump. -->

- [ ] Apple/App Store invariants and the feature matrix remain correct, or this change does not affect them.
- [ ] Protocol compatibility remains correct, or the required compatibility documentation is included.

## AI assistance

<!-- If AI materially shaped the change, name the tool and summarize what you personally reviewed. -->
