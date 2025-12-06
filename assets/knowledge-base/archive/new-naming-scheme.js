import path from "path"
import { fileURLToPath } from "url"
import { promises } from "fs"
import { expand } from "@foerderfunke/sem-ops-utils"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

const map = {
    "ff:hilfe-zum-lebensunterhalt": "ff:hlu",
    "ff:kindergeld": "ff:kdg",
    "ff:kinderzuschlag": "ff:kzl",
    "ff:bafoeg": "ff:bfg",
    "ff:buergergeld": "ff:bgd",
    "ff:arbeitslosengeld": "ff:alg",
    "ff:berufsausbildungsbeihilfe-bab": "ff:bab",
    "ff:wohngeld": "ff:wog",
    "ff:grundsicherung-im-alter-und-bei-erwerbsminderung": "ff:gsi",
    "ff:bildung-und-teilhabe-bei-bezug-von-buergergeld": "ff:but",
    "ff:ausbildungsgeld": "ff:asg",
    "ff:blindengeld": "ff:blg",
    "ff:blindenhilfe": "ff:blh",
    "ff:bundesfoerderung-effiziente-gebaeude": "ff:beg",
    "ff:exist-gruendungsstipendium": "ff:exs",
    "ff:forschungszulage": "ff:fzl",
    "ff:ibb-altersgerecht-wohnen": "ff:iaw",
    "ff:ibb-gruendungsbonus": "ff:igb",
    "ff:ifb-gruendung-nachfolge": "ff:ifn",
    "ff:ilb-kredit-gruendung": "ff:ilg",
    "ff:kurzzeitige-arbeitsverhinderung": "ff:kav",
    "ff:uebergangsgeld": "ff:ueg",
    "ff:wolfenbuettel-ansiedlung": "ff:wfa",
    "ff:wolfenbuettel-gastronomische-aussenmoeblierung": "ff:wfgam",
    "ff:wolfenbuettel-stiftung-organisation": "ff:wfsto",
    "ff:wolfenbuettel-stiftung-person": "ff:wfstp",
    "ff:allgemeine-krankenversicherungspflicht": "ff:akv",
    "ff:arbeitsassistenz": "ff:aas",
    "ff:eingliederungshilfe": "ff:egh",
    "ff:erwerbsminderungsrente-teilweise": "ff:emt",
    "ff:erwerbsminderungsrente-voll": "ff:emv",
    "ff:persoenliches-budget": "ff:pbg",
    "ff:schwerbehindertenausweis": "ff:sba",
    "ff:substitutionstherapie-diamorphin": "ff:std",
    "ff:substitutionstherapie-regulaer": "ff:str"
}

// rename in knowledge-base shacl files

const shaclDirs = [
    `${ROOT}/shacl`,
    `${ROOT}/shacl/beta`,
    `${ROOT}/shacl/bielefeld`
]
let shaclFiles = []
for (let shaclDir of shaclDirs) {
    shaclFiles = shaclFiles.concat((await promises.readdir(shaclDir)).map(file => `${shaclDir}/${file}`).filter(file => file.endsWith(".ttl")))
}

for (let file of shaclFiles) {
    // let filename = path.basename(file)
    let content = await promises.readFile(file, "utf8")

    let cls = "ff:RequirementProfile"
    let regex = new RegExp(`(.*?)\\s+a\\s+${cls}`)
    const oldRpUri = content.match(regex)[1].trim()
    const newRpUri = map[oldRpUri]
    content = content.split(oldRpUri + " a ").join(newRpUri + " a ")
    content = content.split(oldRpUri + "MainShape").join(newRpUri + "MainShape")
    content = content.split(oldRpUri + "FlowShape").join(newRpUri + "FlowShape")

    cls = "sh:PropertyShape"
    regex = new RegExp(`^([^\\s#;]+)\\s+a\\s+${cls}\\b`, "gm")
    const matches = [... content.matchAll(regex)].map(m => m[1].trim())
    for (let oldPsUri of matches) {
        let localName = oldPsUri.split(":")[1]
        let newPsUri = newRpUri + localName.charAt(0).toUpperCase() + localName.slice(1)
        content = content.split(oldPsUri).join(newPsUri)
    }

    await promises.writeFile(file, content, "utf8")
}

// rename in frontend

let jsonFile = `${ROOT}/../foerderfunke-react-app/public/assets/data/requirement-profiles/requirement-profiles.json`
let content = await promises.readFile(jsonFile, "utf8")
for (let [oldUri, newUri] of Object.entries(map)) {
    content = content.split(`"${expand(oldUri)}"`).join(`"${expand(newUri)}"`)
}
await promises.writeFile(jsonFile, content, "utf8")

jsonFile = `${ROOT}/../foerderfunke-react-app/public/assets/data/requirement-profiles/requirement-profiles-hydration.json`
content = await promises.readFile(jsonFile, "utf8")
for (let [oldUri, newUri] of Object.entries(map)) {
    content = content.split(`"${oldUri}"`).join(`"${newUri}"`)
}
await promises.writeFile(jsonFile, content, "utf8")
