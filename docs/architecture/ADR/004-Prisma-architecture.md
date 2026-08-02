# ADR-004: Prisma Architecture

## Status
Accepted

## Context
ToneCraft uses Prisma ORM for database access across the application. The PK:Schemas in prisma/schema.prisma define the models for user data, knowledge chunks, chat history, and billing metrics. The architecture relies on PostgreSQL as the primary database with pgvector for vector embeddings.

## Decision
Maintain Prisma as the database abstraction layer. Benefits include type-safe queries, automatic migration handling, and seamless integration with Next.js/TypeScript. The pgvector extension enables efficient vector similarity searches for the knowledge base.

## Alternatives Considered
1. TypeORM - Offers similar ORM features but requires more manual configuration for vector operations.
2. Prisma and raw SQL - Reduces abstraction but increases technical debt and query error risk.
3. MongoDB - Considered for scalability but adds complexity with schema changes and vector storage.

## Tradeoffs
- Pro: Clean APIs, type safety, powerful migration system, pgvector integration.
- Con: Limited direct control over SQL queries, potential performance tuning needs for large datasets.

## Consequences
All database interactions must follow Prisma conventions. Schema migrations must be versioned and tested. pgvector query performance depends on index configuration.