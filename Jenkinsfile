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

                script {
                    env.COMMIT_HASH = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    env.COMMIT_AUTHOR = sh(
                        script: 'git log -1 --format=%an',
                        returnStdout: true
                    ).trim()

                    env.COMMIT_AUTHOR_EMAIL = sh(
                        script: 'git log -1 --format=%ae',
                        returnStdout: true
                    ).trim()

                    echo "Commit: ${env.COMMIT_HASH}"
                    echo "Commit author: ${env.COMMIT_AUTHOR}"
                    echo "Commit author email: ${env.COMMIT_AUTHOR_EMAIL}"
                }
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

                    echo "Deployment verification completed."
                '''
            }
        }
    }

    post {
        always {
            script {
                def result = currentBuild.currentResult ?: 'UNKNOWN'
                def recipient = env.COMMIT_AUTHOR_EMAIL?.trim()

                if (recipient &&
                    recipient.contains('@') &&
                    !recipient.endsWith('@users.noreply.github.com')) {

                    mail(
                        to: recipient,
                        subject: "GaariYaari Part-II: ${result} (#${env.BUILD_NUMBER})",
                        body: """Hello ${env.COMMIT_AUTHOR ?: 'Contributor'},

The GaariYaari Part-II Jenkins pipeline has completed.

Build Result: ${result}
Build Number: ${env.BUILD_NUMBER}
Commit: ${env.COMMIT_HASH ?: 'Unavailable'}
Commit Author: ${env.COMMIT_AUTHOR ?: 'Unavailable'}
Commit Author Email: ${recipient}
Jenkins Job: ${env.JOB_NAME}
Build URL: ${env.BUILD_URL}

Please open the Build URL to review the complete console output.

Regards,
GaariYaari Jenkins Pipeline
"""
                    )

                    echo "Build notification sent to commit author email: ${recipient}"
                } else {
                    echo "WARNING: No valid deliverable commit author email was found."
                    echo "Commit author: ${env.COMMIT_AUTHOR ?: 'Unavailable'}"
                    echo "Commit author email: ${recipient ?: 'Unavailable'}"
                    echo "Email notification skipped."
                }
            }
        }
    }
}
