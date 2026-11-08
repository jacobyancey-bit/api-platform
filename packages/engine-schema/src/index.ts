export interface SchemaInferenceRequest {
    /** Raw JSON string or already-parsed JavaScript value */
    jsonInput: string | unknown;
    /** Root type/table name (defaults to "RootRecord") */
    rootName?: string;
}

export interface SchemaInferenceResult {
    rootName: string;
    typescript: string;
    zod: string;
    jsonSchema: Record<string, unknown>;
    sqlDdl: string;
}

export interface SqlToTypeScriptRequest {
    sqlDdl: string;
}

export interface SqlColumnDefinition {
    name: string;
    sqlType: string;
    tsType: string;
    zodType: string;
    nullable: boolean;
}

export interface SqlToTypeScriptResult {
    tableName: string;
    interfaceName: string;
    columns: SqlColumnDefinition[];
    typescript: string;
    zod: string;
}

export interface DatabaseUriInspectRequest {
    uri: string;
}

export interface DatabaseUriInspectResult {
    isValid: boolean;
    protocol: string;
    engine: "mongodb" | "postgresql" | "mysql" | "redis" | "unknown";
    host: string;
    port: number | null;
    databaseName: string | null;
    username: string | null;
    hasPassword: boolean;
    encodedSafeUri: string;
    envSnippet: string;
    warnings: string[];
}

function toPascalCase(input: string): string {
    const cleaned = input
        .replace(/[^a-zA-Z0-9_]+/g, " ")
        .trim()
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
    return cleaned || "RootRecord";
}

function toSnakeCase(input: string): string {
    return input
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
}

function isIsoDateString(val: string): boolean {
    return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(val);
}

function isEmailString(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function isUuidString(val: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        val
    );
}

function isUrlString(val: string): boolean {
    return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(val);
}

function formatPropertyKey(key: string): string {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

export function inferFromJson(params: SchemaInferenceRequest): SchemaInferenceResult {
    const rootName = toPascalCase(params.rootName || "RootRecord");
    let parsed: unknown;

    if (typeof params.jsonInput === "string") {
        const trimmed = params.jsonInput.trim();
        if (!trimmed) {
            throw new Error("JSON input cannot be empty.");
        }
        try {
            parsed = JSON.parse(trimmed);
        } catch (err) {
            throw new Error(
                `Invalid JSON input: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    } else {
        parsed = params.jsonInput;
    }

    if (parsed === undefined) {
        throw new Error("JSON input is required.");
    }

    const interfaces: string[] = [];

    function inferTsType(value: unknown, typeName: string, indentLevel = 0): string {
        if (value === null) return "null";
        if (Array.isArray(value)) {
            if (value.length === 0) return "unknown[]";
            const itemTypes = Array.from(
                new Set(value.map((item) => inferTsType(item, `${typeName}Item`, indentLevel)))
            );
            const combined = itemTypes.length === 1 ? itemTypes[0] : `(${itemTypes.join(" | ")})`;
            return `${combined}[]`;
        }
        if (typeof value === "object") {
            const obj = value as Record<string, unknown>;
            const entries = Object.entries(obj);
            if (entries.length === 0) return "Record<string, unknown>";

            const lines = entries.map(([key, val]) => {
                const childTypeName = `${typeName}${toPascalCase(key)}`;
                const propType = inferTsType(val, childTypeName, indentLevel + 1);
                return `  ${formatPropertyKey(key)}: ${propType};`;
            });

            const interfaceBlock = `export interface ${typeName} {\n${lines.join("\n")}\n}`;
            interfaces.push(interfaceBlock);
            return typeName;
        }
        return typeof value;
    }

    function inferZodExpr(value: unknown, indent = 0): string {
        const pad = "  ".repeat(indent);
        const innerPad = "  ".repeat(indent + 1);

        if (value === null) return "z.null()";
        if (typeof value === "boolean") return "z.boolean()";
        if (typeof value === "number") {
            return Number.isInteger(value) ? "z.number().int()" : "z.number()";
        }
        if (typeof value === "string") {
            if (isUuidString(value)) return "z.string().uuid()";
            if (isEmailString(value)) return "z.string().email()";
            if (isUrlString(value)) return "z.string().url()";
            if (isIsoDateString(value)) return "z.string().datetime()";
            return "z.string()";
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return "z.array(z.unknown())";
            const firstItemSchema = inferZodExpr(value[0], indent);
            return `z.array(${firstItemSchema})`;
        }
        if (typeof value === "object") {
            const obj = value as Record<string, unknown>;
            const entries = Object.entries(obj);
            if (entries.length === 0) return "z.record(z.string(), z.unknown())";

            const props = entries.map(([key, val]) => {
                return `${innerPad}${formatPropertyKey(key)}: ${inferZodExpr(val, indent + 1)},`;
            });
            return `z.object({\n${props.join("\n")}\n${pad}})`;
        }
        return "z.unknown()";
    }

    function inferJsonSchemaNode(value: unknown): Record<string, unknown> {
        if (value === null) return { type: "null" };
        if (typeof value === "boolean") return { type: "boolean" };
        if (typeof value === "number") {
            return { type: Number.isInteger(value) ? "integer" : "number" };
        }
        if (typeof value === "string") {
            if (isUuidString(value)) return { type: "string", format: "uuid" };
            if (isEmailString(value)) return { type: "string", format: "email" };
            if (isUrlString(value)) return { type: "string", format: "uri" };
            if (isIsoDateString(value)) return { type: "string", format: "date-time" };
            return { type: "string" };
        }
        if (Array.isArray(value)) {
            return {
                type: "array",
                items: value.length > 0 ? inferJsonSchemaNode(value[0]) : {},
            };
        }
        if (typeof value === "object") {
            const obj = value as Record<string, unknown>;
            const properties: Record<string, unknown> = {};
            const required: string[] = [];

            for (const [key, val] of Object.entries(obj)) {
                properties[key] = inferJsonSchemaNode(val);
                if (val !== null && val !== undefined) {
                    required.push(key);
                }
            }

            return {
                type: "object",
                properties,
                required,
                additionalProperties: false,
            };
        }
        return {};
    }

    function inferSqlDdl(value: unknown, tableName: string): string {
        const targetSample =
            Array.isArray(value) && value.length > 0 && typeof value[0] === "object"
                ? value[0]
                : value;

        if (!targetSample || typeof targetSample !== "object" || Array.isArray(targetSample)) {
            return `-- Primitive or non-tabular JSON input; wrapped in single-column table\nCREATE TABLE ${toSnakeCase(tableName)} (\n  id SERIAL PRIMARY KEY,\n  payload JSONB NOT NULL\n);`;
        }

        const obj = targetSample as Record<string, unknown>;
        const columns: string[] = [];
        const hasId = Object.keys(obj).some((k) => k.toLowerCase() === "id");

        if (!hasId) {
            columns.push("  id SERIAL PRIMARY KEY");
        }

        for (const [key, val] of Object.entries(obj)) {
            const colName = toSnakeCase(key) || "column_value";
            const isPrimaryKey = key.toLowerCase() === "id";
            let sqlType = "TEXT";

            if (val === null) {
                sqlType = "TEXT";
            } else if (typeof val === "boolean") {
                sqlType = "BOOLEAN NOT NULL";
            } else if (typeof val === "number") {
                sqlType = Number.isInteger(val) ? "INTEGER NOT NULL" : "NUMERIC(14, 4) NOT NULL";
            } else if (typeof val === "string") {
                if (isUuidString(val)) {
                    sqlType = "UUID NOT NULL";
                } else if (isIsoDateString(val)) {
                    sqlType = "TIMESTAMPTZ NOT NULL";
                } else if (val.length <= 255) {
                    sqlType = "VARCHAR(255) NOT NULL";
                } else {
                    sqlType = "TEXT NOT NULL";
                }
            } else if (typeof val === "object") {
                sqlType = "JSONB NOT NULL";
            }

            if (isPrimaryKey) {
                const pkBase = sqlType.replace(" NOT NULL", "");
                columns.push(`  ${colName} ${pkBase} PRIMARY KEY`);
            } else {
                columns.push(`  ${colName} ${sqlType}`);
            }
        }

        return `CREATE TABLE ${toSnakeCase(tableName)} (\n${columns.join(",\n")}\n);`;
    }

    const rootTsRef = inferTsType(parsed, rootName);
    const typescript =
        interfaces.length > 0
            ? interfaces.join("\n\n")
            : `export type ${rootName} = ${rootTsRef};`;

    const zodExpr = inferZodExpr(parsed);
    const zod = `import { z } from "zod";\n\nexport const ${rootName}Schema = ${zodExpr};\n\nexport type ${rootName} = z.infer<typeof ${rootName}Schema>;`;

    const jsonSchema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title: rootName,
        ...inferJsonSchemaNode(parsed),
    };

    const sqlDdl = inferSqlDdl(parsed, rootName);

    return {
        rootName,
        typescript,
        zod,
        jsonSchema,
        sqlDdl,
    };
}

export function sqlToTypeScript(params: SqlToTypeScriptRequest): SqlToTypeScriptResult {
    const rawSql = params.sqlDdl?.trim();
    if (!rawSql) {
        throw new Error("SQL DDL input cannot be empty.");
    }

    const tableMatch = rawSql.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_.\-]+)["`]?\s*\(([\s\S]+)\)/i
    );
    if (!tableMatch) {
        throw new Error("Could not parse a valid CREATE TABLE statement from SQL input.");
    }

    const rawTableName = tableMatch[1].split(".").pop() || "record";
    const body = tableMatch[2];
    const interfaceName = toPascalCase(rawTableName);

    const lines = body
        .split(/\r?\n|,/)
        .map((l) => l.trim())
        .filter(Boolean);

    const columns: SqlColumnDefinition[] = [];

    for (const line of lines) {
        if (/^(PRIMARY|FOREIGN|UNIQUE|CONSTRAINT|CHECK|INDEX|KEY)\b/i.test(line)) {
            continue;
        }

        const colMatch = line.match(/^["`]?([a-zA-Z0-9_]+)["`]?\s+([a-zA-Z0-9_()]+)/);
        if (!colMatch) continue;

        const colName = colMatch[1];
        const sqlTypeRaw = colMatch[2].toUpperCase();
        const isNotNull = /\bNOT\s+NULL\b/i.test(line) || /\bPRIMARY\s+KEY\b/i.test(line);
        const nullable = !isNotNull;

        let tsType = "string";
        let zodType = "z.string()";

        if (/^(INT|INTEGER|SMALLINT|BIGINT|SERIAL|BIGSERIAL|DECIMAL|NUMERIC|REAL|FLOAT|DOUBLE)/.test(sqlTypeRaw)) {
            tsType = "number";
            zodType = /^(INT|INTEGER|SMALLINT|SERIAL)/.test(sqlTypeRaw)
                ? "z.number().int()"
                : "z.number()";
        } else if (/^(BOOL|BOOLEAN)/.test(sqlTypeRaw)) {
            tsType = "boolean";
            zodType = "z.boolean()";
        } else if (/^(JSON|JSONB)/.test(sqlTypeRaw)) {
            tsType = "Record<string, unknown>";
            zodType = "z.record(z.string(), z.unknown())";
        } else if (/^(UUID)/.test(sqlTypeRaw)) {
            tsType = "string";
            zodType = "z.string().uuid()";
        } else if (/^(TIMESTAMP|TIMESTAMPTZ|DATE|DATETIME)/.test(sqlTypeRaw)) {
            tsType = "string";
            zodType = "z.string().datetime()";
        }

        columns.push({
            name: colName,
            sqlType: sqlTypeRaw,
            tsType: nullable ? `${tsType} | null` : tsType,
            zodType: nullable ? `${zodType}.nullable()` : zodType,
            nullable,
        });
    }

    if (columns.length === 0) {
        throw new Error("No valid column definitions found in CREATE TABLE statement.");
    }

    const tsLines = columns.map((c) => `  ${formatPropertyKey(c.name)}: ${c.tsType};`);
    const typescript = `export interface ${interfaceName} {\n${tsLines.join("\n")}\n}`;

    const zodLines = columns.map((c) => `  ${formatPropertyKey(c.name)}: ${c.zodType},`);
    const zod = `import { z } from "zod";\n\nexport const ${interfaceName}Schema = z.object({\n${zodLines.join("\n")}\n});`;

    return {
        tableName: rawTableName,
        interfaceName,
        columns,
        typescript,
        zod,
    };
}

export function inspectDatabaseUri(params: DatabaseUriInspectRequest): DatabaseUriInspectResult {
    const raw = (params.uri || "").trim();
    if (!raw) {
        throw new Error("Database connection URI is required.");
    }

    const protoIdx = raw.indexOf("://");
    if (protoIdx <= 0) {
        throw new Error(
            "Invalid database URI format. Expected protocol://user:password@host:port/database"
        );
    }

    const protocol = raw.slice(0, protoIdx).toLowerCase();
    const remainder = raw.slice(protoIdx + 3);

    // Split query string first so '?' or '#' inside raw passwords before the LAST '@' don't break host parsing
    const lastAtIdx = remainder.lastIndexOf("@");
    const authPart = lastAtIdx !== -1 ? remainder.slice(0, lastAtIdx) : null;
    const hostAndPath = lastAtIdx !== -1 ? remainder.slice(lastAtIdx + 1) : remainder;

    let rawUser: string | undefined;
    let rawPass: string | undefined;

    if (authPart !== null) {
        const firstColon = authPart.indexOf(":");
        if (firstColon !== -1) {
            rawUser = authPart.slice(0, firstColon);
            rawPass = authPart.slice(firstColon + 1);
        } else {
            rawUser = authPart;
        }
    }

    const hostMatch = hostAndPath.match(/^([^:\/?#]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?(.*))?$/);
    if (!hostMatch) {
        throw new Error(
            "Invalid database URI format. Expected protocol://user:password@host:port/database"
        );
    }

    const [, host, portStr, dbPath, queryStr] = hostMatch;
    const warnings: string[] = [];

    let engine: DatabaseUriInspectResult["engine"] = "unknown";
    if (protocol.startsWith("mongodb")) engine = "mongodb";
    else if (protocol.startsWith("postgres")) engine = "postgresql";
    else if (protocol.startsWith("mysql")) engine = "mysql";
    else if (protocol.startsWith("redis")) engine = "redis";

    const encodedUser = rawUser ? encodeURIComponent(decodeURIComponent(rawUser)) : null;
    let encodedPass: string | null = null;
    if (rawPass !== undefined) {
        try {
            encodedPass = encodeURIComponent(decodeURIComponent(rawPass));
        } catch {
            encodedPass = encodeURIComponent(rawPass);
        }
        if (encodedPass !== rawPass) {
            warnings.push(
                "Password contained special characters (@, :, /, #, ?) and was RFC-3986 percent-encoded."
            );
        }
    } else {
        warnings.push("No password detected in connection string.");
    }

    const port = portStr ? parseInt(portStr, 10) : null;
    if (protocol === "mongodb+srv" && port !== null) {
        warnings.push("mongodb+srv:// URIs cannot specify a port number.");
    }

    const authSegment = encodedUser
        ? `${encodedUser}${encodedPass !== null ? `:${encodedPass}` : ""}@`
        : "";
    const portSegment = port !== null && protocol !== "mongodb+srv" ? `:${port}` : "";
    const dbSegment = dbPath !== undefined ? `/${dbPath}` : "";
    const querySegment = queryStr ? `?${queryStr}` : "";

    const encodedSafeUri = `${protocol}://${authSegment}${host}${portSegment}${dbSegment}${querySegment}`;
    const envVarName =
        engine === "mongodb"
            ? "MONGODB_URI"
            : engine === "redis"
              ? "REDIS_URL"
              : "DATABASE_URL";

    return {
        isValid: true,
        protocol,
        engine,
        host,
        port,
        databaseName: dbPath || null,
        username: rawUser || null,
        hasPassword: Boolean(rawPass),
        encodedSafeUri,
        envSnippet: `${envVarName}="${encodedSafeUri}"`,
        warnings,
    };
}


