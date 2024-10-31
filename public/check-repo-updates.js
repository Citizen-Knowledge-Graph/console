let rpsCommitUponPageLoad = ""
let rpsLastNotifiedCommit = ""

async function checkForNewRepoCommits() {
    let rpsCurrentCommit = await fetchAsset("latest-rps-repo-commit.txt")
    if (!rpsCommitUponPageLoad) {
        rpsCommitUponPageLoad = rpsCurrentCommit
        rpsLastNotifiedCommit = rpsCurrentCommit
    }
    if (rpsLastNotifiedCommit !== rpsCurrentCommit) {
        console.log("requirement-profiles repo was updated since this page loaded: from commit " + rpsCommitUponPageLoad + " to " + rpsCurrentCommit)
        rpsLastNotifiedCommit = rpsCurrentCommit
    }
}
