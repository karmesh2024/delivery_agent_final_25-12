// This file defines TypeScript types and interfaces that represent the database schema.
// It exports types for tables and their respective columns to ensure type safety when interacting with the database.

export type User = {
    id: string;
    username: string;
    email: string;
    created_at: string;
};

export type Post = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: string;
};

export type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
};

// Add more types as needed for your database schema