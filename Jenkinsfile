#! /usr/bin/env groovy

pipeline {
    agent { label 'docker' }

    stages {
        stage('Build') {
            steps {
                dir("code") {
                    sh 'docker-compose build --no-cache'
                }
            }
        }
        stage('Test') {
            steps {
                dir("code") {
                    sh 'docker-compose run --rm app npm run ci'
                }
            }
        }
    }
}