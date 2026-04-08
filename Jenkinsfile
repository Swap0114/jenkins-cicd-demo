pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npx jest --ci'
            }
            post {
                always {
                    junit 'test-results/results.xml'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Tests passed! Deploying...'
                sh '''
                    mkdir -p /tmp/deployed-app
                    cp -r . /tmp/deployed-app
                    echo "Deployed at $(date)" > /tmp/deployed-app/deploy.log
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed — check logs.'
        }
    }
}   
