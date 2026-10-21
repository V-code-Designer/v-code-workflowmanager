export const errorOutputSchema = {
  "$schema": "https://json-schema.org/draft-07/schema",
  "type": "object",
  "required": [],
  "properties": {
    "namespace": {
      "type": "string",
      "description": ""
    },
    "inputData": {
      "type": "string",
      "description": ""
    },
    "propertyData": {
      "type": "string",
      "description": ""
    },
    "errorMessage": {
      "type": "string",
      "description": ""
    }
  }
};