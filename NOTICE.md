# NOTICE

dashi-ppt-skill (SanHsien maintenance fork)
Copyright 2026 SanHsien

This project is derived from [`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill), originally licensed under the GNU Affero General Public License v3.0.

Original work:

- Project: `dashi-ppt-skill`
- Author: chuspeeism (大师的AI小灶)
- License: AGPL-3.0
- Upstream: https://github.com/chuspeeism/dashi-ppt-skill

This repository keeps the original AGPL-3.0 license text in [`LICENSE`](LICENSE). Modifications, documentation, and future project-specific changes in this fork are also licensed under AGPL-3.0.

## License Notes

When redistributing this project or substantial parts of it:

- Keep [`LICENSE`](LICENSE) with the original AGPL-3.0 text.
- Keep attribution to `chuspeeism/dashi-ppt-skill` and chuspeeism.
- License your modifications under AGPL-3.0 unless a third-party file says otherwise.
- **AGPL network clause**: if you run a modified version of this project as a network service, you must offer the complete corresponding source of that modified version to its users.

This fork does not grant additional permissions beyond AGPL-3.0, and cannot: it is not the copyright holder.

## Proprietary component — do not extract

`skills/dashi-ppt/project/packages/html-deck-to-pptx` (the Dashi PPT export engine) is **proprietary**, not open source. It is licensed only as an integrated component of this skill. Extracting, copying, or redistributing it separately is prohibited without written permission from the copyright holder. See the `LICENSE` file inside that directory for the exact terms.

Historic versions of that package up to and including v0.2.7 were published under MIT; that grant applies to those historic versions only, not to the code shipped here.

## Project Scope

This repository ships an Agent Skill plus a local Node.js deck generator. It does not include customer documents, presentation content, API keys, or account credentials. Generated decks, uploads, and `node_modules/` are not committed.

## Credits

`dashi-ppt-skill` is a fork of `chuspeeism/dashi-ppt-skill` (AGPL-3.0). The product skill, theme library, layout system, deck generator, and plugin marketplace manifest belong to the upstream project.

This project is not affiliated with, endorsed by, or sponsored by Anthropic, OpenAI, Microsoft, ByteDance, or any vendor named in the skill or its documentation.

Do not commit secrets, customer decks, or live credentials.
