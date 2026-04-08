pipeline {
    agent any
    // "agent any" means: run this pipeline on any available Jenkins worker.
    // For now you only have one (your local machine), so it always uses that.

    tools {
        nodejs 'NodeJS-18'
        // This tells Jenkins to use the NodeJS installation you'll configure
        // under Manage Jenkins → Tools → NodeJS installations
    }

    stages {

        stage('Clone Repository') {
            // WHY: Jenkins needs to pull your latest code before it can do anything.
            // Even though the webhook triggered the build, Jenkins doesn't
            // automatically have the code — it must explicitly check it out.
            steps {
                checkout scm
                // "scm" means "use the source control config from the job settings"
                // It will clone your repo at the commit that triggered this build.
            }
        }

        stage('Install Dependencies') {
            // WHY: Your node_modules folder is in .gitignore, so it's not in the repo.
            // Jenkins must install them fresh on every build. This ensures
            // no one accidentally committed a broken node_modules.
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            // WHY: This is the most critical stage. If tests fail, we stop here.
            // We never deploy broken code. This is the entire value of CI.
            steps {
                sh 'npm test'
            }
            post {
                always {
                    // WHY: Even if the stage fails, we still want to publish
                    // test results so Jenkins can show which tests failed.
                    junit 'test-results/results.xml'
                }
            }
        }

        stage('Deploy') {
            // WHY: Only runs if tests passed (Jenkins stops on stage failure by default).
            // We use a simple file copy here for local demo.
            // In a real project this would SSH into EC2 and restart the app.
            when {
                branch 'main'
                // WHY: Only deploy code from the main branch.
                // Feature branches should never auto-deploy to staging.
            }
            steps {
                echo 'Tests passed! Deploying application...'
                sh '''
                    mkdir -p /tmp/deployed-app
                    cp -r . /tmp/deployed-app
                    echo "Deployed at $(date)" > /tmp/deployed-app/deploy.log
                    echo "Deployment complete. App is at /tmp/deployed-app"
                '''
                // For real EC2 deployment you'd replace the above with:
                // sshagent(['ec2-ssh-key']) {
                //     sh "ssh ubuntu@YOUR_EC2_IP 'cd /app && git pull && npm install && pm2 restart app'"
                // }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Build #${BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline failed at stage. Check logs above."
        }
    }
}
