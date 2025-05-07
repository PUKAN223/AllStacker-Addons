/**
 * @fileoverview
 * Type definitions for @mbext/database
 * See https://github.com/iduckphone/mbext-database for more details.
 *
 * @license GNU General Public License v3
 *
 * @author [sausage404] <parinya24dev@gmail.com>
 *
 * This file contains type definitions for the @mbext/database JavaScript library.
 * It provides TypeScript types for the library's public API.
 * 
 * To use these types, include this file in your TypeScript project and ensure
 * your TypeScript compiler is configured to recognize `.d.ts` files.
 */

/**
 * Type representing storage mechanisms that support dynamic property storage.
 * This can be implemented by various Minecraft entities and objects that need
 * to persist data across sessions.
 * 
 */
export type StorageType =
    import("@minecraft/server").World |
    import("@minecraft/server").Entity |
    import("@minecraft/server").Player |
    import("@minecraft/server").ItemStack;

/**
 * A collection of validation functions for checking field values in a document.
 * Each key in the validator corresponds to a field in type T, and its value is
 * a function that returns true if the field value is valid.
 * 
 * @template T - The type of documents being validated
 * 
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 * 
 * const validators: CollectionValidator<User> = {
 *   name: (value) => value.length > 0,
 *   age: (value) => value >= 0 && value <= 120
 * };
 * ```
 */
export type CollectionValidator<T> = {
    [K in keyof T]?: (value: T[K]) => boolean;
};

/** Direction for sorting query results */
export type SortDirection = 'asc' | 'desc';

/**
 * Configuration for sorting query results by multiple fields.
 * Each key is a field name and its value determines the sort direction.
 * 
 * @template T - The type of documents being sorted
 * 
 * @example
 * ```typescript
 * const sort: SortOptions<User> = {
 *   age: 'desc',
 *   name: 'asc'
 * };
 * ```
 */
export type SortOptions<T> = {
    [K in keyof T]?: SortDirection;
};

/**
 * Supported operators for filtering database queries.
 * Includes comparison, equality, and string matching operators.
 */
export type FilterOperator =
    | '==' | '!='  // Equality operators
    | '>' | '<' | '>=' | '<='  // Comparison operators
    | 'contains' | 'startsWith' | 'endsWith';  // String matching operators

/**
 * A condition used to filter documents in queries.
 * Combines a field, operator, and value to create a filter predicate.
 * 
 * @template T - The type of documents being filtered
 * 
 * @example
 * ```typescript
 * const condition: FilterCondition<User> = {
 *   field: 'age',
 *   operator: '>=',
 *   value: 18
 * };
 * ```
 */
export type FilterCondition<T> = {
    /** The field to compare */
    field: keyof T;
    /** The comparison operator */
    operator: FilterOperator;
    /** The value to compare against */
    value: any;
};

/**
 * Possible error types that can occur during database operations.
 * Each type represents a specific category of error for better error handling.
 */
export type DatabaseErrorType =
    | 'VALIDATION_FAILED'      // Document failed schema validation
    | 'INVALID_COLLECTION_NAME'// Collection name constraints not met
    | 'STORAGE_READ_ERROR'     // Failed to read from storage
    | 'STORAGE_WRITE_ERROR'    // Failed to write to storage
    | 'SERIALIZATION_ERROR'    // JSON parsing/stringifying failed
    | 'DOCUMENT_NOT_FOUND'     // Referenced document doesn't exist
    | 'DUPLICATE_KEY'          // Attempted to create duplicate ID
    | 'INVALID_UPDATE'         // Update operation failed
    | 'INVALID_QUERY'          // Query syntax or execution error
    | 'INITIALIZATION_ERROR'   // Database failed to initialize
    | 'IMPORT_ERROR'          // Data import failed
    | 'EXPORT_ERROR'          // Data export failed
    | 'UNKNOWN_ERROR';        // Unexpected errors

/**
 * Custom error class for database operations providing detailed error information.
 * Includes the error type, message, and optional details for debugging.
 * 
 * @example
 * ```typescript
 * throw new DatabaseError(
 *   'VALIDATION_FAILED',
 *   'Age must be positive',
 *   { field: 'age', value: -1 }
 * );
 * ```
 */
export class DatabaseError extends Error {
    /** The specific type of database error */
    readonly type: DatabaseErrorType;
    /** Additional error context for debugging */
    readonly details?: any;

    constructor(type: DatabaseErrorType, message: string, details?: any);

    /** Formats the error as a human-readable string */
    toString(): string;
    /** Converts the error to a plain object for serialization */
    toObject(): Record<string, any>;
}

/**
 * A lightweight document database implementation for Minecraft add-ons.
 * Provides CRUD operations, querying, and persistence using Minecraft's
 * dynamic property storage.
 * 
 * @template T - The type of documents stored in the collection
 * 
 * @example
 * ```typescript
 * interface Player {
 *   name: string;
 *   level: number;
 *   inventory: string[];
 * }
 * 
 * const db = new Database<Player>(
 *   'players',
 *   minecraft.world,
 *   {
 *     name: (v) => v.length > 0,
 *     level: (v) => v > 0
 *   }
 * );
 * ```
 */
export default class Database<T> {
    /**
     * Creates a new database collection.
     * 
     * @param collectionName - Unique name for the collection (1-16 chars)
     * @param storageType - Storage mechanism for persistence
     * @param collectionValidators - Optional validation rules for documents
     * @throws {DatabaseError} If collection name is invalid
     */
    constructor(
        collectionName: string,
        storageType: StorageType,
        collectionValidators?: CollectionValidator<T>
    );

    /**
     * Removes all documents from the collection.
     * 
     * @throws {DatabaseError} If clear operation fails
     */
    clear(): void;

    /**
     * Creates a new document in the collection.
     * 
     * @param data - The document to create
     * @returns The ID of the created document
     * @throws {DatabaseError} If validation fails or creation fails
     */
    create(data: T): string;

    /**
     * Creates multiple documents in a single operation.
     * 
     * @param items - Array of documents to create
     * @returns Array of created document IDs
     * @throws {DatabaseError} If any validation fails or creation fails
     */
    createMany(items: T[]): string[];

    /**
     * Updates an existing document by ID.
     * 
     * @param id - ID of document to update
     * @param data - Partial document with fields to update
     * @throws {DatabaseError} If document not found or validation fails
     */
    update(id: string, data: Partial<T>): void;

    /**
     * Updates multiple documents in a single operation.
     * 
     * @param updates - Array of updates with document IDs and update data
     * @throws {DatabaseError} If any document not found or validation fails
     */
    updateMany(updates: Array<{ id: string; data: Partial<T> }>): void;

    /**
     * Deletes a document by ID.
     * 
     * @param id - ID of document to delete
     * @throws {DatabaseError} If document not found or deletion fails
     */
    delete(id: string): void;

    /**
     * Deletes multiple documents in a single operation.
     * 
     * @param ids - Array of document IDs to delete
     * @throws {DatabaseError} If any document not found or deletion fails
     */
    deleteMany(ids: string[]): void;

    /**
     * Retrieves a document by its ID.
     * 
     * @param id - ID of document to retrieve
     * @returns Object containing document ID and data
     * @throws {DatabaseError} If document not found
     */
    findById(id: string): { id: string; data: T };

    /**
     * Finds the first document matching the predicate.
     * 
     * @param predicate - Function that returns true for matching documents
     * @returns First matching document with its ID
     * @throws {DatabaseError} If no matching document found
     */
    findOne(predicate: (value: T) => boolean): { id: string; data: T };

    /**
     * Finds all documents matching the predicate.
     * 
     * @param predicate - Optional function to filter documents
     * @returns Array of matching documents with their IDs
     */
    findMany(predicate?: (value: T) => boolean): Array<{ id: string; data: T }>;

    /**
     * Searches for documents containing the specified term.
     * Performs case-insensitive partial matching on specified fields.
     * 
     * @param term - Search term to match
     * @param fields - Optional array of fields to search (searches all if omitted)
     * @returns Array of matching documents with their IDs
     */
    findLike(term: string, fields?: (keyof T)[]): Array<{ id: string; data: T }>;

    /**
     * Queries documents using filter conditions with optional sorting and limit.
     * 
     * @param conditions - Array of filter conditions to apply
     * @param sort - Optional sorting configuration
     * @param limit - Optional maximum number of results
     * @returns Array of matching documents with their IDs
     * @throws {DatabaseError} If query is invalid or execution fails
     * 
     * @example
     * ```typescript
     * const results = db.query(
     *   [
     *     { field: 'level', operator: '>=', value: 10 },
     *     { field: 'name', operator: 'startsWith', value: 'A' }
     *   ],
     *   { level: 'desc' },
     *   5
     * );
     * ```
     */
    query(
        conditions: FilterCondition<T>[],
        sort?: SortOptions<T>,
        limit?: number
    ): Array<{ id: string; data: T }>;

    /**
     * Exports the entire collection as a JSON string.
     * 
     * @returns JSON string containing all documents
     * @throws {DatabaseError} If export fails
     */
    export(): string;

    /**
     * Imports data from a JSON string into the collection.
     * Replaces all existing documents with the imported data.
     * 
     * @param data - JSON string containing documents to import
     * @throws {DatabaseError} If import fails or validation fails
     */
    import(data: string): void;
}