# Jenkins CI/CD Pipeline — My First DevOps Project

I built this project to learn how CI/CD actually works in the real world.
Not from a tutorial that goes perfectly — but by actually breaking things,
debugging them, and figuring out why.

The goal was simple: push code to GitHub, and have it automatically tested
and deployed without me touching anything manually.

Spoiler: it took way more debugging than expected. All of it is documented
below.


## What It Does

Every time I push code to the main branch, this happens automatically:

1. GitHub sends a signal to Jenkins saying "hey, new code just arrived"
2. Jenkins pulls the latest code
3. Installs all dependencies fresh (as if it's a brand new machine)
4. Runs my unit tests
5. If tests pass → deploys the app
6. If tests fail → stops immediately, never deploys broken code

The whole thing runs in about 14 seconds. No manual steps.

## What I Used

- **Jenkins** — the automation server that runs the pipeline
- **AWS EC2** — where Jenkins lives (Ubuntu 22.04, t2.medium)
- **Node.js + Express** — the app being tested and deployed
- **Jest + Supertest** — for writing and running unit tests
- **GitHub Webhooks** — the trigger that connects a git push to Jenkins

---

## The Errors I Hit (This Is the Real Story)

### The Jenkins repo wouldn't install on Ubuntu 24.04

The very first thing I tried to do was install Jenkins and it failed.
Ubuntu 24.04 didn't trust the Jenkins package repository because of a
GPG key format mismatch. Spent a good amount of time on this one.

The fix was to pull the key directly from Ubuntu's own keyserver
using the exact key ID from the error message, rather than downloading
it from the Jenkins website:

```bash
sudo gpg --keyserver keyserver.ubuntu.com --recv-keys 7198F4B714ABFC68
sudo gpg --export 7198F4B714ABFC68 | sudo tee /usr/share/keyrings/jenkins-keyring.gpg
```

Nobody tells you this in the official Jenkins docs for Ubuntu 24.04.


### My EC2 instance completely died mid-build

This was the most painful one. Jenkins was configured to download
Node.js during every pipeline run. The first time it tried this on
a t2.micro instance (1GB RAM), the server ran out of memory mid-download
and became completely unresponsive. SSH stopped working. The browser
stopped loading. The instance was just... gone.

Had to go into the AWS Console, force stop it, upgrade to a t2.medium
(4GB RAM), and restart everything.

The actual fix in the Jenkinsfile was removing this block entirely:
```groovy
tools {
    nodejs 'NodeJS-18'  // this was downloading Node.js on EVERY build
}
```

And just using the Node.js already installed on the EC2 system.
Lesson learned — never run Jenkins on t2.micro.

---

### jest: not found

After fixing the instance crash, the pipeline ran but failed with:
enkins runs everything in a clean workspace. Even though jest was
installed, it wasn't in the system PATH where Jenkins was looking.

Fix was simple — use `npx jest` instead of just `jest` in package.json.
`npx` looks inside node_modules/.bin/ automatically:
```json
"test"

### Cannot find module 'express'

Pipeline ran, tests ran, but immediately crashed with:
This one taught me something important about how CI works.
Jenkins starts completely fresh on every build — it runs npm install
from scratch using only what's in package.json. Express was installed
on my machine but not properly saved to package.json, so Jenkins had
no idea it existed.

Fix:
```bash
npm install express --save
npm install jest jest-junit supertest --save-dev
```

Always commit both package.json AND package-lock.json.

### Typed 'yes' instead of pressing Enter during SSH key generation

Small but embarrassing one. When ssh-keygen asked where to save the key,
I typed 'yes' instead of just pressing Enter. The key got saved to a file
literally named 'yes' instead of ~/.ssh/id_ed25519.

Had to run ssh-keygen again and actually press Enter this time.

### GitHub webhook broke after EC2 restart

After upgrading the instance type, the EC2 public IP changed.
GitHub was still sending webhooks to the old IP, so Jenkins
stopped triggering automatically.

Had to go back to GitHub → repo Settings → Webhooks and update
the payload URL with the new IP.

Note to self: set up an Elastic IP next time to avoid this.


## What I Learned From All of This

CI/CD is not just about writing a Jenkinsfile. The real skill is
understanding why each piece exists and what breaks when it's wrong.

A few things that stuck with me:

  Jenkins runs in a completely isolated workspace. Nothing from your
  local machine exists there. If it's not in package.json, it doesn't exist.
 
  t2.micro is not enough for Jenkins. It will crash. Use t2.medium minimum.

  EC2 public IPs change on restart. Either use Elastic IP or remember
  to update your webhooks.

  `npx` is your friend in CI environments. It finds binaries inside
  node_modules without needing global installs.

  Pipeline as Code (Jenkinsfile committed to the repo) is always better
  than clicking through the Jenkins UI. It's version controlled,
  reviewable, and reproducible.

---

## Project Structure
jenkins-cicd-demo/
├── index.js             Express app with two endpoints
├── Jenkinsfile          The entire pipeline as code
├── package.json         All dependencies properly saved
└── tests/
└── app.test.js      Unit tests for both endpoints

 Author

Swaroop — DevOps Engineer 

GitHub: https://github.com/Swap0114
