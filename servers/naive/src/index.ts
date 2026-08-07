#!/usr/bin/env node
/**
 * MCP Server generated from OpenAPI spec for shortcut-api v3.0
 * Generated on: 2026-08-07T20:49:01.008Z
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";

import { z, ZodError } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

/**
 * Type definition for JSON objects
 */
type JsonObject = Record<string, any>;

/**
 * Interface for MCP Tool Definition
 */
interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    method: string;
    pathTemplate: string;
    executionParameters: { name: string, in: string }[];
    requestBodyContentType?: string;
    securityRequirements: any[];
    tags?: string[];
    deprecated?: boolean;
}

/**
 * Server configuration
 */
export const SERVER_NAME = "shortcut-api";
export const SERVER_VERSION = "3.0";
// Base URL for the API, can be set via environment variable or determined from OpenAPI spec
export const API_BASE_URL = process.env.API_BASE_URL || "https://api.app.shortcut.com";
console.error("API_BASE_URL is set to:", API_BASE_URL);

/**
 * MCP Server instance
 */
const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
);

/**
 * Map of tool definitions by name
 */
const toolDefinitionMap: Map<string, McpToolDefinition> = new Map([

  ["listCategories", {
    name: "listCategories",
    description: `List Categories returns a list of all Categories and their attributes.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/categories",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createCategory", {
    name: "createCategory",
    description: `Create Category allows you to create a new Category in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Category.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Category (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Category has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"type":{"description":"The type of entity this Category is associated with; currently Milestone or Objective is the only type of Category.","x-doc-skip":true}},"additionalProperties":false,"required":["name"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/categories",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getCategory", {
    name: "getCategory",
    description: `Get Category returns information about the selected Category.`,
    inputSchema: {"type":"object","properties":{"category-public-id":{"type":"number","format":"int64","description":"The unique ID of the Category."}},"required":["category-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/categories/{category-public-id}",
    executionParameters: [{"name":"category-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateCategory", {
    name: "updateCategory",
    description: `Update Category allows you to replace a Category name with another name. If you try to name a Category something that already exists, you will receive a 422 response.`,
    inputSchema: {"type":"object","properties":{"category-public-id":{"type":"number","format":"int64","description":"The unique ID of the Category you wish to update."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The new name of the Category.","type":"string"},"color":{"description":"The hex color to be displayed with the Category (for example, \"#ff0000\").","pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","minLength":1,"type":["string","null"]},"archived":{"description":"A true/false boolean indicating if the Category has been archived.","type":"boolean"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["category-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/categories/{category-public-id}",
    executionParameters: [{"name":"category-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteCategory", {
    name: "deleteCategory",
    description: `Delete Category can be used to delete any Category.`,
    inputSchema: {"type":"object","properties":{"category-public-id":{"type":"number","format":"int64","description":"The unique ID of the Category."}},"required":["category-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/categories/{category-public-id}",
    executionParameters: [{"name":"category-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listCategoryMilestones", {
    name: "listCategoryMilestones",
    description: `List Category Milestones returns a list of all Milestones with the Category.`,
    inputSchema: {"type":"object","properties":{"category-public-id":{"type":"number","format":"int64","description":"The unique ID of the Category."}},"required":["category-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/categories/{category-public-id}/milestones",
    executionParameters: [{"name":"category-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listCategoryObjectives", {
    name: "listCategoryObjectives",
    description: `Returns a list of all Objectives with the Category.`,
    inputSchema: {"type":"object","properties":{"category-public-id":{"type":"number","format":"int64","description":"The unique ID of the Category."}},"required":["category-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/categories/{category-public-id}/objectives",
    executionParameters: [{"name":"category-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listCustomFields", {
    name: "listCustomFields",
    description: `List Custom Fields`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/custom-fields",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getCustomField", {
    name: "getCustomField",
    description: `Get Custom Field`,
    inputSchema: {"type":"object","properties":{"custom-field-public-id":{"type":"string","format":"uuid","description":"The unique ID of the CustomField."}},"required":["custom-field-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/custom-fields/{custom-field-public-id}",
    executionParameters: [{"name":"custom-field-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateCustomField", {
    name: "updateCustomField",
    description: `Update Custom Field can be used to update the definition of a Custom Field. The order of items in the 'values' collection is interpreted to be their ascending sort order.To delete an existing enum value, simply omit it from the 'values' collection. New enum values may be created inline by including an object in the 'values' collection having a 'value' entry with no 'id' (eg. {'value': 'myNewValue', 'color_key': 'green'}).`,
    inputSchema: {"type":"object","properties":{"custom-field-public-id":{"type":"string","format":"uuid","description":"The unique ID of the CustomField."},"requestBody":{"type":"object","properties":{"enabled":{"description":"Indicates whether the Field is enabled for the Workspace. Only enabled fields can be applied to Stories.","type":"boolean"},"name":{"maxLength":63,"minLength":1,"description":"A collection of objects representing reporting periods for years.","type":"string"},"values":{"description":"A collection of EnumValue objects representing the values in the domain of some Custom Field.","type":"array","items":{"type":"object","properties":{"id":{"description":"The unique ID of an existing EnumValue within the CustomField's domain.","type":"string","format":"uuid"},"value":{"maxLength":63,"minLength":1,"description":"A string value within the domain of this Custom Field.","type":"string"},"color_key":{"description":"A color key associated with this EnumValue within the CustomField's domain.","type":["string","null"],"enum":["blue","purple","midnight-blue","orange","yellow-green","brass","gray","fuchsia","yellow","pink","sky-blue","green","red","black","slate","turquoise"]},"enabled":{"description":"Whether this EnumValue is enabled for its CustomField or not. Leaving this key out of the request leaves the current enabled state untouched.","type":"boolean"}},"additionalProperties":false}},"icon_set_identifier":{"maxLength":63,"minLength":1,"description":"A frontend-controlled string that represents the icon for this custom field.","type":"string"},"description":{"description":"A description of the purpose of this field.","type":"string"},"before_id":{"description":"The ID of the CustomField we want to move this CustomField before.","type":"string","format":"uuid"},"after_id":{"description":"The ID of the CustomField we want to move this CustomField after.","type":"string","format":"uuid"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["custom-field-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/custom-fields/{custom-field-public-id}",
    executionParameters: [{"name":"custom-field-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteCustomField", {
    name: "deleteCustomField",
    description: `Delete Custom Field`,
    inputSchema: {"type":"object","properties":{"custom-field-public-id":{"type":"string","format":"uuid","description":"The unique ID of the CustomField."}},"required":["custom-field-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/custom-fields/{custom-field-public-id}",
    executionParameters: [{"name":"custom-field-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listDocs", {
    name: "listDocs",
    description: `List Docs returns a list of Doc that the current user can read.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/documents",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createDoc", {
    name: "createDoc",
    description: `Creates a new Doc. Supports markdown or HTML input via content_format parameter. WARNING: if content_format is not supplied, \`content\` input defaults to html.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"title":{"maxLength":256,"minLength":1,"description":"The title for the new document.","type":"string"},"content":{"description":"The content for the new document.","type":"string"},"content_format":{"description":"Default content_format: html. Format of the content being sent. If 'markdown', content will be converted to HTML for storage. Storage is always HTML; this parameter just tells us what format you're sending.","type":"string","enum":["markdown","html"]}},"additionalProperties":false,"required":["title","content"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/documents",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getDoc", {
    name: "getDoc",
    description: `Get a Doc by its public ID with content. Use content_format=html query parameter to include HTML content.`,
    inputSchema: {"type":"object","properties":{"doc-public-id":{"type":"string","format":"uuid","description":"The Doc's public ID"},"content_format":{"type":"string","enum":["markdown","html"],"description":"Default content_format: markdown. Format of the content to return. If 'html', includes HTML content in response."}},"required":["doc-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/documents/{doc-public-id}",
    executionParameters: [{"name":"doc-public-id","in":"path"},{"name":"content_format","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateDoc", {
    name: "updateDoc",
    description: `Updates an existing Doc's title and/or content. Supports markdown or HTML input via content_format parameter. WARNING: if content_format is not supplied, \`content\` input defaults to html. When a document is updated: (1) For Tiptap-migrated docs, SSE events notify connected Tiptap clients to refresh. (2) For non-migrated docs, CKEditor cache is flushed and SSE events notify connected CKEditor users.`,
    inputSchema: {"type":"object","properties":{"doc-public-id":{"type":"string","format":"uuid","description":"The Doc's public ID"},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"title":{"maxLength":256,"minLength":1,"description":"The new title for the document","type":"string"},"content":{"description":"The new content for the document.","type":"string"},"content_format":{"description":"Default content_format: html. Format of content. For input: specifies format of provided content (defaults to 'html'). For output: controls response format - 'markdown' (default) or 'html' to include HTML content. Because output defaults to markdown, set 'markdown' when editing and writing back content you read from GET.","type":"string","enum":["markdown","html"]}},"additionalProperties":false,"description":"The JSON request body."}},"required":["doc-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/documents/{doc-public-id}",
    executionParameters: [{"name":"doc-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteDoc", {
    name: "deleteDoc",
    description: `Permanently deletes a Doc and its associated data. Requires admin access to the doc. When a document is deleted, connected clients will be notified via SSE events.`,
    inputSchema: {"type":"object","properties":{"doc-public-id":{"type":"string","format":"uuid","description":"The Doc's public ID"},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"content_format":{"description":"Default content_format: markdown. Format of the content to return. If 'html', includes HTML content in response.","type":"string","enum":["markdown","html"]}},"additionalProperties":false,"description":"The JSON request body."}},"required":["doc-public-id","requestBody"]},
    method: "delete",
    pathTemplate: "/api/v3/documents/{doc-public-id}",
    executionParameters: [{"name":"doc-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listDocumentEpics", {
    name: "listDocumentEpics",
    description: `Get a list of all Epics related to this Document.`,
    inputSchema: {"type":"object","properties":{"doc-public-id":{"type":"string","format":"uuid","description":"The public ID of the Document."}},"required":["doc-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/documents/{doc-public-id}/epics",
    executionParameters: [{"name":"doc-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["linkDocumentToEpic", {
    name: "linkDocumentToEpic",
    description: `Create a relationship between a Document and an Epic.`,
    inputSchema: {"type":"object","properties":{"doc-public-id":{"type":"string","format":"uuid","description":"The public ID of the Document."},"epic-public-id":{"type":"number","format":"int64","description":"The public ID of the Epic."}},"required":["doc-public-id","epic-public-id"]},
    method: "put",
    pathTemplate: "/api/v3/documents/{doc-public-id}/epics/{epic-public-id}",
    executionParameters: [{"name":"doc-public-id","in":"path"},{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["unlinkDocumentFromEpic", {
    name: "unlinkDocumentFromEpic",
    description: `Remove a relationship between a Document and an Epic.`,
    inputSchema: {"type":"object","properties":{"doc-public-id":{"type":"string","format":"uuid","description":"The public ID of the Document."},"epic-public-id":{"type":"number","format":"int64","description":"The public ID of the Epic."}},"required":["doc-public-id","epic-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/documents/{doc-public-id}/epics/{epic-public-id}",
    executionParameters: [{"name":"doc-public-id","in":"path"},{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEntityTemplates", {
    name: "listEntityTemplates",
    description: `List all the entity templates for the Workspace.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/entity-templates",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createEntityTemplate", {
    name: "createEntityTemplate",
    description: `Create a new entity template for the Workspace.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"description":"Request parameters for creating an entirely new entity template.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new entity template","type":"string"},"author_id":{"description":"The id of the user creating this template.","type":"string","format":"uuid"},"story_contents":{"description":"A map of story attributes this template populates.","type":"object","properties":{"description":{"description":"The description of the story.","type":"string"},"labels":{"description":"An array of labels to be populated by the template.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string"},"custom_fields":{"description":"An array of maps specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"file_ids":{"description":"An array of the attached file IDs to be populated.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"name":{"maxLength":512,"description":"The name of the story.","type":"string"},"epic_id":{"description":"The ID of the epic the to be populated.","type":["number","null"],"format":"int64"},"external_links":{"description":"An array of external links to be populated.","type":"array","items":{"type":"string"}},"sub_tasks":{"description":"An array of maps specifying the sub-tasks to create and link to the story.\nField only applicable when Sub-task feature is enabled.","type":"array","items":{"type":"object","properties":{"name":{"maxLength":512,"minLength":1,"description":"The name of the SubTask.","type":"string"},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"number","format":"int64"}},"additionalProperties":false,"required":["name"]}},"iteration_id":{"description":"The ID of the iteration the to be populated.","type":["number","null"],"format":"int64"},"tasks":{"description":"An array of tasks to be populated by the template.","type":"array","items":{"description":"Request parameters for specifying how to pre-populate a task through a template.","type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task description.","type":"string"},"complete":{"description":"True/false boolean indicating whether the Task is completed. Defaults to false.","type":"boolean"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Task.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Task has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["description"]}},"group_id":{"description":"The ID of the group to be populated.","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state to be populated.","type":["number","null"],"format":"int64"},"follower_ids":{"description":"An array of UUIDs for any Members listed as Followers.","type":"array","items":{"type":"string","format":"uuid"}},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"}},"estimate":{"description":"The numeric point estimate to be populated.","type":["number","null"],"format":"int64"},"project_id":{"description":"The ID of the project the story belongs to.","type":"number","format":"int64"},"linked_file_ids":{"description":"An array of the linked file IDs to be populated.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"}},"additionalProperties":false}},"additionalProperties":false,"required":["name","story_contents"]}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/entity-templates",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["disableStoryTemplates", {
    name: "disableStoryTemplates",
    description: `Disables the Story Template feature for the Workspace.`,
    inputSchema: {"type":"object","properties":{}},
    method: "put",
    pathTemplate: "/api/v3/entity-templates/disable",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["enableStoryTemplates", {
    name: "enableStoryTemplates",
    description: `Enables the Story Template feature for the Workspace.`,
    inputSchema: {"type":"object","properties":{}},
    method: "put",
    pathTemplate: "/api/v3/entity-templates/enable",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getEntityTemplate", {
    name: "getEntityTemplate",
    description: `Get Entity Template returns information about a given entity template.`,
    inputSchema: {"type":"object","properties":{"entity-template-public-id":{"type":"string","format":"uuid","description":"The unique ID of the entity template."}},"required":["entity-template-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/entity-templates/{entity-template-public-id}",
    executionParameters: [{"name":"entity-template-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateEntityTemplate", {
    name: "updateEntityTemplate",
    description: `Update an entity template's name or its contents.`,
    inputSchema: {"type":"object","properties":{"entity-template-public-id":{"type":"string","format":"uuid","description":"The unique ID of the template to be updated."},"requestBody":{"description":"Request parameters for changing either a template's name or any of\n  the attributes it is designed to pre-populate.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The updated template name.","type":"string"},"story_contents":{"description":"Updated attributes for the template to populate.","type":"object","properties":{"description":{"description":"The description of the story.","type":"string"},"labels":{"description":"An array of labels to be populated by the template.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string"},"custom_fields":{"description":"An array of maps specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"file_ids":{"description":"An array of the attached file IDs to be populated.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"name":{"description":"The name of the story.","type":"string"},"epic_id":{"description":"The ID of the epic the to be populated.","type":["number","null"],"format":"int64"},"external_links":{"description":"An array of external links to be populated.","type":"array","items":{"type":"string"}},"sub_tasks":{"description":"An array of maps specifying the sub-tasks to create and link to the story.\nField only applicable when Sub-task feature is enabled.","type":"array","items":{"type":"object","properties":{"name":{"maxLength":512,"minLength":1,"description":"The name of the SubTask.","type":"string"},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"number","format":"int64"}},"additionalProperties":false,"required":["name"]}},"iteration_id":{"description":"The ID of the iteration the to be populated.","type":["number","null"],"format":"int64"},"tasks":{"description":"An array of tasks to be populated by the template.","type":"array","items":{"description":"Request parameters for specifying how to pre-populate a task through a template.","type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task description.","type":"string"},"complete":{"description":"True/false boolean indicating whether the Task is completed. Defaults to false.","type":"boolean"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Task.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Task has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["description"]}},"group_id":{"description":"The ID of the group to be populated.","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state to be populated.","type":["number","null"],"format":"int64"},"follower_ids":{"description":"An array of UUIDs for any Members listed as Followers.","type":"array","items":{"type":"string","format":"uuid"}},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"}},"estimate":{"description":"The numeric point estimate to be populated.","type":["number","null"],"format":"int64"},"project_id":{"description":"The ID of the project the story belongs to.","type":["number","null"],"format":"int64"},"linked_file_ids":{"description":"An array of the linked file IDs to be populated.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"}},"additionalProperties":false}},"additionalProperties":false}},"required":["entity-template-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/entity-templates/{entity-template-public-id}",
    executionParameters: [{"name":"entity-template-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteEntityTemplate", {
    name: "deleteEntityTemplate",
    description: `Delete Entity Template`,
    inputSchema: {"type":"object","properties":{"entity-template-public-id":{"type":"string","format":"uuid","description":"The unique ID of the entity template."}},"required":["entity-template-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/entity-templates/{entity-template-public-id}",
    executionParameters: [{"name":"entity-template-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getEpicWorkflow", {
    name: "getEpicWorkflow",
    description: `Returns the Epic Workflow for the Workspace.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/epic-workflow",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEpics", {
    name: "listEpics",
    description: `List Epics returns a list of all Epics and their attributes.`,
    inputSchema: {"type":"object","properties":{"includes_description":{"type":"boolean","description":"A true/false boolean indicating whether to return Epics with their descriptions."}}},
    method: "get",
    pathTemplate: "/api/v3/epics",
    executionParameters: [{"name":"includes_description","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createEpic", {
    name: "createEpic",
    description: `Create Epic allows you to create a new Epic in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The Epic's description.","type":"string"},"labels":{"description":"An array of Labels attached to the Epic.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"completed_at_override":{"description":"A manual override for the time/date the Epic was completed.","type":"string","format":"date-time"},"objective_ids":{"description":"An array of IDs for Objectives to which this Epic is related.","type":"array","items":{"type":"number","format":"int64"}},"name":{"maxLength":256,"minLength":1,"description":"The Epic's name.","type":"string"},"planned_start_date":{"description":"The Epic's planned start date.","type":["string","null"],"format":"date-time"},"state":{"description":"`Deprecated` The Epic's state (to do, in progress, or done); will be ignored when `epic_state_id` is set.","type":"string","enum":["in progress","to do","done"]},"milestone_id":{"description":"`Deprecated` The ID of the Milestone this Epic is related to. Use `objective_ids`.","type":["number","null"],"format":"int64"},"requested_by_id":{"description":"The ID of the member that requested the epic.","type":"string","format":"uuid"},"epic_state_id":{"description":"The ID of the Epic State.","type":"number","format":"int64"},"started_at_override":{"description":"A manual override for the time/date the Epic was started.","type":"string","format":"date-time"},"group_id":{"description":"`Deprecated` The ID of the group to associate with the epic. Use `group_ids`.","type":["string","null"],"format":"uuid"},"updated_at":{"description":"Defaults to the time/date it is created but can be set to reflect another date.","type":"string","format":"date-time"},"follower_ids":{"description":"An array of UUIDs for any Members you want to add as Followers on this new Epic.","type":"array","items":{"type":"string","format":"uuid"}},"group_ids":{"description":"An array of UUIDS for Groups to which this Epic is related.","type":"array","items":{"type":"string","format":"uuid"}},"converted_from_story_id":{"description":"The ID of the Story that was converted to an Epic.","type":["number","null"],"format":"int64"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Epic.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Epic has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"deadline":{"description":"The Epic's deadline.","type":["string","null"],"format":"date-time"},"created_at":{"description":"Defaults to the time/date it is created but can be set to reflect another date.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["name"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/epics",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEpicsPaginated", {
    name: "listEpicsPaginated",
    description: `List Epics with pagination returns a paginated list of Epics and their attributes.`,
    inputSchema: {"type":"object","properties":{"includes_description":{"type":"boolean","description":"A true/false boolean indicating whether to return Epics with their descriptions."},"page":{"type":"number","format":"int64","description":"The page number to return, starting with 1. Defaults to 1."},"page_size":{"type":"number","format":"int64","description":"The number of Epics to return per page. Minimum 1, maximum 250, default 10."}}},
    method: "get",
    pathTemplate: "/api/v3/epics/paginated",
    executionParameters: [{"name":"includes_description","in":"query"},{"name":"page","in":"query"},{"name":"page_size","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getEpic", {
    name: "getEpic",
    description: `Get Epic returns information about the selected Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."}},"required":["epic-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateEpic", {
    name: "updateEpic",
    description: `Update Epic can be used to update numerous fields in the Epic. The only required parameter is Epic ID, which can be found in the Shortcut UI.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The Epic's description.","type":"string"},"archived":{"description":"A true/false boolean indicating whether the Epic is in archived state.","type":"boolean"},"labels":{"description":"An array of Labels attached to the Epic.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"completed_at_override":{"description":"A manual override for the time/date the Epic was completed.","type":["string","null"],"format":"date-time"},"objective_ids":{"description":"An array of IDs for Objectives to which this Epic is related.","type":"array","items":{"type":"number","format":"int64"}},"name":{"maxLength":256,"minLength":1,"description":"The Epic's name.","type":"string"},"planned_start_date":{"description":"The Epic's planned start date.","type":["string","null"],"format":"date-time"},"state":{"description":"`Deprecated` The Epic's state (to do, in progress, or done); will be ignored when `epic_state_id` is set.","type":"string","enum":["in progress","to do","done"]},"milestone_id":{"description":"`Deprecated` The ID of the Milestone this Epic is related to. Use `objective_ids`.","type":["number","null"],"format":"int64"},"requested_by_id":{"description":"The ID of the member that requested the epic.","type":"string","format":"uuid"},"epic_state_id":{"description":"The ID of the Epic State.","type":"number","format":"int64"},"started_at_override":{"description":"A manual override for the time/date the Epic was started.","type":["string","null"],"format":"date-time"},"group_id":{"description":"`Deprecated` The ID of the group to associate with the epic. Use `group_ids`.","type":["string","null"],"format":"uuid"},"follower_ids":{"description":"An array of UUIDs for any Members you want to add as Followers on this Epic.","type":"array","items":{"type":"string","format":"uuid"}},"group_ids":{"description":"An array of UUIDS for Groups to which this Epic is related.","type":"array","items":{"type":"string","format":"uuid"}},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this Epic.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Epic has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"before_id":{"description":"The ID of the Epic we want to move this Epic before.","type":"number","format":"int64"},"after_id":{"description":"The ID of the Epic we want to move this Epic after.","type":"number","format":"int64"},"deadline":{"description":"The Epic's deadline.","type":["string","null"],"format":"date-time"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["epic-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/epics/{epic-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteEpic", {
    name: "deleteEpic",
    description: `Delete Epic can be used to delete the Epic. The only required parameter is Epic ID.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."}},"required":["epic-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/epics/{epic-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEpicComments", {
    name: "listEpicComments",
    description: `Get a list of all Comments on an Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."}},"required":["epic-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}/comments",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createEpicComment", {
    name: "createEpicComment",
    description: `This endpoint allows you to create a threaded Comment on an Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The ID of the associated Epic."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"text":{"maxLength":100000,"description":"The comment text.","minLength":1,"type":"string"},"author_id":{"description":"The Member ID of the Comment's author. Defaults to the user identified by the API token.","type":"string","format":"uuid"},"created_at":{"description":"Defaults to the time/date the comment is created, but can be set to reflect another date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the comment is last updated, but can be set to reflect another date.","type":"string","format":"date-time"},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["text"],"description":"The JSON request body."}},"required":["epic-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/epics/{epic-public-id}/comments",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getEpicComment", {
    name: "getEpicComment",
    description: `This endpoint returns information about the selected Epic Comment.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The ID of the associated Epic."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."}},"required":["epic-public-id","comment-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateEpicComment", {
    name: "updateEpicComment",
    description: `This endpoint allows you to update a threaded Comment on an Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The ID of the associated Epic."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"text":{"description":"The updated comment text.","type":"string"}},"additionalProperties":false,"required":["text"],"description":"The JSON request body."}},"required":["epic-public-id","comment-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/epics/{epic-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createEpicCommentComment", {
    name: "createEpicCommentComment",
    description: `This endpoint allows you to create a nested Comment reply to an existing Epic Comment.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The ID of the associated Epic."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the parent Epic Comment."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"text":{"maxLength":100000,"description":"The comment text.","minLength":1,"type":"string"},"author_id":{"description":"The Member ID of the Comment's author. Defaults to the user identified by the API token.","type":"string","format":"uuid"},"created_at":{"description":"Defaults to the time/date the comment is created, but can be set to reflect another date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the comment is last updated, but can be set to reflect another date.","type":"string","format":"date-time"},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["text"],"description":"The JSON request body."}},"required":["epic-public-id","comment-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/epics/{epic-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteEpicComment", {
    name: "deleteEpicComment",
    description: `This endpoint allows you to delete a Comment from an Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The ID of the associated Epic."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."}},"required":["epic-public-id","comment-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/epics/{epic-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"epic-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEpicDocuments", {
    name: "listEpicDocuments",
    description: `Get a list of all Documents related to this Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."}},"required":["epic-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}/documents",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getEpicHealth", {
    name: "getEpicHealth",
    description: `Get the current health for the specified Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."}},"required":["epic-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}/health",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createEpicHealth", {
    name: "createEpicHealth",
    description: `Create a new health status for the specified Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"status":{"description":"The health status of the Epic.","type":"string","enum":["At Risk","On Track","Off Track","No Health"]},"text":{"description":"The description of the Health status.","type":"string"}},"additionalProperties":false,"required":["status"],"description":"The JSON request body."}},"required":["epic-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/epics/{epic-public-id}/health",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEpicHealths", {
    name: "listEpicHealths",
    description: `List the history of health statuses for the specified Epic, most recent first.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."}},"required":["epic-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}/health-history",
    executionParameters: [{"name":"epic-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listEpicStories", {
    name: "listEpicStories",
    description: `Get a list of all Stories in an Epic.`,
    inputSchema: {"type":"object","properties":{"epic-public-id":{"type":"number","format":"int64","description":"The unique ID of the Epic."},"includes_description":{"type":"boolean","description":"A true/false boolean indicating whether to return Stories with their descriptions."}},"required":["epic-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/epics/{epic-public-id}/stories",
    executionParameters: [{"name":"epic-public-id","in":"path"},{"name":"includes_description","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getExternalLinkStories", {
    name: "getExternalLinkStories",
    description: `Get Stories which have a given External Link associated with them.`,
    inputSchema: {"type":"object","properties":{"external_link":{"type":"string","maxLength":2048,"pattern":"^https?://.+$","description":"The external link associated with one or more stories."}},"required":["external_link"]},
    method: "get",
    pathTemplate: "/api/v3/external-link/stories",
    executionParameters: [{"name":"external_link","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listFiles", {
    name: "listFiles",
    description: `List Files returns a list of all UploadedFiles in the workspace.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/files",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["uploadFiles", {
    name: "uploadFiles",
    description: `Upload Files uploads one or many files and optionally associates them with a story.
   Use the multipart/form-data content-type to upload.
   Each \`file\` key should contain a separate file.
   Each UploadedFile's name comes from the Content-Disposition header "filename" directive for that field.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"string","description":"Request body (content type: multipart/form-data)"}}},
    method: "post",
    pathTemplate: "/api/v3/files",
    executionParameters: [],
    requestBodyContentType: "multipart/form-data",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getFile", {
    name: "getFile",
    description: `Get File returns information about the selected UploadedFile.`,
    inputSchema: {"type":"object","properties":{"file-public-id":{"type":"number","format":"int64","description":"The File’s unique ID."}},"required":["file-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/files/{file-public-id}",
    executionParameters: [{"name":"file-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateFile", {
    name: "updateFile",
    description: `Update File updates the properties of an UploadedFile (but not its content).`,
    inputSchema: {"type":"object","properties":{"file-public-id":{"type":"number","format":"int64","description":"The unique ID assigned to the file in Shortcut."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":4096,"description":"The description of the file.","type":"string"},"created_at":{"description":"The time/date that the file was uploaded.","type":"string","format":"date-time"},"updated_at":{"description":"The time/date that the file was last updated.","type":"string","format":"date-time"},"name":{"maxLength":1024,"minLength":1,"description":"The name of the file.","type":"string"},"uploader_id":{"description":"The unique ID assigned to the Member who uploaded the file to Shortcut.","type":"string","format":"uuid"},"external_id":{"maxLength":2048,"description":"An additional ID that you may wish to assign to the file.","type":"string"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["file-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/files/{file-public-id}",
    executionParameters: [{"name":"file-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteFile", {
    name: "deleteFile",
    description: `Delete File deletes a previously uploaded file.`,
    inputSchema: {"type":"object","properties":{"file-public-id":{"type":"number","format":"int64","description":"The File’s unique ID."}},"required":["file-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/files/{file-public-id}",
    executionParameters: [{"name":"file-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listGroups", {
    name: "listGroups",
    description: `A group in our API maps to a "Team" within the Shortcut Product. A Team is a collection of Users that can be associated to Stories, Epics, and Iterations within Shortcut.`,
    inputSchema: {"type":"object","properties":{"archived":{"type":"boolean","description":"Filter groups by their archived state. If true, returns only archived groups. If false, returns only unarchived groups. If not provided, returns all groups"}}},
    method: "get",
    pathTemplate: "/api/v3/groups",
    executionParameters: [{"name":"archived","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createGroup", {
    name: "createGroup",
    description: `Create Group`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","properties":{"description":{"maxLength":4096,"description":"The description of the Group.","type":"string"},"card_aging_mode":{"description":"The card aging mode for stories in this Group: \"gradual\" (fixed fade steps at 1, 2, and 4 weeks), \"immediate\", or \"off\" (explicitly disabled for this Group). Set to null to inherit the Workspace default.","type":["string","null"],"enum":["off","gradual","immediate"]},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The color you wish to use for the Group in the system.","minLength":1,"type":"string"},"card_aging_threshold_days":{"description":"The number of days an in-progress Story can go without activity before it is considered stale. Required when card_aging_mode is \"immediate\"; not allowed otherwise.","type":["number","null"],"format":"int64"},"display_icon_id":{"description":"The Icon id for the avatar of this Group.","type":"string","format":"uuid"},"mention_name":{"maxLength":63,"minLength":1,"description":"The mention name of this Group.","type":"string"},"name":{"maxLength":63,"minLength":1,"description":"The name of this Group.","type":"string"},"color_key":{"description":"The color key you wish to use for the Group in the system.","type":"string","enum":["blue","purple","midnight-blue","orange","yellow-green","brass","gray","fuchsia","yellow","pink","sky-blue","green","red","black","slate","turquoise"]},"member_ids":{"description":"The Member ids to add to this Group.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_ids":{"description":"The Workflow ids to add to the Group.","type":"array","items":{"type":"number","format":"int64"}}},"additionalProperties":false,"required":["mention_name","name"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/groups",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getGroup", {
    name: "getGroup",
    description: `Get Group`,
    inputSchema: {"type":"object","properties":{"group-public-id":{"type":"string","format":"uuid","description":"The unique ID of the Group."}},"required":["group-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/groups/{group-public-id}",
    executionParameters: [{"name":"group-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateGroup", {
    name: "updateGroup",
    description: `Update Group`,
    inputSchema: {"type":"object","properties":{"group-public-id":{"type":"string","format":"uuid","description":"The unique ID of the Group."},"requestBody":{"type":"object","properties":{"description":{"maxLength":4096,"description":"The description of this Group.","type":"string"},"archived":{"description":"Whether or not this Group is archived.","type":["boolean","null"]},"card_aging_mode":{"description":"The card aging mode for stories in this Group: \"gradual\" (fixed fade steps at 1, 2, and 4 weeks), \"immediate\", or \"off\" (explicitly disabled for this Group). Set to null to inherit the Workspace default.","type":["string","null"],"enum":["off","gradual","immediate"]},"color":{"description":"The color you wish to use for the Group in the system.","pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","minLength":1,"type":["string","null"]},"card_aging_threshold_days":{"description":"The number of days an in-progress Story can go without activity before it is considered stale. Required when card_aging_mode is \"immediate\"; not allowed otherwise.","type":["number","null"],"format":"int64"},"display_icon_id":{"description":"The Icon id for the avatar of this Group.","type":["string","null"],"format":"uuid"},"mention_name":{"maxLength":63,"minLength":1,"description":"The mention name of this Group.","type":"string"},"name":{"maxLength":63,"minLength":1,"description":"The name of this Group.","type":"string"},"color_key":{"description":"The color key you wish to use for the Group in the system.","type":"string","enum":["blue","purple","midnight-blue","orange","yellow-green","brass","gray","fuchsia","yellow","pink","sky-blue","green","red","black","slate","turquoise"]},"default_workflow_id":{"description":"The ID of the default workflow for stories created in this group.","type":["number","null"],"format":"int64"},"member_ids":{"description":"The Member ids to add to this Group.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_ids":{"description":"The Workflow ids to add to the Group.","type":"array","items":{"type":"number","format":"int64"}}},"additionalProperties":false,"description":"The JSON request body."}},"required":["group-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/groups/{group-public-id}",
    executionParameters: [{"name":"group-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listGroupStories", {
    name: "listGroupStories",
    description: `List the Stories assigned to the Group. (By default, limited to 1,000).`,
    inputSchema: {"type":"object","properties":{"group-public-id":{"type":"string","format":"uuid","description":"The unique ID of the Group."},"limit":{"type":"number","format":"int64","description":"The maximum number of results to return. (Defaults to 1000, max 1000)"},"offset":{"type":"number","format":"int64","description":"The offset at which to begin returning results. (Defaults to 0)"}},"required":["group-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/groups/{group-public-id}/stories",
    executionParameters: [{"name":"group-public-id","in":"path"},{"name":"limit","in":"query"},{"name":"offset","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateHealth", {
    name: "updateHealth",
    description: `Update an existing health status by its ID.`,
    inputSchema: {"type":"object","properties":{"health-public-id":{"type":"string","format":"uuid","description":"The unique ID of the Health record."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"status":{"description":"The health status of the Epic.","type":"string","enum":["At Risk","On Track","Off Track","No Health"]},"text":{"description":"The description of the Health status.","type":"string"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["health-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/health/{health-public-id}",
    executionParameters: [{"name":"health-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createGenericIntegration", {
    name: "createGenericIntegration",
    description: `Create Generic Integration`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","properties":{"webhook_url":{"pattern":"^https?://.+$","maxLength":2048,"type":"string"},"secret":{"maxLength":128,"minLength":1,"type":"string"}},"additionalProperties":false,"required":["webhook_url"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/integrations/webhook",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getGenericIntegration", {
    name: "getGenericIntegration",
    description: `Get Generic Integration`,
    inputSchema: {"type":"object","properties":{"integration-public-id":{"type":"number","format":"int64"}},"required":["integration-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/integrations/webhook/{integration-public-id}",
    executionParameters: [{"name":"integration-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteGenericIntegration", {
    name: "deleteGenericIntegration",
    description: `Delete Generic Integration`,
    inputSchema: {"type":"object","properties":{"integration-public-id":{"type":"number","format":"int64"}},"required":["integration-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/integrations/webhook/{integration-public-id}",
    executionParameters: [{"name":"integration-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listIterations", {
    name: "listIterations",
    description: `List Iterations`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/iterations",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createIteration", {
    name: "createIteration",
    description: `Create Iteration`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","properties":{"follower_ids":{"description":"An array of UUIDs for any Members you want to add as Followers.","type":"array","items":{"type":"string","format":"uuid"}},"group_ids":{"description":"An array of UUIDs for any Groups you want to add as Followers. Currently, only one Group association is presented in our web UI.","type":"array","items":{"type":"string","format":"uuid"}},"labels":{"description":"An array of Labels attached to the Iteration.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"description":{"maxLength":100000,"description":"The description of the Iteration.","type":"string"},"name":{"maxLength":256,"minLength":1,"description":"The name of this Iteration.","type":"string"},"start_date":{"minLength":1,"description":"The date this Iteration begins, e.g. 2019-07-01.","type":"string"},"end_date":{"minLength":1,"description":"The date this Iteration ends, e.g. 2019-07-01.","type":"string"}},"additionalProperties":false,"required":["name","start_date","end_date"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/iterations",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["disableIterations", {
    name: "disableIterations",
    description: `Disables Iterations for the current workspace`,
    inputSchema: {"type":"object","properties":{}},
    method: "put",
    pathTemplate: "/api/v3/iterations/disable",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["enableIterations", {
    name: "enableIterations",
    description: `Enables Iterations for the current workspace`,
    inputSchema: {"type":"object","properties":{}},
    method: "put",
    pathTemplate: "/api/v3/iterations/enable",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getIteration", {
    name: "getIteration",
    description: `Get Iteration`,
    inputSchema: {"type":"object","properties":{"iteration-public-id":{"type":"number","format":"int64","description":"The unique ID of the Iteration."}},"required":["iteration-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/iterations/{iteration-public-id}",
    executionParameters: [{"name":"iteration-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateIteration", {
    name: "updateIteration",
    description: `Update Iteration`,
    inputSchema: {"type":"object","properties":{"iteration-public-id":{"type":"number","format":"int64","description":"The unique ID of the Iteration."},"requestBody":{"type":"object","properties":{"follower_ids":{"description":"An array of UUIDs for any Members you want to add as Followers.","type":"array","items":{"type":"string","format":"uuid"}},"group_ids":{"description":"An array of UUIDs for any Groups you want to add as Followers. Currently, only one Group association is presented in our web UI.","type":"array","items":{"type":"string","format":"uuid"}},"labels":{"description":"An array of Labels attached to the Iteration.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"description":{"maxLength":100000,"description":"The description of the Iteration.","type":"string"},"name":{"maxLength":256,"minLength":1,"description":"The name of this Iteration","type":"string"},"start_date":{"minLength":1,"description":"The date this Iteration begins, e.g. 2019-07-01","type":"string"},"end_date":{"minLength":1,"description":"The date this Iteration ends, e.g. 2019-07-05.","type":"string"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["iteration-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/iterations/{iteration-public-id}",
    executionParameters: [{"name":"iteration-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteIteration", {
    name: "deleteIteration",
    description: `Delete Iteration`,
    inputSchema: {"type":"object","properties":{"iteration-public-id":{"type":"number","format":"int64","description":"The unique ID of the Iteration."}},"required":["iteration-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/iterations/{iteration-public-id}",
    executionParameters: [{"name":"iteration-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listIterationStories", {
    name: "listIterationStories",
    description: `Get a list of all Stories in an Iteration.`,
    inputSchema: {"type":"object","properties":{"iteration-public-id":{"type":"number","format":"int64","description":"The unique ID of the Iteration."},"includes_description":{"type":"boolean","description":"A true/false boolean indicating whether to return Stories with their descriptions."}},"required":["iteration-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/iterations/{iteration-public-id}/stories",
    executionParameters: [{"name":"iteration-public-id","in":"path"},{"name":"includes_description","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getKeyResult", {
    name: "getKeyResult",
    description: `Get Key Result returns information about a chosen Key Result.`,
    inputSchema: {"type":"object","properties":{"key-result-public-id":{"type":"string","format":"uuid","description":"The ID of the Key Result."}},"required":["key-result-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/key-results/{key-result-public-id}",
    executionParameters: [{"name":"key-result-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateKeyResult", {
    name: "updateKeyResult",
    description: `Update Key Result allows updating a Key Result's name or initial, observed, or target values.`,
    inputSchema: {"type":"object","properties":{"key-result-public-id":{"type":"string","format":"uuid","description":"The ID of the Key Result."},"requestBody":{"type":"object","properties":{"name":{"maxLength":1024,"description":"The name of the Key Result.","type":"string"},"initial_observed_value":{"description":"The starting value of the Key Result.","type":"object","properties":{"numeric_value":{"description":"The numeric value, as a decimal string. No more than two decimal places are allowed.","type":"string"},"boolean_value":{"description":"The boolean value.","type":"boolean"}},"additionalProperties":false},"observed_value":{"description":"The starting value of the Key Result.","type":"object","properties":{"numeric_value":{"description":"The numeric value, as a decimal string. No more than two decimal places are allowed.","type":"string"},"boolean_value":{"description":"The boolean value.","type":"boolean"}},"additionalProperties":false},"target_value":{"description":"The starting value of the Key Result.","type":"object","properties":{"numeric_value":{"description":"The numeric value, as a decimal string. No more than two decimal places are allowed.","type":"string"},"boolean_value":{"description":"The boolean value.","type":"boolean"}},"additionalProperties":false}},"additionalProperties":false,"description":"The JSON request body."}},"required":["key-result-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/key-results/{key-result-public-id}",
    executionParameters: [{"name":"key-result-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listLabels", {
    name: "listLabels",
    description: `List Labels returns a list of all Labels and their attributes.`,
    inputSchema: {"type":"object","properties":{"slim":{"type":"boolean","description":"A true/false boolean indicating if the slim versions of the Label should be returned."}}},
    method: "get",
    pathTemplate: "/api/v3/labels",
    executionParameters: [{"name":"slim","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createLabel", {
    name: "createLabel",
    description: `Create Label allows you to create a new Label in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/labels",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getLabel", {
    name: "getLabel",
    description: `Get Label returns information about the selected Label.`,
    inputSchema: {"type":"object","properties":{"label-public-id":{"type":"number","format":"int64","description":"The unique ID of the Label."}},"required":["label-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/labels/{label-public-id}",
    executionParameters: [{"name":"label-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateLabel", {
    name: "updateLabel",
    description: `Update Label allows you to replace a Label name with another name. If you try to name a Label something that already exists, you will receive a 422 response.`,
    inputSchema: {"type":"object","properties":{"label-public-id":{"type":"number","format":"int64","description":"The unique ID of the Label you wish to update."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The new name of the label.","type":"string"},"description":{"maxLength":1024,"description":"The new description of the label.","type":"string"},"color":{"description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","minLength":1,"type":["string","null"]},"archived":{"description":"A true/false boolean indicating if the Label has been archived.","type":"boolean"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["label-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/labels/{label-public-id}",
    executionParameters: [{"name":"label-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteLabel", {
    name: "deleteLabel",
    description: `Delete Label can be used to delete any Label.`,
    inputSchema: {"type":"object","properties":{"label-public-id":{"type":"number","format":"int64","description":"The unique ID of the Label."}},"required":["label-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/labels/{label-public-id}",
    executionParameters: [{"name":"label-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listLabelEpics", {
    name: "listLabelEpics",
    description: `List all of the Epics with the Label.`,
    inputSchema: {"type":"object","properties":{"label-public-id":{"type":"number","format":"int64","description":"The unique ID of the Label."}},"required":["label-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/labels/{label-public-id}/epics",
    executionParameters: [{"name":"label-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listLabelStories", {
    name: "listLabelStories",
    description: `List all of the Stories with the Label.`,
    inputSchema: {"type":"object","properties":{"label-public-id":{"type":"number","format":"int64","description":"The unique ID of the Label."},"includes_description":{"type":"boolean","description":"A true/false boolean indicating whether to return Stories with their descriptions."}},"required":["label-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/labels/{label-public-id}/stories",
    executionParameters: [{"name":"label-public-id","in":"path"},{"name":"includes_description","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listLinkedFiles", {
    name: "listLinkedFiles",
    description: `List Linked Files returns a list of all Linked-Files and their attributes.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/linked-files",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createLinkedFile", {
    name: "createLinkedFile",
    description: `Create Linked File allows you to create a new Linked File in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":512,"description":"The description of the file.","type":"string"},"story_id":{"description":"The ID of the linked story.","type":"number","format":"int64"},"name":{"maxLength":256,"minLength":1,"description":"The name of the file.","type":"string"},"thumbnail_url":{"pattern":"^https?://.+$","maxLength":2048,"description":"The URL of the thumbnail, if the integration provided it.","type":"string"},"type":{"description":"The integration type of the file (e.g. google, dropbox, box).","type":"string","enum":["google","url","dropbox","box","onedrive"]},"size":{"description":"The filesize, if the integration provided it.","type":"number","format":"int64"},"uploader_id":{"description":"The UUID of the member that uploaded the file.","type":"string","format":"uuid"},"content_type":{"maxLength":128,"description":"The content type of the image (e.g. txt/plain).","type":"string"},"url":{"pattern":"^https?://.+$","maxLength":2048,"description":"The URL of linked file.","type":"string"}},"additionalProperties":false,"required":["name","type","url"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/linked-files",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getLinkedFile", {
    name: "getLinkedFile",
    description: `Get File returns information about the selected Linked File.`,
    inputSchema: {"type":"object","properties":{"linked-file-public-id":{"type":"number","format":"int64","description":"The unique identifier of the linked file."}},"required":["linked-file-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/linked-files/{linked-file-public-id}",
    executionParameters: [{"name":"linked-file-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateLinkedFile", {
    name: "updateLinkedFile",
    description: `Updated Linked File allows you to update properties of a previously attached Linked-File.`,
    inputSchema: {"type":"object","properties":{"linked-file-public-id":{"type":"number","format":"int64","description":"The unique identifier of the linked file."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":512,"description":"The description of the file.","type":"string"},"story_id":{"description":"The ID of the linked story.","type":"number","format":"int64"},"name":{"minLength":1,"description":"The name of the file.","type":"string"},"thumbnail_url":{"pattern":"^https?://.+$","maxLength":2048,"description":"The URL of the thumbnail, if the integration provided it.","type":"string"},"type":{"description":"The integration type of the file (e.g. google, dropbox, box).","type":"string","enum":["google","url","dropbox","box","onedrive"]},"size":{"description":"The filesize, if the integration provided it.","type":"number","format":"int64"},"uploader_id":{"description":"The UUID of the member that uploaded the file.","type":"string","format":"uuid"},"url":{"pattern":"^https?://.+$","maxLength":2048,"description":"The URL of linked file.","type":"string"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["linked-file-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/linked-files/{linked-file-public-id}",
    executionParameters: [{"name":"linked-file-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteLinkedFile", {
    name: "deleteLinkedFile",
    description: `Delete Linked File can be used to delete any previously attached Linked-File.`,
    inputSchema: {"type":"object","properties":{"linked-file-public-id":{"type":"number","format":"int64","description":"The unique identifier of the linked file."}},"required":["linked-file-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/linked-files/{linked-file-public-id}",
    executionParameters: [{"name":"linked-file-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getCurrentMemberInfo", {
    name: "getCurrentMemberInfo",
    description: `Returns information about the authenticated member.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/member",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listMembers", {
    name: "listMembers",
    description: `Returns information about members of the Workspace.`,
    inputSchema: {"type":"object","properties":{"org-public-id":{"type":"string","format":"uuid","description":"The unique ID of the Organization to limit the list to."},"disabled":{"type":"boolean","description":"Filter members by their disabled state. If true, return only disabled members. If false, return only enabled members."}}},
    method: "get",
    pathTemplate: "/api/v3/members",
    executionParameters: [{"name":"org-public-id","in":"query"},{"name":"disabled","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getMember", {
    name: "getMember",
    description: `Returns information about a Member.`,
    inputSchema: {"type":"object","properties":{"member-public-id":{"type":"string","format":"uuid","description":"The Member's unique ID."},"org-public-id":{"type":"string","format":"uuid","description":"The unique ID of the Organization to limit the lookup to."}},"required":["member-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/members/{member-public-id}",
    executionParameters: [{"name":"member-public-id","in":"path"},{"name":"org-public-id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listMilestones", {
    name: "listMilestones",
    description: `[DEPRECATED] (Deprecated: Use 'List Objectives') List Milestones returns a list of all Milestones and their attributes.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/milestones",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: true
  }],
  ["createMilestone", {
    name: "createMilestone",
    description: `[DEPRECATED] (Deprecated: Use 'Create Objective') Create Milestone allows you to create a new Milestone in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"name":{"maxLength":256,"minLength":1,"description":"The name of the Milestone.","type":"string"},"description":{"maxLength":100000,"description":"The Milestone's description.","type":"string"},"state":{"description":"The workflow state that the Milestone is in.","type":"string","enum":["in progress","to do","done"]},"started_at_override":{"description":"A manual override for the time/date the Milestone was started.","type":"string","format":"date-time"},"completed_at_override":{"description":"A manual override for the time/date the Milestone was completed.","type":"string","format":"date-time"},"categories":{"description":"An array of IDs of Categories attached to the Milestone.","type":"array","items":{"description":"Request parameters for creating a Category with a Objective.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Category.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Category (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Category has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}}},"additionalProperties":false,"required":["name"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/milestones",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: true
  }],
  ["getMilestone", {
    name: "getMilestone",
    description: `[DEPRECATED] (Deprecated: Use 'Get Objective') Get Milestone returns information about a chosen Milestone.`,
    inputSchema: {"type":"object","properties":{"milestone-public-id":{"type":"number","format":"int64","description":"The ID of the Milestone."}},"required":["milestone-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/milestones/{milestone-public-id}",
    executionParameters: [{"name":"milestone-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: true
  }],
  ["updateMilestone", {
    name: "updateMilestone",
    description: `[DEPRECATED] (Deprecated: Use 'Update Objective') Update Milestone can be used to update Milestone properties.`,
    inputSchema: {"type":"object","properties":{"milestone-public-id":{"type":"number","format":"int64","description":"The ID of the Milestone."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The Milestone's description.","type":"string"},"archived":{"description":"A boolean indicating whether the Milestone is archived or not","type":"boolean"},"completed_at_override":{"description":"A manual override for the time/date the Milestone was completed.","type":["string","null"],"format":"date-time"},"name":{"maxLength":256,"minLength":1,"description":"The name of the Milestone.","type":"string"},"state":{"description":"The workflow state that the Milestone is in.","type":"string","enum":["in progress","to do","done"]},"started_at_override":{"description":"A manual override for the time/date the Milestone was started.","type":["string","null"],"format":"date-time"},"categories":{"description":"An array of IDs of Categories attached to the Milestone.","type":"array","items":{"description":"Request parameters for creating a Category with a Objective.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Category.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Category (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Category has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"before_id":{"description":"The ID of the Milestone we want to move this Milestone before.","type":"number","format":"int64"},"after_id":{"description":"The ID of the Milestone we want to move this Milestone after.","type":"number","format":"int64"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["milestone-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/milestones/{milestone-public-id}",
    executionParameters: [{"name":"milestone-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: true
  }],
  ["deleteMilestone", {
    name: "deleteMilestone",
    description: `[DEPRECATED] (Deprecated: Use 'Delete Objective') Delete Milestone can be used to delete any Milestone.`,
    inputSchema: {"type":"object","properties":{"milestone-public-id":{"type":"number","format":"int64","description":"The ID of the Milestone."}},"required":["milestone-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/milestones/{milestone-public-id}",
    executionParameters: [{"name":"milestone-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: true
  }],
  ["listMilestoneEpics", {
    name: "listMilestoneEpics",
    description: `[DEPRECATED] (Deprecated: Use 'List Objective Epics') List all of the Epics within the Milestone.`,
    inputSchema: {"type":"object","properties":{"milestone-public-id":{"type":"number","format":"int64","description":"The ID of the Milestone."}},"required":["milestone-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/milestones/{milestone-public-id}/epics",
    executionParameters: [{"name":"milestone-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: true
  }],
  ["listObjectives", {
    name: "listObjectives",
    description: `List Objectives returns a list of all Objectives and their attributes.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/objectives",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createObjective", {
    name: "createObjective",
    description: `Create Objective allows you to create a new Objective in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"name":{"maxLength":256,"minLength":1,"description":"The name of the Objective.","type":"string"},"description":{"maxLength":100000,"description":"The Objective's description.","type":"string"},"state":{"description":"The workflow state that the Objective is in.","type":"string","enum":["in progress","to do","done"]},"started_at_override":{"description":"A manual override for the time/date the Objective was started.","type":"string","format":"date-time"},"completed_at_override":{"description":"A manual override for the time/date the Objective was completed.","type":"string","format":"date-time"},"categories":{"description":"An array of IDs of Categories attached to the Objective.","type":"array","items":{"description":"Request parameters for creating a Category with a Objective.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Category.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Category (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Category has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}}},"additionalProperties":false,"required":["name"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/objectives",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getObjective", {
    name: "getObjective",
    description: `Get Objective returns information about a chosen Objective.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The ID of the Objective."}},"required":["objective-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/objectives/{objective-public-id}",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateObjective", {
    name: "updateObjective",
    description: `Update Objective can be used to update Objective properties.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The ID of the Objective."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The Objective's description.","type":"string"},"archived":{"description":"A boolean indicating whether the Objective is archived or not","type":"boolean"},"completed_at_override":{"description":"A manual override for the time/date the Objective was completed.","type":["string","null"],"format":"date-time"},"name":{"maxLength":256,"minLength":1,"description":"The name of the Objective.","type":"string"},"state":{"description":"The workflow state that the Objective is in.","type":"string","enum":["in progress","to do","done"]},"started_at_override":{"description":"A manual override for the time/date the Objective was started.","type":["string","null"],"format":"date-time"},"categories":{"description":"An array of IDs of Categories attached to the Objective.","type":"array","items":{"description":"Request parameters for creating a Category with a Objective.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Category.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Category (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Category has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"before_id":{"description":"The ID of the Objective we want to move this Objective before.","type":"number","format":"int64"},"after_id":{"description":"The ID of the Objective we want to move this Objective after.","type":"number","format":"int64"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["objective-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/objectives/{objective-public-id}",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteObjective", {
    name: "deleteObjective",
    description: `Delete Objective can be used to delete any Objective.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The ID of the Objective."}},"required":["objective-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/objectives/{objective-public-id}",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listObjectiveEpics", {
    name: "listObjectiveEpics",
    description: `List all of the Epics within the Objective.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The ID of the Objective."}},"required":["objective-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/objectives/{objective-public-id}/epics",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getObjectiveHealth", {
    name: "getObjectiveHealth",
    description: `Get the current health for the specified Objective.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The unique ID of the Objective."}},"required":["objective-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/objectives/{objective-public-id}/health",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createObjectiveHealth", {
    name: "createObjectiveHealth",
    description: `Create a new health status for the specified Objective.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The unique ID of the Objective."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"status":{"description":"The health status of the Objective.","type":"string","enum":["At Risk","On Track","Off Track","No Health"]},"text":{"description":"The description of the Health status.","type":"string"}},"additionalProperties":false,"required":["status"],"description":"The JSON request body."}},"required":["objective-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/objectives/{objective-public-id}/health",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listObjectiveHealths", {
    name: "listObjectiveHealths",
    description: `List the history of health statuses for the specified Objective, most recent first.`,
    inputSchema: {"type":"object","properties":{"objective-public-id":{"type":"number","format":"int64","description":"The unique ID of the Objective."}},"required":["objective-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/objectives/{objective-public-id}/health-history",
    executionParameters: [{"name":"objective-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listProjects", {
    name: "listProjects",
    description: `List Projects returns a list of all Projects and their attributes.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/projects",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createProject", {
    name: "createProject",
    description: `Create Project is used to create a new Shortcut Project.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The Project description.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The color you wish to use for the Project in the system.","minLength":1,"type":"string"},"name":{"maxLength":128,"minLength":1,"description":"The name of the Project.","type":"string"},"start_time":{"description":"The date at which the Project was started.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date it is created but can be set to reflect another date.","type":"string","format":"date-time"},"follower_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Epic.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Project has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"team_id":{"description":"The ID of the team the project belongs to.","type":"number","format":"int64"},"iteration_length":{"description":"The number of weeks per iteration in this Project.","type":"number","format":"int64"},"abbreviation":{"maxLength":63,"description":"The Project abbreviation used in Story summaries. Should be kept to 3 characters at most.","type":"string"},"created_at":{"description":"Defaults to the time/date it is created but can be set to reflect another date.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["name","team_id"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/projects",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getProject", {
    name: "getProject",
    description: `Get Project returns information about the selected Project.`,
    inputSchema: {"type":"object","properties":{"project-public-id":{"type":"number","format":"int64","description":"The unique ID of the Project."}},"required":["project-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/projects/{project-public-id}",
    executionParameters: [{"name":"project-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateProject", {
    name: "updateProject",
    description: `Update Project can be used to change properties of a Project.`,
    inputSchema: {"type":"object","properties":{"project-public-id":{"type":"number","format":"int64","description":"The unique ID of the Project."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The Project's description.","type":"string"},"archived":{"description":"A true/false boolean indicating whether the Story is in archived state.","type":"boolean"},"days_to_thermometer":{"description":"The number of days before the thermometer appears in the Story summary.","type":"number","format":"int64"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The color that represents the Project in the UI.","minLength":1,"type":"string"},"name":{"maxLength":128,"minLength":1,"description":"The Project's name.","type":"string"},"follower_ids":{"description":"An array of UUIDs for any Members you want to add as Followers.","type":"array","items":{"type":"string","format":"uuid"}},"show_thermometer":{"description":"Configuration to enable or disable thermometers in the Story summary.","type":"boolean"},"team_id":{"description":"The ID of the team the project belongs to.","type":"number","format":"int64"},"abbreviation":{"description":"The Project abbreviation used in Story summaries. Should be kept to 3 characters at most.","type":"string"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["project-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/projects/{project-public-id}",
    executionParameters: [{"name":"project-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteProject", {
    name: "deleteProject",
    description: `Delete Project can be used to delete a Project. Projects can only be deleted if all associated Stories are moved or deleted. In the case that the Project cannot be deleted, you will receive a 422 response.`,
    inputSchema: {"type":"object","properties":{"project-public-id":{"type":"number","format":"int64","description":"The unique ID of the Project."}},"required":["project-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/projects/{project-public-id}",
    executionParameters: [{"name":"project-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listStories", {
    name: "listStories",
    description: `List Stories returns a list of all Stories in a selected Project and their attributes.`,
    inputSchema: {"type":"object","properties":{"project-public-id":{"type":"number","format":"int64","description":"The unique ID of the Project."},"includes_description":{"type":"boolean","description":"A true/false boolean indicating whether to return Stories with their descriptions."}},"required":["project-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/projects/{project-public-id}/stories",
    executionParameters: [{"name":"project-public-id","in":"path"},{"name":"includes_description","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listRepositories", {
    name: "listRepositories",
    description: `List Repositories returns a list of all Repositories and their attributes.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/repositories",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getRepository", {
    name: "getRepository",
    description: `Get Repository returns information about the selected Repository.`,
    inputSchema: {"type":"object","properties":{"repo-public-id":{"type":"number","format":"int64","description":"The unique ID of the Repository."}},"required":["repo-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/repositories/{repo-public-id}",
    executionParameters: [{"name":"repo-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["search", {
    name: "search",
    description: `Search lets you search Epics and Stories based on desired parameters. Since ordering of the results can change over time (due to search ranking decay, new Epics and Stories being created), the \`next\` value from the previous response can be used as the path and query string for the next page to ensure stable ordering.`,
    inputSchema: {"type":"object","properties":{"query":{"type":"string","minLength":1,"description":"See our help center article on [search operators](https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators)"},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"detail":{"type":"string","enum":["full","slim"],"description":"The amount of detail included in each result item.\n   \"full\" will include all descriptions and comments and more fields on\n   related items such as pull requests, branches and tasks.\n   \"slim\" omits larger fulltext fields such as descriptions and comments\n   and only references related items by id.\n   The default is \"full\"."},"next":{"type":"string","description":"The next page token."},"entity_types":{"type":"array","items":{"type":"string","enum":["story","milestone","epic","iteration","objective"]},"description":"A collection of entity_types to search. Defaults to story and epic. Supports: epic, iteration, objective, story."}},"required":["query"]},
    method: "get",
    pathTemplate: "/api/v3/search",
    executionParameters: [{"name":"query","in":"query"},{"name":"page_size","in":"query"},{"name":"detail","in":"query"},{"name":"next","in":"query"},{"name":"entity_types","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["searchDocuments", {
    name: "searchDocuments",
    description: `Search Documents lets you search Documents based on desired parameters.
                          Supports structured filters: title, archived, created_by_me, followed_by_me.`,
    inputSchema: {"type":"object","properties":{"title":{"type":"string","minLength":1,"description":"Search text to match against document titles. Supports fuzzy matching. Required."},"archived":{"type":"boolean","description":"When true, find archived documents. When false, find non-archived documents."},"created_by_me":{"type":"boolean","description":"When true, find documents created by the current user. When false, find documents NOT created by current user."},"followed_by_me":{"type":"boolean","description":"When true, find documents that the current user is following. When false, find documents NOT followed."},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"next":{"type":"string","description":"The next page token."}},"required":["title"]},
    method: "get",
    pathTemplate: "/api/v3/search/documents",
    executionParameters: [{"name":"title","in":"query"},{"name":"archived","in":"query"},{"name":"created_by_me","in":"query"},{"name":"followed_by_me","in":"query"},{"name":"page_size","in":"query"},{"name":"next","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["searchEpics", {
    name: "searchEpics",
    description: `Search Epics lets you search Epics based on desired parameters. Since ordering of stories can change over time (due to search ranking decay, new Epics being created), the \`next\` value from the previous response can be used as the path and query string for the next page to ensure stable ordering.`,
    inputSchema: {"type":"object","properties":{"query":{"type":"string","minLength":1,"description":"See our help center article on [search operators](https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators)"},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"detail":{"type":"string","enum":["full","slim"],"description":"The amount of detail included in each result item.\n   \"full\" will include all descriptions and comments and more fields on\n   related items such as pull requests, branches and tasks.\n   \"slim\" omits larger fulltext fields such as descriptions and comments\n   and only references related items by id.\n   The default is \"full\"."},"next":{"type":"string","description":"The next page token."},"entity_types":{"type":"array","items":{"type":"string","enum":["story","milestone","epic","iteration","objective"]},"description":"A collection of entity_types to search. Defaults to story and epic. Supports: epic, iteration, objective, story."}},"required":["query"]},
    method: "get",
    pathTemplate: "/api/v3/search/epics",
    executionParameters: [{"name":"query","in":"query"},{"name":"page_size","in":"query"},{"name":"detail","in":"query"},{"name":"next","in":"query"},{"name":"entity_types","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["searchIterations", {
    name: "searchIterations",
    description: `Search Iterations lets you search Iterations based on desired parameters. Since ordering of results can change over time (due to search ranking decay, new Iterations being created), the \`next\` value from the previous response can be used as the path and query string for the next page to ensure stable ordering.`,
    inputSchema: {"type":"object","properties":{"query":{"type":"string","minLength":1,"description":"See our help center article on [search operators](https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators)"},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"detail":{"type":"string","enum":["full","slim"],"description":"The amount of detail included in each result item.\n   \"full\" will include all descriptions and comments and more fields on\n   related items such as pull requests, branches and tasks.\n   \"slim\" omits larger fulltext fields such as descriptions and comments\n   and only references related items by id.\n   The default is \"full\"."},"next":{"type":"string","description":"The next page token."},"entity_types":{"type":"array","items":{"type":"string","enum":["story","milestone","epic","iteration","objective"]},"description":"A collection of entity_types to search. Defaults to story and epic. Supports: epic, iteration, objective, story."}},"required":["query"]},
    method: "get",
    pathTemplate: "/api/v3/search/iterations",
    executionParameters: [{"name":"query","in":"query"},{"name":"page_size","in":"query"},{"name":"detail","in":"query"},{"name":"next","in":"query"},{"name":"entity_types","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["searchMilestones", {
    name: "searchMilestones",
    description: `Search Milestones lets you search Milestones based on desired parameters. Since ordering of results can change over time (due to search ranking decay, new Milestones being created), the \`next\` value from the previous response can be used as the path and query string for the next page to ensure stable ordering.`,
    inputSchema: {"type":"object","properties":{"query":{"type":"string","minLength":1,"description":"See our help center article on [search operators](https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators)"},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"detail":{"type":"string","enum":["full","slim"],"description":"The amount of detail included in each result item.\n   \"full\" will include all descriptions and comments and more fields on\n   related items such as pull requests, branches and tasks.\n   \"slim\" omits larger fulltext fields such as descriptions and comments\n   and only references related items by id.\n   The default is \"full\"."},"next":{"type":"string","description":"The next page token."},"entity_types":{"type":"array","items":{"type":"string","enum":["story","milestone","epic","iteration","objective"]},"description":"A collection of entity_types to search. Defaults to story and epic. Supports: epic, iteration, objective, story."}},"required":["query"]},
    method: "get",
    pathTemplate: "/api/v3/search/milestones",
    executionParameters: [{"name":"query","in":"query"},{"name":"page_size","in":"query"},{"name":"detail","in":"query"},{"name":"next","in":"query"},{"name":"entity_types","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["searchObjectives", {
    name: "searchObjectives",
    description: `Search Objectives lets you search Objectives based on desired parameters. Since ordering of results can change over time (due to search ranking decay, new Objectives being created), the \`next\` value from the previous response can be used as the path and query string for the next page to ensure stable ordering.`,
    inputSchema: {"type":"object","properties":{"query":{"type":"string","minLength":1,"description":"See our help center article on [search operators](https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators)"},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"detail":{"type":"string","enum":["full","slim"],"description":"The amount of detail included in each result item.\n   \"full\" will include all descriptions and comments and more fields on\n   related items such as pull requests, branches and tasks.\n   \"slim\" omits larger fulltext fields such as descriptions and comments\n   and only references related items by id.\n   The default is \"full\"."},"next":{"type":"string","description":"The next page token."},"entity_types":{"type":"array","items":{"type":"string","enum":["story","milestone","epic","iteration","objective"]},"description":"A collection of entity_types to search. Defaults to story and epic. Supports: epic, iteration, objective, story."}},"required":["query"]},
    method: "get",
    pathTemplate: "/api/v3/search/objectives",
    executionParameters: [{"name":"query","in":"query"},{"name":"page_size","in":"query"},{"name":"detail","in":"query"},{"name":"next","in":"query"},{"name":"entity_types","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["searchStories", {
    name: "searchStories",
    description: `Search Stories lets you search Stories based on desired parameters. Since ordering of stories can change over time (due to search ranking decay, new stories being created), the \`next\` value from the previous response can be used as the path and query string for the next page to ensure stable ordering.`,
    inputSchema: {"type":"object","properties":{"query":{"type":"string","minLength":1,"description":"See our help center article on [search operators](https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators)"},"page_size":{"type":"number","format":"int64","description":"The number of search results to include in a page. Minimum of 1 and maximum of 250."},"detail":{"type":"string","enum":["full","slim"],"description":"The amount of detail included in each result item.\n   \"full\" will include all descriptions and comments and more fields on\n   related items such as pull requests, branches and tasks.\n   \"slim\" omits larger fulltext fields such as descriptions and comments\n   and only references related items by id.\n   The default is \"full\"."},"next":{"type":"string","description":"The next page token."},"entity_types":{"type":"array","items":{"type":"string","enum":["story","milestone","epic","iteration","objective"]},"description":"A collection of entity_types to search. Defaults to story and epic. Supports: epic, iteration, objective, story."}},"required":["query"]},
    method: "get",
    pathTemplate: "/api/v3/search/stories",
    executionParameters: [{"name":"query","in":"query"},{"name":"page_size","in":"query"},{"name":"detail","in":"query"},{"name":"next","in":"query"},{"name":"entity_types","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createStory", {
    name: "createStory",
    description: `Create Story is used to add a new story to your Shortcut Workspace.
    This endpoint requires that either **workflow_state_id** or **project_id** be provided, but will reject the request if both or neither are specified. The workflow_state_id has been marked as required and is the recommended field to specify because we are in the process of sunsetting Projects in Shortcut.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"description":"Request parameters for creating a story.","type":"object","properties":{"description":{"maxLength":100000,"description":"The description of the story.","type":"string"},"archived":{"description":"Controls the story's archived state.","type":"boolean"},"story_links":{"description":"An array of story links attached to the story.","type":"array","items":{"description":"Request parameters for creating a Story Link within a Story.","type":"object","properties":{"subject_id":{"description":"The unique ID of the Story defined as subject.","type":"number","format":"int64"},"verb":{"description":"How the subject Story acts on the object Story. This can be \"blocks\", \"duplicates\", or \"relates to\".","type":"string","enum":["blocks","duplicates","relates to"]},"object_id":{"description":"The unique ID of the Story defined as object.","type":"number","format":"int64"}},"additionalProperties":false,"required":["verb"]}},"labels":{"description":"An array of labels attached to the story.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string","enum":["feature","chore","bug"]},"custom_fields":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"move_to":{"description":"One of \"first\" or \"last\". This can be used to move the given story to the first or last position in the workflow state.","type":"string","enum":["last","first"]},"file_ids":{"description":"An array of IDs of files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"source_task_id":{"description":"Given this story was converted from a task in another story, this is the original task ID that was converted to this story.","type":["number","null"],"format":"int64"},"completed_at_override":{"description":"A manual override for the time/date the Story was completed.","type":"string","format":"date-time"},"name":{"maxLength":512,"minLength":1,"description":"The name of the story.","type":"string"},"comments":{"description":"An array of comments to add to the story.","type":"array","items":{"description":"Request parameters for creating a Comment on a Shortcut Story.","type":"object","properties":{"text":{"maxLength":100000,"description":"The comment text.","type":"string"},"author_id":{"description":"The Member ID of the Comment's author. Defaults to the user identified by the API token.","type":"string","format":"uuid"},"created_at":{"description":"Defaults to the time/date the comment is created, but can be set to reflect another date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the comment is last updated, but can be set to reflect another date.","type":"string","format":"date-time"},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_id":{"description":"The ID of the Comment that this comment is threaded under.","type":["number","null"],"format":"int64"}},"additionalProperties":false,"required":["text"]}},"epic_id":{"description":"The ID of the epic the story belongs to.","type":["number","null"],"format":"int64"},"story_template_id":{"description":"The id of the story template used to create this story, if applicable. This is just an association; no content from the story template is inherited by the story simply by setting this field.","type":["string","null"],"format":"uuid"},"external_links":{"description":"An array of External Links associated with this story.","type":"array","items":{"type":"string"}},"sub_tasks":{"description":"An array of maps specifying sub-tasks to be associated with the created story. Each map can either link to an existing story or create a new sub-task story to be linked to the created story.\nField only applicable when Sub-task feature is enabled.","type":"array","items":{"oneOf":[{"type":"object","properties":{"story_id":{"description":"The ID of the story to link as a sub-task of the parent story","type":"integer","format":"int64"}},"additionalProperties":false,"required":["story_id"]},{"type":"object","properties":{"name":{"maxLength":512,"minLength":1,"description":"The name of the SubTask.","type":"string"},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"integer","format":"int64"}},"additionalProperties":false,"required":["name"]}]}},"requested_by_id":{"description":"The ID of the member that requested the story.","type":"string","format":"uuid"},"iteration_id":{"description":"The ID of the iteration the story belongs to.","type":["number","null"],"format":"int64"},"tasks":{"description":"An array of tasks connected to the story.","type":"array","items":{"description":"Request parameters for creating a Task on a Story.","type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task description.","type":"string"},"complete":{"description":"True/false boolean indicating whether the Task is completed. Defaults to false.","type":"boolean"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Task.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Task has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"created_at":{"description":"Defaults to the time/date the Task is created but can be set to reflect another creation time/date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the Task is created in Shortcut but can be set to reflect another time/date.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["description"]}},"started_at_override":{"description":"A manual override for the time/date the Story was started.","type":"string","format":"date-time"},"group_id":{"description":"The id of the group to associate with this story.","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"number","format":"int64"},"updated_at":{"description":"The time/date the Story was updated.","type":"string","format":"date-time"},"follower_ids":{"description":"An array of UUIDs of the followers of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the Story has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_story_id":{"description":"The ID of the parent story to associate with this story (making the created story a sub-task).\nField only applicable when Sub-task feature is enabled.","type":["number","null"],"format":"int64"},"estimate":{"description":"The numeric point estimate of the story. Can also be null, which means unestimated.","type":["number","null"],"format":"int64"},"project_id":{"description":"The ID of the project the story belongs to.","type":["number","null"],"format":"int64"},"linked_file_ids":{"description":"An array of IDs of linked files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"},"created_at":{"description":"The time/date the Story was created.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["name"]}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateMultipleStories", {
    name: "updateMultipleStories",
    description: `Update Multiple Stories allows you to make changes to numerous stories at once.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"archived":{"description":"If the Stories should be archived or not.","type":"boolean"},"story_ids":{"description":"The Ids of the Stories you wish to update.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string","enum":["feature","chore","bug"]},"move_to":{"description":"One of \"first\" or \"last\". This can be used to move the given story to the first or last position in the workflow state.","type":"string","enum":["last","first"]},"follower_ids_add":{"description":"The UUIDs of the new followers to be added.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"epic_id":{"description":"The ID of the epic the story belongs to.","type":["number","null"],"format":"int64"},"external_links":{"description":"An array of External Links associated with this story.","type":"array","items":{"type":"string"}},"follower_ids_remove":{"description":"The UUIDs of the followers to be removed.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"requested_by_id":{"description":"The ID of the member that requested the story.","type":"string","format":"uuid"},"iteration_id":{"description":"The ID of the iteration the story belongs to.","type":["number","null"],"format":"int64"},"custom_fields_remove":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"labels_add":{"description":"An array of labels to be added.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"group_id":{"description":"The Id of the Group the Stories should belong to.","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state to put the stories in.","type":"number","format":"int64"},"before_id":{"description":"The ID of the story that the stories are to be moved before.","type":"number","format":"int64"},"estimate":{"description":"The numeric point estimate of the story. Can also be null, which means unestimated.","type":["number","null"],"format":"int64"},"after_id":{"description":"The ID of the story that the stories are to be moved below.","type":"number","format":"int64"},"owner_ids_remove":{"description":"The UUIDs of the owners to be removed.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"custom_fields_add":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"project_id":{"description":"The ID of the Project the Stories should belong to.","type":["number","null"],"format":"int64"},"labels_remove":{"description":"An array of labels to be removed.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"},"owner_ids_add":{"description":"The UUIDs of the new owners to be added.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true}},"additionalProperties":false,"required":["story_ids"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/stories/bulk",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createMultipleStories", {
    name: "createMultipleStories",
    description: `Create Multiple Stories allows you to create multiple stories in a single request using the same syntax as [Create Story](https://developer.shortcut.com/api/rest/v3#create-story).`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"stories":{"description":"An array of stories to be created.","type":"array","items":{"description":"Request parameters for creating a story.","type":"object","properties":{"description":{"maxLength":100000,"description":"The description of the story.","type":"string"},"archived":{"description":"Controls the story's archived state.","type":"boolean"},"story_links":{"description":"An array of story links attached to the story.","type":"array","items":{"description":"Request parameters for creating a Story Link within a Story.","type":"object","properties":{"subject_id":{"description":"The unique ID of the Story defined as subject.","type":"number","format":"int64"},"verb":{"description":"How the subject Story acts on the object Story. This can be \"blocks\", \"duplicates\", or \"relates to\".","type":"string","enum":["blocks","duplicates","relates to"]},"object_id":{"description":"The unique ID of the Story defined as object.","type":"number","format":"int64"}},"additionalProperties":false,"required":["verb"]}},"labels":{"description":"An array of labels attached to the story.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string","enum":["feature","chore","bug"]},"custom_fields":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"move_to":{"description":"One of \"first\" or \"last\". This can be used to move the given story to the first or last position in the workflow state.","type":"string","enum":["last","first"]},"file_ids":{"description":"An array of IDs of files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"source_task_id":{"description":"Given this story was converted from a task in another story, this is the original task ID that was converted to this story.","type":["number","null"],"format":"int64"},"completed_at_override":{"description":"A manual override for the time/date the Story was completed.","type":"string","format":"date-time"},"name":{"maxLength":512,"minLength":1,"description":"The name of the story.","type":"string"},"comments":{"description":"An array of comments to add to the story.","type":"array","items":{"description":"Request parameters for creating a Comment on a Shortcut Story.","type":"object","properties":{"text":{"maxLength":100000,"description":"The comment text.","type":"string"},"author_id":{"description":"The Member ID of the Comment's author. Defaults to the user identified by the API token.","type":"string","format":"uuid"},"created_at":{"description":"Defaults to the time/date the comment is created, but can be set to reflect another date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the comment is last updated, but can be set to reflect another date.","type":"string","format":"date-time"},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_id":{"description":"The ID of the Comment that this comment is threaded under.","type":["number","null"],"format":"int64"}},"additionalProperties":false,"required":["text"]}},"epic_id":{"description":"The ID of the epic the story belongs to.","type":["number","null"],"format":"int64"},"story_template_id":{"description":"The id of the story template used to create this story, if applicable. This is just an association; no content from the story template is inherited by the story simply by setting this field.","type":["string","null"],"format":"uuid"},"external_links":{"description":"An array of External Links associated with this story.","type":"array","items":{"type":"string"}},"sub_tasks":{"description":"An array of maps specifying sub-tasks to be associated with the created story. Each map can either link to an existing story or create a new sub-task story to be linked to the created story.\nField only applicable when Sub-task feature is enabled.","type":"array","items":{"oneOf":[{"type":"object","properties":{"story_id":{"description":"The ID of the story to link as a sub-task of the parent story","type":"integer","format":"int64"}},"additionalProperties":false,"required":["story_id"]},{"type":"object","properties":{"name":{"maxLength":512,"minLength":1,"description":"The name of the SubTask.","type":"string"},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"integer","format":"int64"}},"additionalProperties":false,"required":["name"]}]}},"requested_by_id":{"description":"The ID of the member that requested the story.","type":"string","format":"uuid"},"iteration_id":{"description":"The ID of the iteration the story belongs to.","type":["number","null"],"format":"int64"},"tasks":{"description":"An array of tasks connected to the story.","type":"array","items":{"description":"Request parameters for creating a Task on a Story.","type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task description.","type":"string"},"complete":{"description":"True/false boolean indicating whether the Task is completed. Defaults to false.","type":"boolean"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Task.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Task has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"created_at":{"description":"Defaults to the time/date the Task is created but can be set to reflect another creation time/date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the Task is created in Shortcut but can be set to reflect another time/date.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["description"]}},"started_at_override":{"description":"A manual override for the time/date the Story was started.","type":"string","format":"date-time"},"group_id":{"description":"The id of the group to associate with this story.","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"number","format":"int64"},"updated_at":{"description":"The time/date the Story was updated.","type":"string","format":"date-time"},"follower_ids":{"description":"An array of UUIDs of the followers of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the Story has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_story_id":{"description":"The ID of the parent story to associate with this story (making the created story a sub-task).\nField only applicable when Sub-task feature is enabled.","type":["number","null"],"format":"int64"},"estimate":{"description":"The numeric point estimate of the story. Can also be null, which means unestimated.","type":["number","null"],"format":"int64"},"project_id":{"description":"The ID of the project the story belongs to.","type":["number","null"],"format":"int64"},"linked_file_ids":{"description":"An array of IDs of linked files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"},"created_at":{"description":"The time/date the Story was created.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["name"]}}},"additionalProperties":false,"required":["stories"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories/bulk",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteMultipleStories", {
    name: "deleteMultipleStories",
    description: `Delete Multiple Stories allows you to delete multiple archived stories at once.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"story_ids":{"description":"An array of IDs of Stories to delete.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true}},"additionalProperties":false,"required":["story_ids"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "delete",
    pathTemplate: "/api/v3/stories/bulk",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createStoryFromTemplate", {
    name: "createStoryFromTemplate",
    description: `Create Story From Template is used to add a new story derived from a template to your Shortcut Workspace.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"description":"Request parameters for creating a story from a story template. These parameters are merged with the values derived from the template.","type":"object","properties":{"description":{"maxLength":100000,"description":"The description of the story.","type":"string"},"archived":{"description":"Controls the story's archived state.","type":"boolean"},"story_links":{"description":"An array of story links attached to the story.","type":"array","items":{"description":"Request parameters for creating a Story Link within a Story.","type":"object","properties":{"subject_id":{"description":"The unique ID of the Story defined as subject.","type":"number","format":"int64"},"verb":{"description":"How the subject Story acts on the object Story. This can be \"blocks\", \"duplicates\", or \"relates to\".","type":"string","enum":["blocks","duplicates","relates to"]},"object_id":{"description":"The unique ID of the Story defined as object.","type":"number","format":"int64"}},"additionalProperties":false,"required":["verb"]}},"labels":{"description":"An array of labels attached to the story.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"external_links_add":{"description":"An array of External Links associated with this story. These will be added to any links provided by the template. Cannot be used in conjunction with `external_links`.","type":"array","items":{"type":"string"},"uniqueItems":true},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string","enum":["feature","chore","bug"]},"custom_fields":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"move_to":{"description":"One of \"first\" or \"last\". This can be used to move the given story to the first or last position in the workflow state.","type":"string","enum":["last","first"]},"file_ids":{"description":"An array of IDs of files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"source_task_id":{"description":"Given this story was converted from a task in another story, this is the original task ID that was converted to this story.","type":["number","null"],"format":"int64"},"completed_at_override":{"description":"A manual override for the time/date the Story was completed.","type":"string","format":"date-time"},"name":{"maxLength":512,"minLength":1,"description":"The name of the story. Must be provided if the template does not provide a name.","type":"string"},"file_ids_add":{"description":"An array of IDs of files attached to the story in addition to files from the template. Cannot be used in conjunction with `file_ids`.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"file_ids_remove":{"description":"An array of IDs of files removed from files from the template. Cannot be used in conjunction with `file_ids`.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"comments":{"description":"An array of comments to add to the story.","type":"array","items":{"description":"Request parameters for creating a Comment on a Shortcut Story.","type":"object","properties":{"text":{"maxLength":100000,"description":"The comment text.","type":"string"},"author_id":{"description":"The Member ID of the Comment's author. Defaults to the user identified by the API token.","type":"string","format":"uuid"},"created_at":{"description":"Defaults to the time/date the comment is created, but can be set to reflect another date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the comment is last updated, but can be set to reflect another date.","type":"string","format":"date-time"},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_id":{"description":"The ID of the Comment that this comment is threaded under.","type":["number","null"],"format":"int64"}},"additionalProperties":false,"required":["text"]}},"follower_ids_add":{"description":"The UUIDs of the new followers to be added in addition to followers from the template. Cannot be used in conjunction with `follower_ids.`","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"epic_id":{"description":"The ID of the epic the story belongs to.","type":["number","null"],"format":"int64"},"story_template_id":{"description":"The id of the story template used to create this story.","type":"string","format":"uuid"},"external_links":{"description":"An array of External Links associated with this story.","type":"array","items":{"type":"string"}},"follower_ids_remove":{"description":"The UUIDs of the new followers to be removed from followers from the template. Cannot be used in conjunction with `follower_ids`.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"sub_tasks":{"description":"An array of maps specifying sub-tasks to be associated with the created story. Each map can either link to an existing story or create a new sub-task story to be linked to the created story.\nField only applicable when Sub-task feature is enabled.","type":"array","items":{"oneOf":[{"type":"object","properties":{"story_id":{"description":"The ID of the story to link as a sub-task of the parent story","type":"integer","format":"int64"}},"additionalProperties":false,"required":["story_id"]},{"type":"object","properties":{"name":{"maxLength":512,"minLength":1,"description":"The name of the SubTask.","type":"string"},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"integer","format":"int64"}},"additionalProperties":false,"required":["name"]}]}},"linked_file_ids_remove":{"description":"An array of IDs of linked files removed from files from the template. Cannot be used in conjunction with `linked_files.`","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"requested_by_id":{"description":"The ID of the member that requested the story.","type":"string","format":"uuid"},"iteration_id":{"description":"The ID of the iteration the story belongs to.","type":["number","null"],"format":"int64"},"custom_fields_remove":{"description":"A map specifying a CustomField ID. These will be removed from any fields provided by the template. Cannot be used in conjunction with `custom_fields`.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"}},"additionalProperties":false,"required":["field_id"]},"uniqueItems":true},"tasks":{"description":"An array of tasks connected to the story.","type":"array","items":{"description":"Request parameters for creating a Task on a Story.","type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task description.","type":"string"},"complete":{"description":"True/false boolean indicating whether the Task is completed. Defaults to false.","type":"boolean"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Task.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Task has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"created_at":{"description":"Defaults to the time/date the Task is created but can be set to reflect another creation time/date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the Task is created in Shortcut but can be set to reflect another time/date.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["description"]}},"started_at_override":{"description":"A manual override for the time/date the Story was started.","type":"string","format":"date-time"},"labels_add":{"description":"An array of labels attached to the story in addition to the labels provided by the template. Cannot be used in conjunction with `labels`.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]},"uniqueItems":true},"group_id":{"description":"The id of the group to associate with this story.","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state the story will be in.","type":"number","format":"int64"},"updated_at":{"description":"The time/date the Story was updated.","type":"string","format":"date-time"},"follower_ids":{"description":"An array of UUIDs of the followers of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the Story has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_story_id":{"description":"The ID of the parent story to associate with this story (making the created story a sub-task).\nField only applicable when Sub-task feature is enabled.","type":["number","null"],"format":"int64"},"estimate":{"description":"The numeric point estimate of the story. Can also be null, which means unestimated.","type":["number","null"],"format":"int64"},"owner_ids_remove":{"description":"The UUIDs of the new owners to be removed from owners from the template. Cannot be used in conjunction with `owners`.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"custom_fields_add":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField. These will be added to any fields provided by the template. Cannot be used in conjunction with `custom_fields`.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]},"uniqueItems":true},"project_id":{"description":"The ID of the project the story belongs to.","type":["number","null"],"format":"int64"},"linked_file_ids_add":{"description":"An array of IDs of linked files attached to the story in addition to files from the template. Cannot be used in conjunction with `linked_files`.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"linked_file_ids":{"description":"An array of IDs of linked files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"labels_remove":{"description":"An array of labels to remove from the labels provided by the template. Cannot be used in conjunction with `labels`.","type":"array","items":{"description":"Request parameters for removing a Label from a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label to remove.","type":"string"}},"additionalProperties":false,"required":["name"]},"uniqueItems":true},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"},"owner_ids_add":{"description":"The UUIDs of the new owners to be added in addition to owners from the template. Cannot be used in conjunction with `owners`.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"created_at":{"description":"The time/date the Story was created.","type":"string","format":"date-time"},"external_links_remove":{"description":"An array of External Links associated with this story. These will be removed from any links provided by the template. Cannot be used in conjunction with `external_links`.","type":"array","items":{"type":"string"},"uniqueItems":true}},"additionalProperties":false,"required":["story_template_id"]}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories/from-template",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["queryStories", {
    name: "queryStories",
    description: `Search Stories lets you search Stories based on desired parameters.`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"archived":{"description":"A true/false boolean indicating whether the Story is in archived state.","type":"boolean"},"owner_id":{"description":"An array of UUIDs for any Users who may be Owners of the Stories.","type":["string","null"],"format":"uuid"},"story_type":{"description":"The type of Stories that you want returned.","type":"string","enum":["feature","chore","bug"]},"epic_ids":{"description":"The Epic IDs that may be associated with the Stories.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"project_ids":{"description":"The IDs for the Projects the Stories may be assigned to.","type":"array","items":{"type":["number","null"],"format":"int64"},"uniqueItems":true},"updated_at_end":{"description":"Stories should have been updated on or before this date.","type":"string","format":"date-time"},"completed_at_end":{"description":"Stories should have been completed on or before this date.","type":"string","format":"date-time"},"workflow_state_types":{"description":"The type of Workflow State the Stories may be in.","type":"array","items":{"type":"string","enum":["started","backlog","unstarted","done"]}},"deadline_end":{"description":"Stories should have a deadline on or before this date.","type":"string","format":"date-time"},"created_at_start":{"description":"Stories should have been created on or after this date.","type":"string","format":"date-time"},"epic_id":{"description":"The Epic IDs that may be associated with the Stories.","type":["number","null"],"format":"int64"},"label_name":{"minLength":1,"description":"The name of any associated Labels.","type":"string"},"requested_by_id":{"description":"The UUID of any Users who may have requested the Stories.","type":"string","format":"uuid"},"iteration_id":{"description":"The Iteration ID that may be associated with the Stories.","type":["number","null"],"format":"int64"},"label_ids":{"description":"The Label IDs that may be associated with the Stories.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"group_id":{"description":"The Group ID that is associated with the Stories","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The unique IDs of the specific Workflow States that the Stories should be in.","type":"number","format":"int64"},"iteration_ids":{"description":"The Iteration IDs that may be associated with the Stories.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"created_at_end":{"description":"Stories should have been created on or before this date.","type":"string","format":"date-time"},"deadline_start":{"description":"Stories should have a deadline on or after this date.","type":"string","format":"date-time"},"group_ids":{"description":"The Group IDs that are associated with the Stories","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"owner_ids":{"description":"An array of UUIDs for any Users who may be Owners of the Stories.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"external_id":{"maxLength":1024,"description":"An ID or URL that references an external resource. Useful during imports.","type":"string"},"includes_description":{"description":"Whether to include the story description in the response.","type":"boolean"},"estimate":{"description":"The number of estimate points associate with the Stories.","type":"number","format":"int64"},"project_id":{"description":"The IDs for the Projects the Stories may be assigned to.","type":["number","null"],"format":"int64"},"completed_at_start":{"description":"Stories should have been completed on or after this date.","type":"string","format":"date-time"},"updated_at_start":{"description":"Stories should have been updated on or after this date.","type":"string","format":"date-time"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories/search",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getStory", {
    name: "getStory",
    description: `Get Story returns information about a chosen Story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story."}},"required":["story-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/stories/{story-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateStory", {
    name: "updateStory",
    description: `Update Story can be used to update Story properties.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The unique identifier of this story."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":100000,"description":"The description of the story.","type":"string"},"archived":{"description":"True if the story is archived, otherwise false.","type":"boolean"},"labels":{"description":"An array of labels attached to the story.","type":"array","items":{"description":"Request parameters for creating a Label on a Shortcut Story.","type":"object","properties":{"name":{"maxLength":128,"minLength":1,"description":"The name of the new Label.","type":"string"},"description":{"maxLength":1024,"description":"The description of the new Label.","type":"string"},"color":{"pattern":"^#[a-fA-F0-9]{6}$","format":"css-color","description":"The hex color to be displayed with the Label (for example, \"#ff0000\").","minLength":1,"type":"string"},"external_id":{"maxLength":128,"minLength":1,"description":"This field can be set to another unique ID. In the case that the Label has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"}},"additionalProperties":false,"required":["name"]}},"pull_request_ids":{"description":"An array of IDs of Pull/Merge Requests attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"story_type":{"description":"The type of story (feature, bug, chore).","type":"string","enum":["feature","chore","bug"]},"custom_fields":{"description":"A map specifying a CustomField ID and CustomFieldEnumValue ID that represents an assertion of some value for a CustomField.","type":"array","items":{"type":"object","properties":{"field_id":{"description":"The unique public ID for the CustomField.","type":"string","format":"uuid"},"value_id":{"description":"The unique public ID for the CustomFieldEnumValue.","type":"string","format":"uuid"},"value":{"description":"A literal value for the CustomField. Currently ignored.","type":"string"}},"additionalProperties":false,"required":["field_id","value_id"]}},"move_to":{"description":"One of \"first\" or \"last\". This can be used to move the given story to the first or last position in the workflow state.","type":"string","enum":["last","first"]},"file_ids":{"description":"An array of IDs of files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"completed_at_override":{"description":"A manual override for the time/date the Story was completed.","type":["string","null"],"format":"date-time"},"name":{"maxLength":512,"minLength":1,"description":"The title of the story.","type":"string"},"epic_id":{"description":"The ID of the epic the story belongs to.","type":["number","null"],"format":"int64"},"external_links":{"description":"An array of External Links associated with this story.","type":"array","items":{"type":"string"}},"branch_ids":{"description":"An array of IDs of Branches attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"commit_ids":{"description":"An array of IDs of Commits attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"sub_tasks":{"description":"An array of story IDs to attach to this story as sub-tasks. This list represents the final state of the parent's sub-tasks - missing stories will be unlinked, new stories will be linked, and the input order reflects sub-task positions.","type":"array","items":{"type":"object","properties":{"story_id":{"description":"The ID of the story to link as a sub-task of the parent story","type":"number","format":"int64"}},"additionalProperties":false,"required":["story_id"]}},"requested_by_id":{"description":"The ID of the member that requested the story.","type":"string","format":"uuid"},"iteration_id":{"description":"The ID of the iteration the story belongs to.","type":["number","null"],"format":"int64"},"started_at_override":{"description":"A manual override for the time/date the Story was started.","type":["string","null"],"format":"date-time"},"group_id":{"description":"The ID of the group to associate with this story","type":["string","null"],"format":"uuid"},"workflow_state_id":{"description":"The ID of the workflow state to put the story in.","type":"number","format":"int64"},"follower_ids":{"description":"An array of UUIDs of the followers of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"},"uniqueItems":true},"parent_story_id":{"description":"The parent story id. If you want to unset this value set parent_story_id to null.","x-doc-skip":true,"type":["number","null"],"format":"int64"},"before_id":{"description":"The ID of the story we want to move this story before.","type":"number","format":"int64"},"estimate":{"description":"The numeric point estimate of the story. Can also be null, which means unestimated.","type":["number","null"],"format":"int64"},"after_id":{"description":"The ID of the story we want to move this story after.","type":"number","format":"int64"},"project_id":{"description":"The ID of the project the story belongs to.","type":["number","null"],"format":"int64"},"linked_file_ids":{"description":"An array of IDs of linked files attached to the story.","type":"array","items":{"type":"number","format":"int64"},"uniqueItems":true},"deadline":{"description":"The due date of the story.","type":["string","null"],"format":"date-time"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["story-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/stories/{story-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteStory", {
    name: "deleteStory",
    description: `Delete Story can be used to delete any Story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story."}},"required":["story-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/stories/{story-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listStoryComment", {
    name: "listStoryComment",
    description: `Lists Comments associated with a Story`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."}},"required":["story-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createStoryComment", {
    name: "createStoryComment",
    description: `Create Comment allows you to create a Comment on any Story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"text":{"maxLength":100000,"description":"The comment text.","type":"string"},"author_id":{"description":"The Member ID of the Comment's author. Defaults to the user identified by the API token.","type":"string","format":"uuid"},"created_at":{"description":"Defaults to the time/date the comment is created, but can be set to reflect another date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the comment is last updated, but can be set to reflect another date.","type":"string","format":"date-time"},"external_id":{"maxLength":1024,"description":"This field can be set to another unique ID. In the case that the comment has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"parent_id":{"description":"The ID of the Comment that this comment is threaded under.","type":["number","null"],"format":"int64"}},"additionalProperties":false,"required":["text"],"description":"The JSON request body."}},"required":["story-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getStoryComment", {
    name: "getStoryComment",
    description: `Get Comment is used to get Comment information.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."}},"required":["story-public-id","comment-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateStoryComment", {
    name: "updateStoryComment",
    description: `Update Comment replaces the text of the existing Comment.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment"},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"text":{"maxLength":100000,"description":"The updated comment text.","type":"string"}},"additionalProperties":false,"required":["text"],"description":"The JSON request body."}},"required":["story-public-id","comment-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteStoryComment", {
    name: "deleteStoryComment",
    description: `Delete a Comment from any story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."}},"required":["story-public-id","comment-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments/{comment-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createStoryReaction", {
    name: "createStoryReaction",
    description: `Create a reaction to a story comment.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"emoji":{"description":"The emoji short-code to add / remove. E.g. `:thumbsup::skin-tone-4:`.","type":"string"}},"additionalProperties":false,"required":["emoji"],"description":"The JSON request body."}},"required":["story-public-id","comment-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments/{comment-public-id}/reactions",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteStoryReaction", {
    name: "deleteStoryReaction",
    description: `Delete a reaction from any story comment.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Comment is in."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"emoji":{"description":"The emoji short-code to add / remove. E.g. `:thumbsup::skin-tone-4:`.","type":"string"}},"additionalProperties":false,"required":["emoji"],"description":"The JSON request body."}},"required":["story-public-id","comment-public-id","requestBody"]},
    method: "delete",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments/{comment-public-id}/reactions",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["unlinkCommentThreadFromSlack", {
    name: "unlinkCommentThreadFromSlack",
    description: `Unlinks a Comment from its linked Slack thread (Comment replies and Slack replies will no longer be synced)`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story to unlink."},"comment-public-id":{"type":"number","format":"int64","description":"The ID of the Comment to unlink."}},"required":["story-public-id","comment-public-id"]},
    method: "post",
    pathTemplate: "/api/v3/stories/{story-public-id}/comments/{comment-public-id}/unlink-from-slack",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"comment-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["storyHistory", {
    name: "storyHistory",
    description: `Story History`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story."}},"required":["story-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/stories/{story-public-id}/history",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listStorySubTasks", {
    name: "listStorySubTasks",
    description: `List Story Sub tasks returns a list of all Sub-task Stories for a given parent Story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story."}},"required":["story-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/stories/{story-public-id}/sub-tasks",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createTask", {
    name: "createTask",
    description: `Create Task is used to create a new task in a Story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The ID of the Story that the Task will be in."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task description.","type":"string"},"complete":{"description":"True/false boolean indicating whether the Task is completed. Defaults to false.","type":"boolean"},"owner_ids":{"description":"An array of UUIDs for any members you want to add as Owners on this new Task.","type":"array","items":{"type":"string","format":"uuid"}},"external_id":{"maxLength":128,"description":"This field can be set to another unique ID. In the case that the Task has been imported from another tool, the ID in the other tool can be indicated here.","type":"string"},"created_at":{"description":"Defaults to the time/date the Task is created but can be set to reflect another creation time/date.","type":"string","format":"date-time"},"updated_at":{"description":"Defaults to the time/date the Task is created in Shortcut but can be set to reflect another time/date.","type":"string","format":"date-time"}},"additionalProperties":false,"required":["description"],"description":"The JSON request body."}},"required":["story-public-id","requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/stories/{story-public-id}/tasks",
    executionParameters: [{"name":"story-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getTask", {
    name: "getTask",
    description: `Returns information about a chosen Task.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The unique ID of the Story this Task is associated with."},"task-public-id":{"type":"number","format":"int64","description":"The unique ID of the Task."}},"required":["story-public-id","task-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/stories/{story-public-id}/tasks/{task-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"task-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateTask", {
    name: "updateTask",
    description: `Update Task can be used to update Task properties.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The unique identifier of the parent Story."},"task-public-id":{"type":"number","format":"int64","description":"The unique identifier of the Task you wish to update."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"description":{"maxLength":2048,"minLength":1,"description":"The Task's description.","type":"string"},"owner_ids":{"description":"An array of UUIDs of the owners of this story.","type":"array","items":{"type":"string","format":"uuid"}},"complete":{"description":"A true/false boolean indicating whether the task is complete.","type":"boolean"},"before_id":{"description":"Move task before this task ID.","type":"number","format":"int64"},"after_id":{"description":"Move task after this task ID.","type":"number","format":"int64"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["story-public-id","task-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/stories/{story-public-id}/tasks/{task-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"task-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteTask", {
    name: "deleteTask",
    description: `Delete Task can be used to delete any previously created Task on a Story.`,
    inputSchema: {"type":"object","properties":{"story-public-id":{"type":"number","format":"int64","description":"The unique ID of the Story this Task is associated with."},"task-public-id":{"type":"number","format":"int64","description":"The unique ID of the Task."}},"required":["story-public-id","task-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/stories/{story-public-id}/tasks/{task-public-id}",
    executionParameters: [{"name":"story-public-id","in":"path"},{"name":"task-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["createStoryLink", {
    name: "createStoryLink",
    description: `Story Links (called Story Relationships in the UI) allow you create semantic relationships between two stories. The parameters read like an active voice grammatical sentence:  subject -> verb -> object.

The subject story acts on the object Story; the object story is the direct object of the sentence.

The subject story "blocks", "duplicates", or "relates to" the object story.  Examples:
- "story 5 blocks story 6” -- story 6 is now "blocked" until story 5 is moved to a Done workflow state.
- "story 2 duplicates story 1” -- Story 2 represents the same body of work as Story 1 (and should probably be archived).
- "story 7 relates to story 3”`,
    inputSchema: {"type":"object","properties":{"requestBody":{"x-doc-skip":true,"type":"object","properties":{"verb":{"description":"The type of link.","type":"string","enum":["blocks","duplicates","relates to"]},"subject_id":{"description":"The ID of the subject Story.","type":"number","format":"int64"},"object_id":{"description":"The ID of the object Story.","type":"number","format":"int64"}},"additionalProperties":false,"required":["verb","subject_id","object_id"],"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/api/v3/story-links",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getStoryLink", {
    name: "getStoryLink",
    description: `Returns the stories and their relationship for the given Story Link.`,
    inputSchema: {"type":"object","properties":{"story-link-public-id":{"type":"number","format":"int64","description":"The unique ID of the Story Link."}},"required":["story-link-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/story-links/{story-link-public-id}",
    executionParameters: [{"name":"story-link-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["updateStoryLink", {
    name: "updateStoryLink",
    description: `Updates the stories and/or the relationship for the given Story Link.`,
    inputSchema: {"type":"object","properties":{"story-link-public-id":{"type":"number","format":"int64","description":"The unique ID of the Story Link."},"requestBody":{"x-doc-skip":true,"type":"object","properties":{"verb":{"description":"The type of link.","type":"string","enum":["blocks","duplicates","relates to"]},"subject_id":{"description":"The ID of the subject Story.","type":"number","format":"int64"},"object_id":{"description":"The ID of the object Story.","type":"number","format":"int64"}},"additionalProperties":false,"description":"The JSON request body."}},"required":["story-link-public-id","requestBody"]},
    method: "put",
    pathTemplate: "/api/v3/story-links/{story-link-public-id}",
    executionParameters: [{"name":"story-link-public-id","in":"path"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["deleteStoryLink", {
    name: "deleteStoryLink",
    description: `Removes the relationship between the stories for the given Story Link.`,
    inputSchema: {"type":"object","properties":{"story-link-public-id":{"type":"number","format":"int64","description":"The unique ID of the Story Link."}},"required":["story-link-public-id"]},
    method: "delete",
    pathTemplate: "/api/v3/story-links/{story-link-public-id}",
    executionParameters: [{"name":"story-link-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["listWorkflows", {
    name: "listWorkflows",
    description: `Returns a list of all Workflows in the Workspace.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/api/v3/workflows",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
  ["getWorkflow", {
    name: "getWorkflow",
    description: `Get Workflow returns information about a chosen Workflow.`,
    inputSchema: {"type":"object","properties":{"workflow-public-id":{"type":"number","format":"int64","description":"The ID of the Workflow."}},"required":["workflow-public-id"]},
    method: "get",
    pathTemplate: "/api/v3/workflows/{workflow-public-id}",
    executionParameters: [{"name":"workflow-public-id","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"api_token":[]}],
    tags: [],
    deprecated: false
  }],
]);

/**
 * Security schemes from the OpenAPI spec
 */
const securitySchemes =   {
    "api_token": {
      "type": "apiKey",
      "in": "header",
      "name": "Shortcut-Token"
    }
  };


server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolsForClient: Tool[] = Array.from(toolDefinitionMap.values()).map(def => ({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema
  }));
  return { tools: toolsForClient };
});


server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
  const { name: toolName, arguments: toolArgs } = request.params;
  const toolDefinition = toolDefinitionMap.get(toolName);
  if (!toolDefinition) {
    console.error(`Error: Unknown tool requested: ${toolName}`);
    return { content: [{ type: "text", text: `Error: Unknown tool requested: ${toolName}` }] };
  }
  return await executeApiTool(toolName, toolDefinition, toolArgs ?? {}, securitySchemes);
});



/**
 * Type definition for cached OAuth tokens
 */
interface TokenCacheEntry {
    token: string;
    expiresAt: number;
}

/**
 * Declare global __oauthTokenCache property for TypeScript
 */
declare global {
    var __oauthTokenCache: Record<string, TokenCacheEntry> | undefined;
}

/**
 * Acquires an OAuth2 token using client credentials flow
 * 
 * @param schemeName Name of the security scheme
 * @param scheme OAuth2 security scheme
 * @returns Acquired token or null if unable to acquire
 */
async function acquireOAuth2Token(schemeName: string, scheme: any): Promise<string | null | undefined> {
    try {
        // Check if we have the necessary credentials (resolved per-scheme at runtime)
        const clientId = process.env[`OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        const clientSecret = process.env[`OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
        const scopes = process.env[`OAUTH_SCOPES_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];

        if (!clientId || !clientSecret) {
            console.error(`Missing client credentials for OAuth2 scheme '${schemeName}'`);
            return null;
        }
        
        // Initialize token cache if needed
        if (typeof global.__oauthTokenCache === 'undefined') {
            global.__oauthTokenCache = {};
        }
        
        // Check if we have a cached token
        const cacheKey = `${schemeName}_${clientId}`;
        const cachedToken = global.__oauthTokenCache[cacheKey];
        const now = Date.now();
        
        if (cachedToken && cachedToken.expiresAt > now) {
            console.error(`Using cached OAuth2 token for '${schemeName}' (expires in ${Math.floor((cachedToken.expiresAt - now) / 1000)} seconds)`);
            return cachedToken.token;
        }
        
        // Determine token URL based on flow type
        let tokenUrl = '';
        if (scheme.flows?.clientCredentials?.tokenUrl) {
            tokenUrl = scheme.flows.clientCredentials.tokenUrl;
            console.error(`Using client credentials flow for '${schemeName}'`);
        } else if (scheme.flows?.password?.tokenUrl) {
            tokenUrl = scheme.flows.password.tokenUrl;
            console.error(`Using password flow for '${schemeName}'`);
        } else {
            console.error(`No supported OAuth2 flow found for '${schemeName}'`);
            return null;
        }
        
        // Prepare the token request
        let formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        
        // Add scopes if specified
        if (scopes) {
            formData.append('scope', scopes);
        }

        console.error(`Requesting OAuth2 token from ${tokenUrl}`);

        // Make the token request
        const response = await axios({
            method: 'POST',
            url: tokenUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            data: formData.toString()
        });
        
        // Process the response
        if (response.data?.access_token) {
            const token = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600; // Default to 1 hour
            
            // Cache the token
            global.__oauthTokenCache[cacheKey] = {
                token,
                expiresAt: now + (expiresIn * 1000) - 60000 // Expire 1 minute early
            };
            
            console.error(`Successfully acquired OAuth2 token for '${schemeName}' (expires in ${expiresIn} seconds)`);
            return token;
        } else {
            console.error(`Failed to acquire OAuth2 token for '${schemeName}': No access_token in response`);
            return null;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error acquiring OAuth2 token for '${schemeName}':`, errorMessage);
        return null;
    }
}


/**
 * Executes an API tool with the provided arguments
 * 
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
async function executeApiTool(
    toolName: string,
    definition: McpToolDefinition,
    toolArgs: JsonObject,
    allSecuritySchemes: Record<string, any>
): Promise<CallToolResult> {
  try {
    // Validate arguments against the input schema
    let validatedArgs: JsonObject;
    try {
        const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
        const argsToParse = (typeof toolArgs === 'object' && toolArgs !== null) ? toolArgs : {};
        validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors.map(e => `${e.path.join('.')} (${e.code}): ${e.message}`).join(', ')}`;
            return { content: [{ type: 'text', text: validationErrorMessage }] };
        } else {
             const errorMessage = error instanceof Error ? error.message : String(error);
             return { content: [{ type: 'text', text: `Internal error during validation setup: ${errorMessage}` }] };
        }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    let requestBodyData: any = undefined;

    // Apply parameters to the URL path, query, or headers
    definition.executionParameters.forEach((param) => {
        const value = validatedArgs[param.name];
        if (typeof value !== 'undefined' && value !== null) {
            if (param.in === 'path') {
                urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
            }
            else if (param.in === 'query') {
                queryParams[param.name] = value;
            }
            else if (param.in === 'header') {
                headers[param.name.toLowerCase()] = String(value);
            }
        }
    });

    // Ensure all path parameters are resolved
    if (urlPath.includes('{')) {
        throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }
    
    // Construct the full URL
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;

    // Handle request body if needed
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
        requestBodyData = validatedArgs['requestBody'];
        headers['content-type'] = definition.requestBodyContentType;
    }

    // Apply security requirements if available
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find(req => {
        // Try each security requirement (combined with OR)
        return Object.entries(req).every(([schemeName, scopesArray]) => {
            const scheme = allSecuritySchemes[schemeName];
            if (!scheme) return false;
            
            // API Key security (header, query, cookie)
            if (scheme.type === 'apiKey') {
                return !!process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            // HTTP security (basic, bearer)
            if (scheme.type === 'http') {
                if (scheme.scheme?.toLowerCase() === 'bearer') {
                    return !!process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                }
                else if (scheme.scheme?.toLowerCase() === 'basic') {
                    // Username is sufficient; an empty password is valid per RFC 7617 (issue #66)
                    return process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] != null;
                }
            }
            
            // OAuth2 security
            if (scheme.type === 'oauth2') {
                // Check for pre-existing token
                if (process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    return true;
                }
                
                // Check for client credentials for auto-acquisition
                if (process.env[`OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] &&
                    process.env[`OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    // Verify we have a supported flow
                    if (scheme.flows?.clientCredentials || scheme.flows?.password) {
                        return true;
                    }
                }
                
                return false;
            }
            
            // OpenID Connect
            if (scheme.type === 'openIdConnect') {
                return !!process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            return false;
        });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
        // Apply each security scheme from this requirement (combined with AND)
        for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
            const scheme = allSecuritySchemes[schemeName];
            
            // API Key security
            if (scheme?.type === 'apiKey') {
                const apiKey = process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (apiKey) {
                    if (scheme.in === 'header') {
                        headers[scheme.name.toLowerCase()] = apiKey;
                        console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
                    }
                    else if (scheme.in === 'query') {
                        queryParams[scheme.name] = apiKey;
                        console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
                    }
                    else if (scheme.in === 'cookie') {
                        // Add the cookie, preserving other cookies if they exist
                        headers['cookie'] = `${scheme.name}=${apiKey}${headers['cookie'] ? `; ${headers['cookie']}` : ''}`;
                        console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
                    }
                }
            } 
            // HTTP security (Bearer or Basic)
            else if (scheme?.type === 'http') {
                if (scheme.scheme?.toLowerCase() === 'bearer') {
                    const token = process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    if (token) {
                        headers['authorization'] = `Bearer ${token}`;
                        console.error(`Applied Bearer token for '${schemeName}'`);
                    }
                } 
                else if (scheme.scheme?.toLowerCase() === 'basic') {
                    const username = process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    const password = process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    // Empty password is valid per RFC 7617 (issue #66); only username is required.
                    if (username != null) {
                        headers['authorization'] = `Basic ${Buffer.from(`${username}:${password ?? ''}`).toString('base64')}`;
                        console.error(`Applied Basic authentication for '${schemeName}'`);
                    }
                }
            }
            // OAuth2 security
            else if (scheme?.type === 'oauth2') {
                // First try to use a pre-provided token
                let token = process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                
                // If no token but we have client credentials, try to acquire a token
                if (!token && (scheme.flows?.clientCredentials || scheme.flows?.password)) {
                    console.error(`Attempting to acquire OAuth token for '${schemeName}'`);
                    token = (await acquireOAuth2Token(schemeName, scheme)) ?? '';
                }
                
                // Apply token if available
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OAuth2 token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
            // OpenID Connect
            else if (scheme?.type === 'openIdConnect') {
                const token = process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OpenID Connect token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
        }
    } 
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
        // First generate a more readable representation of the security requirements
        const securityRequirementsString = definition.securityRequirements
            .map(req => {
                const parts = Object.entries(req)
                    .map(([name, scopesArray]) => {
                        const scopes = scopesArray as string[];
                        if (scopes.length === 0) return name;
                        return `${name} (scopes: ${scopes.join(', ')})`;
                    })
                    .join(' AND ');
                return `[${parts}]`;
            })
            .join(' OR ');
            
        console.warn(`Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`);
    }
    

    // Prepare the axios request configuration
    const config: AxiosRequestConfig = {
      method: definition.method.toUpperCase(),
      url: requestUrl,
      params: queryParams,
      headers: headers,
      // Serialize array query params as comma-separated values (issue #41)
      paramsSerializer: (params: Record<string, any>) => {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value === undefined || value === null) continue;
          search.append(key, Array.isArray(value) ? value.join(',') : String(value));
        }
        return search.toString();
      },
      ...(requestBodyData !== undefined && { data: requestBodyData }),
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);

    // Execute the request
    const response = await axios(config);

    // Process and format the response
    let responseText = '';
    // Coerce header value to string before lowercasing (issue #65)
    const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
    
    // Handle JSON responses
    if (contentType.includes('application/json') && typeof response.data === 'object' && response.data !== null) {
         try { 
             responseText = JSON.stringify(response.data, null, 2); 
         } catch (e) { 
             responseText = "[Stringify Error]"; 
         }
    } 
    // Handle string responses
    else if (typeof response.data === 'string') { 
         responseText = response.data; 
    }
    // Handle other response types
    else if (response.data !== undefined && response.data !== null) { 
         responseText = String(response.data); 
    }
    // Handle empty responses
    else { 
         responseText = `(Status: ${response.status} - No body content)`; 
    }
    
    // Return formatted response
    return { 
        content: [ 
            { 
                type: "text", 
                text: `API Response (Status: ${response.status}):\n${responseText}` 
            } 
        ], 
    };

  } catch (error: unknown) {
    // Handle errors during execution
    let errorMessage: string;
    
    // Format Axios errors specially
    if (axios.isAxiosError(error)) { 
        errorMessage = formatApiError(error); 
    }
    // Handle standard errors
    else if (error instanceof Error) { 
        errorMessage = error.message; 
    }
    // Handle unexpected error types
    else { 
        errorMessage = 'Unexpected error: ' + String(error); 
    }
    
    // Log error to stderr
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);
    
    // Return error message to client
    return { content: [{ type: "text", text: errorMessage }] };
  }
}


/**
 * Main function to start the server
 */
async function main() {
// Set up stdio transport
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`${SERVER_NAME} MCP Server (v${SERVER_VERSION}) running on stdio${API_BASE_URL ? `, proxying API at ${API_BASE_URL}` : ''}`);
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
    console.error("Shutting down MCP server...");
    process.exit(0);
}

// Register signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
main().catch((error) => {
  console.error("Fatal error in main execution:", error);
  process.exit(1);
});

/**
 * Formats API errors for better readability
 * 
 * @param error Axios error
 * @returns Formatted error message
 */
function formatApiError(error: AxiosError): string {
    let message = 'API request failed.';
    if (error.response) {
        message = `API Error: Status ${error.response.status} (${error.response.statusText || 'Status text not available'}). `;
        const responseData = error.response.data;
        const MAX_LEN = 200;
        if (typeof responseData === 'string') { 
            message += `Response: ${responseData.substring(0, MAX_LEN)}${responseData.length > MAX_LEN ? '...' : ''}`; 
        }
        else if (responseData) { 
            try { 
                const jsonString = JSON.stringify(responseData); 
                message += `Response: ${jsonString.substring(0, MAX_LEN)}${jsonString.length > MAX_LEN ? '...' : ''}`; 
            } catch { 
                message += 'Response: [Could not serialize data]'; 
            } 
        }
        else { 
            message += 'No response body received.'; 
        }
    } else if (error.request) {
        message = 'API Network Error: No response received from server.';
        if (error.code) message += ` (Code: ${error.code})`;
    } else { 
        message += `API Request Setup Error: ${error.message}`; 
    }
    return message;
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 * 
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
function getZodSchemaFromJsonSchema(jsonSchema: any, toolName: string): z.ZodTypeAny {
    if (typeof jsonSchema !== 'object' || jsonSchema === null) { 
        return z.object({}).passthrough(); 
    }
    try {
        const zodSchemaString = jsonSchemaToZod(jsonSchema);
        const zodSchema = eval(zodSchemaString);
        if (typeof zodSchema?.parse !== 'function') { 
            throw new Error('Eval did not produce a valid Zod schema.'); 
        }
        return zodSchema as z.ZodTypeAny;
    } catch (err: any) {
        console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
        return z.object({}).passthrough();
    }
}
