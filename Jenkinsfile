def envConfig;

pipeline {
  agent none
  options {
    withAWS(region: 'us-east-1')
    timestamps()
  }
  environment {
    BUCKET_BASE = 'sterling-ui'
    BUCKET_PATH = 'client-user-proxy' // NOTE! This is the one pass to sterling-deploy
    DOCKER_REGISTRY_URL = 'https://repo.dev.backgroundcheck.com:8083'
  }
  stages {
    stage('build-local-and-int-tests') {
      agent {
        dockerfile {
          filename 'Dockerfile.testcafe'
          args '--entrypoint=\'\' -e HOME=$WORKSPACE'
          dir 'dockerfiles'
          registryUrl "${DOCKER_REGISTRY_URL}"
        }
      }
      steps {
        sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
        sh 'pnpm run test'
        sh 'bash -o pipefail -c "pnpm audit --production --audit-level=moderate --parseable | head -100"'
      }
    }
    stage('feature-branch') {
      when {
        allOf {
          not { branch 'main' };
          not { branch 'release*' };
          not { branch 'develop' };
        }
        beforeAgent true
      }
      environment {
        DEPLOY_TO = 'dev'
      }
      stages {
        stage('user-input-backend') {
          options {
            timeout(time: 5, unit: 'MINUTES')
          }
          steps {
            script {
              try {
                env.FEATURE_BACKEND = '';
                CHOICES = ["int"];
                env.FEATURE_BACKEND = input message: 'Deploy branch using which backend?', ok: 'Deploy',
                  parameters: [choice(choices: CHOICES, description: 'Select an environment', name: 'FEATURE_BACKEND')]
              } catch (err) {
                // Dont fail build if we dont deploy it.
                currentBuild.result = "SUCCESS"
              }

            }
          }
        }
        stage('feature-branch-build-dev') {
          when {
            not { environment name: 'FEATURE_BACKEND', value: null }
            beforeAgent true
          }
          agent {
            dockerfile {
              filename 'Dockerfile.testcafe'
              args '--entrypoint=\'\' -e HOME=$WORKSPACE'
              dir 'dockerfiles'
              registryUrl "${DOCKER_REGISTRY_URL}"
            }
          }
          steps {
            script {
              def config = load('./EnvConfig.groovy');
              envConfig = config.getEnvConfig(env);
            }
            sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
            sh 'sed -i "s/###commit_date###/`git show --format="\'%ci\'" --quiet`/g" app/index.html'
            sh 'sed -i "s/###commit_hash###/`git show --format="\'%H\'" --quiet`/g" app/index.html'
            sh 'pnpm run build:clean'
            sh "pnpm run build:dev:feature"
            stash includes: 'build/**/*', name: 'feature-branch-build'
          }
        }
        stage('feature-branch-deployment-dev') {
          when {
            not { environment name: 'FEATURE_BACKEND', value: null }
            beforeAgent true
          }
          agent {
            dockerfile {
              filename 'Dockerfile.testcafe'
              args '--entrypoint=\'\' -e HOME=$WORKSPACE'
              dir 'dockerfiles'
              registryUrl "${DOCKER_REGISTRY_URL}"
            }
          }
          environment {
            ENV = envConfig.getTargetConfig('env')
            ACCOUNT = envConfig.getTargetConfig('account')
          }
          steps {
            unstash 'feature-branch-build'
            sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
            sh '''npx sterling-deploy deploy_mfe \
                    --env dev \
                    --mfe ${BUCKET_PATH} \
                    --instanceId us1 \
                    --s3Path /branch/${BRANCH_NAME} \
                    --loglevel LOG \
                    --unifiedDir true \
               '''
            echo "Feature branch deployed to https://dev.sterlingcheck.app/client-user-proxy/us1/branch/${env.BRANCH_NAME}/"
          }
        }
      }
    }
    stage('dev-deploy') {
      when {
        anyOf {
          branch 'develop'
        }
      }
      environment {
        DEPLOY_TO = 'dev'
        INSTANCE_ID = 'us1'
      }
      stages {
        stage ('load-env-config') {
          agent {
            label 'docker:linux'
          }
          steps {
            script {
              def config = load('./EnvConfig.groovy');
              envConfig = config.getEnvConfig(env);
            }
          }
        }
        stage('dev-deploy') {
          stages {
            stage('build-dev') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              // turn MULTI_INSTANCE_SW on/off for pointing instance specific API or not
              // need to keep this off until we deploy EMEA
              steps {
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                sh 'sed -i "s/###commit_date###/`git show --format="\'%ci\'" --quiet`/g" app/index.html'
                sh 'sed -i "s/###commit_hash###/`git show --format="\'%H\'" --quiet`/g" app/index.html'
                sh 'cp src/config/config_dev.ts src/config/config.ts'
                sh 'pnpm run build:clean'
                sh 'pnpm run build:dev'
                stash includes: 'build/**/*', name: 'build-dev-int'
              }
            }
            // dev logging requires resources deployed in prod AWS as we use the int cognito pool for auth
            stage ('deploy-cfa-dev') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              environment {
                ENV = envConfig.getTargetConfig('env')
                ACCOUNT = envConfig.getTargetConfig('account')
              }
              // turn backwardCompatible on/off for deploy change to the original root path of proxy on top of the instance
              // need to keep that on until we deploy EMEA
              steps {
                echo "CFA deploy to ${ENV} with DEPLOY_TO=${env.DEPLOY_TO}"
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                unstash 'build-dev-int'
                sh '''npx sterling-deploy deploy_mfe \
                        --env ${ENV} \
                        --instanceId ${INSTANCE_ID} \
                        --backwardCompatible 1 \
                        --mfe ${BUCKET_PATH} \
                        --loglevel LOG \
                        --unifiedDir true \
                   '''
              }
            }
            stage('dev-e2e-tests') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {

                sh "pnpm run testcafe:e2e:DEV"
              }
              post {
                unsuccessful {
                  archiveArtifacts artifacts: 'screenshots/**', allowEmptyArchive: true
                }
              }
            }
          }
        }
      }

    }
    stage('deploy') {
      when { branch 'release*' }
      stages {
        stage('user-input') {
          options {
            timeout(time: 5, unit: 'MINUTES')
          }
          agent {
            dockerfile {
              filename 'Dockerfile.testcafe'
              args '--entrypoint=\'\' -e HOME=$WORKSPACE'
              dir 'dockerfiles'
              registryUrl "${DOCKER_REGISTRY_URL}"
            }
          }
          environment {
              SOURCE_CONTROL = credentials('GitHub-app-sterlingcheck')
          }
          steps {
            script {
              env.DEPLOYMENT_VERSION = sh(returnStdout: true, script: "./versionForReleaseBranch");
              echo "DEPLOYMENT_VERSION=${env.DEPLOYMENT_VERSION}";

              CHOICES = ["pre", "demo", "int", "prod"];
              try {
                env.DEPLOY_TO = '';
                env.DEPLOY_TO = input message: "Deploy ${env.DEPLOYMENT_VERSION} to which environment?", ok: 'Deploy',
                  parameters: [choice(choices: CHOICES, description: 'Select an environment', name: 'DEPLOY_TO')]
              } catch (err) {
                // Dont fail build if we dont deploy it.
                currentBuild.result = "SUCCESS"
              }
              env.INSTANCE_ID = 'us1'
            }
          }
        }
        stage('demo-deploy') {
          when {
            environment name: 'DEPLOY_TO', value: 'demo'
            not { environment name: 'INSTANCE_ID', value: '' }
          }
          stages {
            stage('build-demo') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                script {
                  def config = load('./EnvConfig.groovy');
                  envConfig = config.getEnvConfig(env);
                  sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                }
                sh 'sed -i "s/###commit_date###/`git show --format="\'%ci\'" --quiet`/g" app/index.html'
                sh 'sed -i "s/###commit_hash###/`git show --format="\'%H\'" --quiet`/g" app/index.html'
                sh 'pnpm run build:clean'
                sh 'pnpm run build:demo'
                stash includes: 'build/**/*', name: 'build-demo'
              }
            }
            stage ('deploy-cfa-demo') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              environment {
                ENV = envConfig.getTargetConfig('env')
                ACCOUNT = envConfig.getTargetConfig('account')
              }
              steps {
                echo "CFA deploy to ${ENV} with DEPLOY_TO=${env.DEPLOY_TO}"
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                unstash 'build-demo'
                sh '''npx sterling-deploy deploy_mfe \
                        --env ${ENV} \
                        --instanceId ${INSTANCE_ID} \
                        --backwardCompatible 1 \
                        --mfe ${BUCKET_PATH} \
                        --loglevel LOG \
                        --unifiedDir true \
                        --appVersion ${DEPLOYMENT_VERSION} \
                   '''
              }
            }
            stage ('demo-e2e-tests') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                  sh "pnpm run testcafe:e2e:DEMO"
                }
              }
              post {
                unsuccessful {
                  archiveArtifacts artifacts: 'screenshots/**', allowEmptyArchive: true
                }
              }
            }
          }
        }
        stage('pre-deploy') {
          when {
            environment name: 'DEPLOY_TO', value: 'pre'
            not { environment name: 'INSTANCE_ID', value: '' }
          }
          stages {
            stage('build-pre') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                script {
                  def config = load('./EnvConfig.groovy');
                  envConfig = config.getEnvConfig(env);
                }
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                sh 'sed -i "s/###commit_date###/`git show --format="\'%ci\'" --quiet`/g" app/index.html'
                sh 'sed -i "s/###commit_hash###/`git show --format="\'%H\'" --quiet`/g" app/index.html'
                sh 'pnpm run build:clean'
                sh 'pnpm run build:pre'
                stash includes: 'build/**/*', name: 'build'
              }
            }
            stage ('deploy-cfa-pre') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              environment {
                ENV = envConfig.getTargetConfig('env')
                ACCOUNT = envConfig.getTargetConfig('account')
              }
              steps {
                echo "CFA deploy to ${ENV} with DEPLOY_TO=${env.DEPLOY_TO} with INSTANCE_ID=${INSTANCE_ID}"
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                unstash 'build'
                sh '''npx sterling-deploy deploy_mfe \
                        --env ${ENV} \
                        --instanceId ${INSTANCE_ID} \
                        --backwardCompatible 1 \
                        --mfe ${BUCKET_PATH} \
                        --loglevel LOG \
                        --unifiedDir true \
                        --appVersion ${DEPLOYMENT_VERSION} \
                   '''
              }
            }
          }
        }
        stage('int-deploy') {
          when {
            environment name: 'DEPLOY_TO', value: 'int'
            not { environment name: 'INSTANCE_ID', value: '' }
          }
          stages {
            stage('build-int') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                script {
                  def config = load('./EnvConfig.groovy');
                  envConfig = config.getEnvConfig(env);
                }
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                sh 'sed -i "s/###commit_date###/`git show --format="\'%ci\'" --quiet`/g" app/index.html'
                sh 'sed -i "s/###commit_hash###/`git show --format="\'%H\'" --quiet`/g" app/index.html'
                sh 'cp src/config/config_int.ts src/config/config.ts'
                sh 'pnpm run build:clean'
                sh 'pnpm run build:int'
                stash includes: 'build/**/*', name: 'build-int'
              }
            }
            stage ('deploy-cfa-int') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              environment {
                ENV = envConfig.getTargetConfig('env')
                ACCOUNT = envConfig.getTargetConfig('account')
              }
              steps {
                echo "CFA deploy to ${ENV} with DEPLOY_TO=${env.DEPLOY_TO} with INSTANCE_ID=${INSTANCE_ID}"
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                unstash 'build-int'
                sh '''npx sterling-deploy deploy_mfe \
                        --env ${ENV} \
                        --instanceId ${INSTANCE_ID} \
                        --backwardCompatible 1 \
                        --mfe ${BUCKET_PATH} \
                        --loglevel LOG \
                        --unifiedDir true \
                        --appVersion ${DEPLOYMENT_VERSION} \
                   '''
              }
            }
            stage('int-e2e-tests') {
              when {
                environment name: 'INSTANCE_ID', value: 'us1'
              }
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                sh "rm -rf node_modules && pnpm install"
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                  sh "pnpm run testcafe:e2e:INT"
                }
              }
              post {
                unsuccessful {
                  archiveArtifacts artifacts: 'screenshots/**', allowEmptyArchive: true
                }
              }
            }
          }
        }
        stage('prod-deploy') {
          when {
            environment name: 'DEPLOY_TO', value: 'prod'
            not { environment name: 'INSTANCE_ID', value: '' }
          }
          stages {
            stage('build-prod') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                script {
                  def config = load('./EnvConfig.groovy');
                  envConfig = config.getEnvConfig(env);
                }
                sh 'rm -rf node_modules && pnpm install --frozen-lockfile=true'
                sh 'sed -i "s/###commit_date###/`git show --format="\'%ci\'" --quiet`/g" app/index.html'
                sh 'sed -i "s/###commit_hash###/`git show --format="\'%H\'" --quiet`/g" app/index.html'
                sh 'cp src/config/config_prod.ts src/config/config.ts'
                sh 'pnpm run build:clean'
                sh 'pnpm run build'
                stash includes: 'build/**/*', name: 'build-prod'
              }
            }
            stage ('deploy-cfa-prod') {
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              environment {
                ENV = envConfig.getTargetConfig('env')
                ACCOUNT = envConfig.getTargetConfig('account')
              }
              steps {
                echo "CFA deploy to ${ENV} with DEPLOY_TO=${env.DEPLOY_TO} with INSTANCE_ID=${INSTANCE_ID}"
                sh "rm -rf node_modules && pnpm install"
                unstash 'build-prod'
                sh '''npx sterling-deploy deploy_mfe \
                        --env ${ENV} \
                        --instanceId ${INSTANCE_ID} \
                        --backwardCompatible 1 \
                        --mfe ${BUCKET_PATH} \
                        --loglevel LOG \
                        --unifiedDir true \
                        --appVersion ${DEPLOYMENT_VERSION} \
                   '''
              }
            }
            stage('prod-e2e-tests') {
              when {
                environment name: 'INSTANCE_ID', value: 'us1'
              }
              agent {
                dockerfile {
                  filename 'Dockerfile.testcafe'
                  args '--entrypoint=\'\' -e HOME=$WORKSPACE'
                  dir 'dockerfiles'
                  registryUrl "${DOCKER_REGISTRY_URL}"
                }
              }
              steps {
                sh "rm -rf node_modules && pnpm install"
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                  sh "pnpm run testcafe:e2e:PROD"
                }
              }
              post {
                unsuccessful {
                  archiveArtifacts artifacts: 'screenshots/**', allowEmptyArchive: true
                }
              }
            }
          }
        }
      }
    }
  }
}