public class LocationConfig {
  private final net.sf.json.JSONObject locationMap;
  private final String deployTo;

  public LocationConfig(net.sf.json.JSONObject map, String deployTo){
    locationMap = map;
    this.deployTo = deployTo.toLowerCase();
  }

  def getInstances(){
    def locationMapKey = this.getLocationMapKey(deployTo);
    return locationMap[locationMapKey].keySet() as ArrayList
  }

  static def getLocationMapKey(environmentName) {
    switch (environmentName) {
      case 'prod':
        return 'prod';
      case 'int':
        return 'qa1';
      case 'pre':
        return 'dev';
      case 'demo':
        return 'demo'
      default:
        return 'dev';
    }
  }
}

def getLocationConfig(net.sf.json.JSONObject locationMap, String deployTo){
  return new LocationConfig(locationMap, deployTo);
}

return this;
