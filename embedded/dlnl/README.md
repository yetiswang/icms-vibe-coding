# DiscoveryLabNL Briefing

Live site: [discoverylabs.nl](https://discoverylabs.nl)

## About

DiscoveryLabNL is a national research infrastructure initiative being developed at the Institute for Complex Molecular Systems (ICMS), TU/e, for submission to the NWO Large-Scale Research Infrastructure (LSRI) programme in 2027. The infrastructure pursues AI-driven materials discovery through three integrated pillars: Self-Driving Laboratories (SDLs), Advanced Multimodal Characterisation, and an AI Core.

This repository contains the source for the briefing website, an internal-facing single-page application used to share context with TU/e stakeholders, national consortium partners, and NWO contact points during the positioning phase.

## Structure

This is a single-file HTML application. All content, styling, and interactive behaviour live in `index.html`. Fonts (Avenir Next LT Pro) and the favicon sit alongside it; imagery lives in `img/`.

Navigation flows through the following sections: landing, challenge, three-pillar architecture, pilot domains, campus consortium, national positioning, roadmap, team, stakeholder map, and contact.

The stakeholder map is an SVG visualisation with four concentric engagement tiers (Core, Committed, In Dialogue, Planned). Node metadata is held in a JavaScript `stakeholders` object and rendered dynamically.

## Deployment

The site is published through GitHub Pages from the `main` branch. A push to `main` triggers automatic deployment. The `CNAME` file maps the site to `discoverylabs.nl`.

## Contact

For questions about the initiative or requests to contribute:

- **Initiative Lead:** Yuyang Wang, ICMS / TU/e (y.wang8@tue.nl)
- **Scientific Lead:** Jan van Hest, ICMS / TU/e (j.c.m.v.hest@tue.nl)

## Status

Active development. Content is reviewed periodically against the master project charter and the NWO LSRI Landscape Inventory submission. The briefing reflects the current state of the consortium, governance, and infrastructure architecture as of the most recent commit.
