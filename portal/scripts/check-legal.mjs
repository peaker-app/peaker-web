import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const legalMessagesDir = join(root, "messages", "legal");

const marker = "[PENDIENTE";

const required = [
  ["LEGAL_HOLDER", "nombre o razón social del titular"],
  ["LEGAL_TAX_ID", "NIF"],
  ["LEGAL_ADDRESS", "domicilio completo"],
  ["LEGAL_EMAIL", "correo de contacto"],
];

const parseEnvFile = (path) => {
  if (!existsSync(path)) {
    return {};
  }

  const values = {};

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator > 0) {
      values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
    }
  }

  return values;
};

const fromEnvFile = parseEnvFile(join(root, ".env"));

const resolve = (key) => process.env[key] ?? fromEnvFile[key] ?? "";

const findings = [];

for (const [key, description] of required) {
  const value = resolve(key).trim();

  if (value === "") {
    findings.push(`${key} — sin definir (${description})`);
  } else if (value.includes(marker)) {
    findings.push(`${key} — sigue con el marcador (${description})`);
  }
}

for (const file of readdirSync(legalMessagesDir)) {
  if (readFileSync(join(legalMessagesDir, file), "utf8").includes(marker)) {
    findings.push(`messages/legal/${file} — contiene marcadores sin sustituir`);
  }
}

if (findings.length === 0) {
  console.log("Ficha del titular completa y textos legales sin marcadores.");
  process.exit(0);
}

console.error("Los textos legales no son publicables todavía. Pendiente:");

for (const finding of findings) {
  console.error(`  - ${finding}`);
}

console.error(
  "\nDefine esas variables en peaker-web/portal/.env (no se versiona) o en el entorno de\n" +
    "despliegue. La plantilla está en .env.example y el detalle en .claude/docs/LEGAL.md.",
);

process.exit(1);
