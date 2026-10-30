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

        stage('Identify Committer') {
            steps {
                script {
                    env.COMMIT_EMAIL = sh(
                        script: "git log -1 --format='%ae'",
                        returnStdout: true
                    ).trim()

                    echo "Commit email identified: ${env.COMMIT_EMAIL}"
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
                '''
            }
        }
    }

    post {
        always {
            script {
                def recipient = env.COMMIT_EMAIL ?: ''

                if (recipient && recipient.contains('@')) {
                    mail(
                        to: recipient,
                        subject: "GaariYaari Part-II: ${currentBuild.currentResult} (#${env.BUILD_NUMBER})",
                        body: """Hello,

The GaariYaari Part-II Jenkins pipeline has completed.

Build Result: ${currentBuild.currentResult}
Job Name: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Build URL: ${env.BUILD_URL}

Please open the build URL for details.

Regards,
Jenkins
"""
                    )

                    echo "Build notification sent to ${recipient}"
                } else {
                    echo 'No valid commit email was found. Email notification was not sent.'
                }
            }
        }
    }
}
