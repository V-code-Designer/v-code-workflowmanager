interface MappingRule {
  output: string;
  input: string;
}

interface JsonSchema {
  $schema?: string;
  type: string;
  required?: string[];
  properties: {
    [key: string]: {
      type: string;
      description?: string;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

/**
 * Transforms input data based on mapping rules and validates against output schema
 * @param inputData - Source JSON data
 * @param outputSchema - Target JSON schema defining the expected output structure
 * @param mapping - Array of mapping rules that define how to map input properties to output properties
 * @returns Transformed output data according to the mapping rules
 */
export function transformData(
  inputData: Record<string, any>,
  outputSchema: JsonSchema,
  mapping: MappingRule[]
): Record<string, any> {
  const outputData: Record<string, any> = {};

  // Process each mapping rule
  for (const rule of mapping) {
    const sourceKey = rule.output;
    const targetKey = rule.input;

    // Check if the source key exists in input data
    if (sourceKey in inputData) {
      const value = inputData[sourceKey];

      // Get the expected type from schema if available
      const propertySchema = outputSchema.properties?.[targetKey];

      if (propertySchema) {
        // Type conversion based on schema
        outputData[targetKey] = convertToType(value, propertySchema.type);
      } else {
        // If property not in schema, still map it
        outputData[targetKey] = value;
      }
    }
  }

  // Validate required fields
  if (outputSchema.required) {
    const missingFields = outputSchema.required.filter(
      field => !(field in outputData)
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields in output: ${missingFields.join(', ')}`
      );
    }
  }

  return outputData;
}

/**
 * Converts a value to the specified type
 */
function convertToType(value: any, type: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'integer':
      return parseInt(String(value), 10);
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    case 'array':
      return Array.isArray(value) ? value : [value];
    case 'object':
      return typeof value === 'object' ? value : {};
    default:
      return value;
  }
}
