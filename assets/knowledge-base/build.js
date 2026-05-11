import { newStore, addTurtleToStore, storeToTurtle, sparqlInsertDelete } from "@foerderfunke/sem-ops-utils"
import { promises, writeFileSync, createWriteStream } from "fs"
import { fileURLToPath } from "url"
import { ZipFile } from "yazl"
import path from "path"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)))
await promises.mkdir(`${ROOT}/build`, { recursive: true })

const dfDir = path.join(ROOT, "datafields")
const shaclDir = path.join(ROOT, "shacl")

// ----------- def.built.ttl -----------

let header = ["# This file is a generated enriched merge of the following source files:"]

const defTurtleFiles = [
    `${ROOT}/definitions.ttl`,
    `${ROOT}/materialization.ttl`,
    ...(await promises.readdir(dfDir)).filter(f => f.endsWith(".ttl")).map(f => path.join(dfDir, f))
]

let defStore = newStore()
for (let file of defTurtleFiles) {
    header.push("# - " + file.substring(ROOT.length + 1))
    addTurtleToStore(defStore, await promises.readFile(file, "utf8"))
}

// ensure language tag @de-x-es: if not present, copy from @de
const query = `
    PREFIX ff: <https://foerderfunke.org/default#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX schema: <http://schema.org/>
    INSERT {
        ?subj ?pred ?labelDeEs .
    } WHERE {
        ?subj ?pred ?labelDe .
        FILTER(?pred IN (rdfs:label, schema:question, rdfs:comment, ff:title, ff:benefitInfo, ff:ineligibleGeneralExplanation))
        FILTER(LANG(?labelDe) = "de")
        FILTER NOT EXISTS {
            ?subj ?pred ?any .
            FILTER(LANG(?any) = "de-x-es")
        }
        BIND(STRLANG(STR(?labelDe), "de-x-es") AS ?labelDeEs)
    }`
await sparqlInsertDelete(query, defStore)

let turtle = header.join("\n") + "\n\n" + await storeToTurtle(defStore)
let target = `${ROOT}/build/def.built.ttl`
writeFileSync(target, turtle, "utf8")
console.log(`Wrote to ${target}`)

// ----------- rps.built.ttl -----------

header = ["# This file is a generated merge of the following source files:"]
const shaclDirs = [
    `${shaclDir}`,
    `${shaclDir}/beta`,
    `${shaclDir}/bielefeld`
]
let shaclFiles = []
for (let shaclDir of shaclDirs) {
    shaclFiles = shaclFiles.concat((await promises.readdir(shaclDir)).map(file => `${shaclDir}/${file}`).filter(file => file.endsWith(".ttl")))
}

let rpsStore = newStore()
for (let file of shaclFiles) {
    header.push("# - " + file.substring(ROOT.length + 1))
    addTurtleToStore(rpsStore, await promises.readFile(file, "utf8"))
}

turtle = header.join("\n") + "\n\n" + await storeToTurtle(rpsStore)
target = `${ROOT}/build/rps.built.ttl`
writeFileSync(target, turtle, "utf8")
console.log(`Wrote to ${target}`)

// ----------- foerderfunke-knowledge-base.zip -----------

const zipOutput = `${ROOT}/build/foerderfunke-knowledge-base.zip`

const defFiles = [
    `${ROOT}/definitions.ttl`,
    `${ROOT}/materialization.ttl`,
    `${ROOT}/consistency.ttl`
]

async function addDirToZip(zip, dir, zipBasePath = "") {
    const entries = await promises.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const zipPath = path.join(zipBasePath, entry.name)
        if (entry.isDirectory()) {
            await addDirToZip(zip, fullPath, zipPath)
        } else if (entry.isFile()) {
            zip.addFile(fullPath, zipPath)
        }
    }
}

const zip = new ZipFile()

const infoTxt = `This ZIP file contains all the semantic definitions from the FörderFunke knowledge-base.\nCreated: ${new Date().toISOString()}`
zip.addBuffer(Buffer.from(infoTxt, "utf8"), "info.txt")

await addDirToZip(zip, dfDir, "datafields")
await addDirToZip(zip, shaclDir, "shacl")
for (const file of defFiles) zip.addFile(file, path.basename(file))

zip.end()

await new Promise((resolve, reject) => {
    zip.outputStream
        .pipe(createWriteStream(zipOutput))
        .on("close", resolve)
        .on("error", reject)
})

console.log(`Wrote to ${zipOutput}`)
