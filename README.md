# Mask Donor Gitcoin Subgraph

This subgraph filters out all Mask donors on Gitcoin.

## Setup

```bash
yarn
yarn codegen
yarn build
```

## Running Locally

Make sure to update package.json settings to point to your own graph account.

## Deployed Subgraphes

| Chain | URL |
| ----- | ------- |
| Mainnet | [mask-donor-gitcoin](https://thegraph.com/explorer/subgraph/dimensiondev/mask-donor-gitcoin) |
| Ropsten | N/A |
| Rinkeby | N/A |
| Kovan | N/A |
| Görli | N/A |

## Key Entity Overviews

### Donor

Cotains data about a gitcoin donor.

### Donation

Cotains data about a gitcoin donation.

### Token

Contains detailed data on a specific token.