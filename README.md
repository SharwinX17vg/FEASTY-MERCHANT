# FEASTY

FEASTY is a technology-driven food and business discovery ecosystem currently under active development.

The project is designed to connect merchants, businesses, customers, maps, intelligent services, and secure digital technologies through a unified platform.

## Project Status

FEASTY is currently under development.

The ecosystem is being actively built, integrated, tested, and improved. Some components and technologies are already implemented, while other capabilities are still under development or planned for future releases.

This repository represents an evolving development version and should not be considered the final production release.

## FEASTY Ecosystem

FEASTY is being developed as a connected ecosystem with multiple components.

### FEASTY MERCHANT

FEASTY MERCHANT is the merchant and business management platform.

It is being developed to support:

- Merchant and business onboarding
- Business and branch management
- Operating hours
- Business content
- Offers and promotions
- Content publishing workflows
- Approval and moderation
- Analytics
- Offer redemption
- Role-based access control
- Secure business and branch data management
- Public discovery APIs

FEASTY MERCHANT acts as the source of truth for merchant-owned business, branch, content, and offer data.

### FEASTYMAP

FEASTYMAP is the business discovery and map component of the FEASTY ecosystem.

It allows users to discover businesses and places through map-based and location-based experiences.

FEASTYMAP consumes published public Merchant data through the Merchant API rather than maintaining a separate merchant database.

The integration follows this architecture:

FEASTY MERCHANT
|
v
Public Merchant API
|
v
FEASTYMAP API Proxy
|
v
Merchant Adapter
|
v
Normalized FEASTYMAP Data
|
v
Map and Discovery Interface

Merchant-owned data remains controlled by FEASTY MERCHANT.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Leaflet
- OpenStreetMap

### Backend and Database

- Next.js API Routes
- REST APIs
- Supabase
- PostgreSQL
- Row Level Security (RLS)
- Authentication and Authorization

### Development and Engineering

- Git
- GitHub
- Automated Testing
- Type Checking
- Linting
- Build Validation
- API Validation
- Security-focused Development

## Artificial Intelligence and Machine Learning

AI and machine learning are part of the long-term FEASTY ecosystem.

The project is being developed toward intelligent capabilities such as:

- AI-assisted discovery
- Intelligent recommendations
- Personalization
- Machine learning integrations
- Intelligent automation

These capabilities are being developed progressively and may change as the ecosystem evolves.

## ScratchAI

ScratchAI is an evolving technology component within the wider FEASTY ecosystem.

It is currently under development and is intended to contribute to the intelligent capabilities of the platform.

Its implementation and integration will continue to evolve as development progresses.

## Cybersecurity

Cybersecurity is a major focus of the FEASTY ecosystem.

Security-focused development includes:

- Authentication and authorization
- Role-based access control
- Row Level Security
- Business and branch data isolation
- Input validation
- Runtime API response validation
- Secure public API design
- Audit logging
- Secure offer redemption
- Protection against unauthorized data mutations
- Server-side handling of private credentials
- Protection of private data
- Security hardening and abuse prevention

Security is treated as an ongoing part of development rather than a separate final-stage feature.

## Blockchain

Blockchain is part of the future technology exploration of the FEASTY ecosystem.

Potential applications are being explored in areas such as:

- Data verification
- Digital record integrity
- Trust and transparency
- Secure transaction-related systems
- Future decentralized capabilities

Blockchain-related functionality is currently under development or exploration and should not be considered fully implemented unless explicitly documented in the relevant module.

## Data Architecture

FEASTY follows a single-source-of-truth approach for merchant data.

The intended data flow is:

Merchant enters or updates information
|
v
FEASTY MERCHANT
|
v
Validation and Publishing Workflow
|
v
Authoritative Merchant Data
|
v
Public Merchant API
|
v
FEASTYMAP
|
v
Customer-facing Discovery

FEASTYMAP is a consumer of published Merchant data and does not maintain a separate manual merchant database.

## Core Development Principles

FEASTY is being developed with the following principles:

- Security-first development
- Single source of truth
- Minimal data duplication
- Validated APIs
- Strong business and branch isolation
- Production-oriented architecture
- Incremental development
- Automated testing
- Clear separation between live data and development fixtures
- Maintainable and scalable system design

## Current Development Areas

The current development roadmap includes:

- Merchant management
- Business discovery
- Map integration
- Public APIs
- Offers
- Content publishing
- Analytics
- Secure redemption
- Cybersecurity
- AI and Machine Learning
- ScratchAI
- Blockchain exploration
- Intelligent ecosystem features
- Additional platform integrations

## Testing and Validation

The projects are continuously tested and validated during development.

Typical validation includes:

```bash
npm test
npm run type-check
npm run lint
npm run build
git diff --check
