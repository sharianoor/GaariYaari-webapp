pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('* * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/sharianoor/GaariYaari-webapp.git'
            }
        }

        stage('Verify Source') {
            steps {
                sh '''
                    set -eu
                    test -f backend/package.json
                    test -f backend/server.js
                    test -f html/index.html
                    test -f script/script.js
                    echo "Required application files found."
                '''
            }
        }

        stage('Configure Frontend') {
            steps {
                sh '''
                    set -eu
                    sed -i 's|^const API_URL = .*|const API_URL = `${window.location.protocol}//${window.location.hostname}:5002/api`;|' script/script.js
                    grep -F '5002/api' script/script.js
                '''
            }
        }

        stage('Deploy Part II') {
            steps {
                sh '''
                    set -eu

                    SOURCE_DIR="/home/ubuntu/gaariyaari-p2/source"

                    cp -r backend html script style images "$SOURCE_DIR"/

                    cd /home/ubuntu/gaariyaari-p2

                    docker compose --env-file .env config -q
                    docker compose --env-file .env up -d --build

                    echo "Part II deployment completed."
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -eu
                    docker ps --filter name=gaariyaari-frontend-p2
                    docker ps --filter name=gaariyaari-backend-p2
                    docker ps --filter name=gaariyaari-mongo-p2
                '''
            }
        }
    }

    post {
        success {
            script {
                def recipients = [
                    'sharianoor': 'sharianoor2@gmail.com',
                    'SufwanAmir': 'sufwanamir99@gmail.com'
                ]

                def author = sh(
                    script: 'git log -1 --format=%an',
                    returnStdout: true
                ).trim()

                def recipient = recipients[author]

                if (recipient) {
                    mail(
                        to: recipient,
                        subject: "GaariYaari Part-II: SUCCESS (#${env.BUILD_NUMBER})",
                        body: """Hello,

The GaariYaari Part-II Jenkins pipeline completed successfully.

Build: ${env.BUILD_NUMBER}
Job: ${env.JOB_NAME}
Commit author: ${author}
Build URL: ${env.BUILD_URL}

Please review the Jenkins console output for details.
"""
                    )
                } else {
                    echo "No email mapping found for commit author: ${author}"
                }
            }
        }

        failure {
            mail(
                to: 'sharianoor2@gmail.com,sufwanamir99@gmail.com',
                subject: "GaariYaari Part-II: FAILED (#${env.BUILD_NUMBER})",
                body: """The GaariYaari Part-II pipeline failed.

Job: ${env.JOB_NAME}
Build: ${env.BUILD_NUMBER}
Build URL: ${env.BUILD_URL}

Please review the Jenkins console output.
"""
            )
        }
    }
}
