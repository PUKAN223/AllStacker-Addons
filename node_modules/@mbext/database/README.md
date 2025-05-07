# Database Management for Minecraft Bedrock Development

[![npm version](https://badge.fury.io/js/%40mbext%2Fdatabase.svg)](https://www.npmjs.com/package/@mbext/database)

`@mbext/database` is a lightweight and flexible database solution for Minecraft Bedrock Edition (MCBE) add-ons. It provides a simple API for creating, reading, updating, and deleting data within your MCBE scripts.

## Features

- Dynamic property-based storage system
- Type-safe operations with TypeScript generics
- Case-insensitive search capabilities
- Complex filtering conditions (==, !=, >, <, >=, <=, contains, startsWith, endsWith)
- Customizable collection names
- Automatic ID generation
- Memory-efficient storage using JSON serialization

## Installation

To install `@mbext/database` in your minecraft add-on project, you have two options:

### Option 1: Use the package manager

1. Open a terminal and navigate to your project's root directory.
2. Run the following command to install the package:

```bash
npx @mbext/project init
```

1. Choose dependencies addons in prompt `@mbext/database`

### Option 2: Install via npm

1. Open a terminal and navigate to your project's root directory.
2. Run the following command to install the package:

```bash
npm i @mbext/database
```

3. Use the module with [ESBuild](https://jaylydev.github.io/posts/bundle-minecraft-scripts-esbuild/) or [Webpack](https://jaylydev.github.io/posts/scripts-bundle-minecraft/)

### Option 3: Clone the repository

1. Open a terminal and navigate to your project's root directory.
2. Run the following command to clone the repository:

```bash
git clone https://github.com/sausage404/mbext-database.git
```

3. Copy the `index.ts` and `index.d.ts` or `index.js` file from the cloned repository into your project's scripts folder.

## Basic Usage

Let's walk through how to use the database in your minecraft bedrock. We'll cover the essential operations with practical examples.

Create a Database Instance With TypeScript

```typescript
import * as mc from "@minecraft/server";
import Database, { CollectionValidator } from "@mbext/database";

// Define the structure of your data
interface User {
    id: string;
    name: string;
    age: number;
    money: number;
}

const validateUser: CollectionValidator<User>  = {
    id: (value) => value.length > 0,
    name: (value) => value.length > 0,
    age: (value) => value > 0,
    money: (value) => value >= 0
}

// Initialize the database
const database = new Database<User>("users", mc.world, validateUser);

// Create a new user
const newUser: User = {
    id: "user123",
    name: "John Doe",
    age: 30,
    money: 1000,
};

// Insert the new user into the database
database.create(newUser);

// Read all users from the database
const users = database.findMany().forEach((user) => {
    console.log(user);
});
```

## License

@mbext/database is released under the [GNU General Public License v3](https://github.com/sausage404/mbext-database/blob/main/LICENSE).

## Issues

If you encounter any problems or have suggestions, please file an issue on the GitHub repository.