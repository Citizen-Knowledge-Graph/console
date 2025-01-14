import { fetchAsset } from "./utils.js";

let commits = {
    rps: {
        uponPageLoad: "",
        lastNotified: ""
    },
    console: {
        uponPageLoad: "",
        lastNotified: ""
    }
}

export async function checkForNewRepoCommits() {
    console.log("checking for new repo commits")
    await doCheck("rps")
    await doCheck("console")
}

async function doCheck(repo) {
    let currentCommit = await fetchAsset("latest-" + repo + "-repo-commit.txt")
    if (!commits[repo].uponPageLoad) {
        commits[repo].uponPageLoad = currentCommit
        commits[repo].lastNotified = currentCommit
    }
    if (commits[repo].lastNotified !== currentCommit) {
        console.log(repo + " repo was updated since this page loaded: from commit " + commits[repo].uponPageLoad + " to " + currentCommit)
        commits[repo].lastNotified = currentCommit
    }
}
