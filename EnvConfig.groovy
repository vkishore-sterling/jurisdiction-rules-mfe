public class EnvConfig {
  private def env;

  public EnvConfig(def env){
    this.env = env;
  }

  def getTargetConfig(key) {
    def map = getMap();
    return map[key];
  }

  def getMap() {
    def envMap = [
      DEV: [
        account: '070297945946',
        env: 'dev'
      ],
      PRE: [
        account: '655343301526',
        env: 'pre'
      ],
      DEMO: [
        account: '866942773993',
        env: 'demo'
      ],
      INT: [
        account: '866942773993',
        env: 'int'
      ],
      PROD: [
        account: '338542048144',
        env: 'prod'
      ]
    ];

    switch (env.DEPLOY_TO.toLowerCase()) {
      case 'prod':
        return envMap.PROD;
      case 'int':
        return envMap.INT
      case 'demo':
        return envMap.DEMO;
      case 'pre':
        return envMap.PRE;
      default:
        return envMap.DEV;
    }
  }
}

def getEnvConfig(def env){
  return new EnvConfig(env);
}

return this;
