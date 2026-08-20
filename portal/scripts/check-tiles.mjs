import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const openStreetMapHost = "tile.openstreetmap.org";
const openStreetMapName = "OpenStreetMap";
const tilePlaceholders = ["{z}", "{x}", "{y}"];

const parseEnvFile = (path) => {
  if (!existsSync(path)) {
    return {};
  }

  const values = {};

  for (const line of readFileSync(path, "utf8").replace(/^\uFEFF/, "").split("\n")) {
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

const requestedEnvPath = () => {
  const flag = process.argv.indexOf("--env-path");

  return flag === -1 ? undefined : process.argv[flag + 1];
};

const chosenEnvPath = requestedEnvPath();
const envPath = chosenEnvPath ?? join(root, ".env");

if (chosenEnvPath !== undefined && !existsSync(envPath)) {
  console.error(`No existe el fichero de entorno ${envPath}.`);
  process.exit(1);
}

const fromEnvFile = parseEnvFile(envPath);

const resolve = (key) =>
  (chosenEnvPath === undefined
    ? process.env[key] ?? fromEnvFile[key] ?? ""
    : fromEnvFile[key] ?? ""
  ).trim();

const tileUrl = resolve("NEXT_PUBLIC_MAP_TILE_URL");
const attribution = resolve("NEXT_PUBLIC_MAP_ATTRIBUTION");
const providerName = resolve("NEXT_PUBLIC_MAP_PROVIDER_NAME");
const disabled = resolve("NEXT_PUBLIC_MAP_ENABLED") === "false";

const servesOpenStreetMap = tileUrl === "" || tileUrl.includes(openStreetMapHost);
const namesOpenStreetMap =
  providerName === "" || providerName === openStreetMapName;

const contractedProviderFindings = () => {
  const findings = [];

  if (!tileUrl.startsWith("https://")) {
    findings.push("NEXT_PUBLIC_MAP_TILE_URL — tiene que ser https:");
  }

  if (!tilePlaceholders.every((placeholder) => tileUrl.includes(placeholder))) {
    findings.push("NEXT_PUBLIC_MAP_TILE_URL — le faltan los marcadores {z}/{x}/{y}");
  }

  if (attribution === "" || attribution.includes(openStreetMapName)) {
    findings.push(
      "NEXT_PUBLIC_MAP_ATTRIBUTION — cada proveedor exige la suya, y sigue siendo la de OpenStreetMap",
    );
  }

  if (namesOpenStreetMap) {
    findings.push(
      `NEXT_PUBLIC_MAP_PROVIDER_NAME — sirves teselas de otro proveedor y los textos legales siguen nombrando a ${openStreetMapName}`,
    );
  }

  return findings;
};

const report = (findings) => {
  console.error("La configuración de teselas no es coherente. Pendiente:");

  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }

  console.error(
    `\nDefine esas variables en ${envPath}.\n` +
      "El porqué está en .claude/deploy/blockers.md §B5.",
  );

  process.exit(1);
};

if (disabled) {
  console.log(`Mapa desactivado (${envPath}): no se pide ni una tesela.`);
  process.exit(0);
}

const findings = servesOpenStreetMap
  ? namesOpenStreetMap
    ? []
    : [
        `NEXT_PUBLIC_MAP_PROVIDER_NAME — dice «${providerName}» y las teselas salen de ${openStreetMapName}`,
      ]
  : contractedProviderFindings();

if (findings.length > 0) {
  report(findings);
}

if (servesOpenStreetMap) {
  console.warn(
    `Teselas de ${openStreetMapName} (${envPath}). La Tile Usage Policy de la OSMF\n` +
      "no ampara el uso intensivo: es deuda asumida para la web, no para una app publicada.",
  );
  process.exit(0);
}

console.log(`Teselas de ${providerName}, con su atribución (${envPath}).`);
