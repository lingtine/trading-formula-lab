/**
 * Schema loader utility
 */

import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

// Initialize AJV validator
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
  strictSchema: false
});

// Function to find schema file - works in both Node.js and Next.js
function findSchemaFile(): string {
  // Get the project root by finding node_modules or package.json
  let projectRoot = process.cwd();

  // If we're in apps/web, go up to project root
  if (projectRoot.endsWith('/apps/web') || projectRoot.endsWith('\\apps\\web')) {
    projectRoot = path.resolve(projectRoot, '../..');
  }

  // Try multiple possible locations
  const possiblePaths = [
    // From project root
    path.join(projectRoot, 'packages/core/schemas/smc-output.schema.json'),
    // From __dirname (works in normal Node.js)
    path.join(__dirname, '../schemas/smc-output.schema.json'),
    // From process.cwd() when running from root
    path.join(process.cwd(), 'packages/core/schemas/smc-output.schema.json'),
    // Absolute path resolution
    path.resolve(projectRoot, 'packages/core/schemas/smc-output.schema.json'),
  ];

  for (const schemaPath of possiblePaths) {
    try {
      const resolvedPath = path.resolve(schemaPath);
      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // If not found, throw error with all tried paths
  throw new Error(
    `Schema file not found. Tried: ${possiblePaths.map(p => path.resolve(p)).join(', ')}. ` +
    `Current working directory: ${process.cwd()}, __dirname: ${__dirname}, projectRoot: ${projectRoot}`
  );
}

// Load schema from file - lazy load to avoid issues during module initialization
let schemaDataCache: any = null;
let validateSmcOutputCache: any = null;

function loadSchemaData() {
  if (schemaDataCache) {
    return schemaDataCache;
  }

  try {
    const schemaPath = findSchemaFile();
    schemaDataCache = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // Remove $schema to avoid AJV trying to load it
    const schemaWithoutMeta = { ...schemaDataCache };
    delete (schemaWithoutMeta as any).$schema;
    schemaDataCache = schemaWithoutMeta;

    return schemaDataCache;
  } catch (error: any) {
    console.error('Error loading schema:', error);
    // Fallback: return empty schema to prevent crash
    schemaDataCache = { type: 'object', properties: {} };
    return schemaDataCache;
  }
}

// Lazy compile validator
function getValidator() {
  if (validateSmcOutputCache) {
    return validateSmcOutputCache;
  }
  const schema = loadSchemaData();
  validateSmcOutputCache = ajv.compile(schema);
  return validateSmcOutputCache;
}

// Export schema (lazy loaded)
export const smcOutputSchema = loadSchemaData();
export const validateSmcOutput = getValidator();

/**
 * Load schema for validation
 */
export function loadSchema() {
  return {
    schema: loadSchemaData(),
    validate: getValidator()
  };
}
