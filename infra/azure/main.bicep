param location string = resourceGroup().location
param environmentName string = 'imssa-media'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
  }
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${environmentName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource apiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-api'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: 'ghcr.io/your-org/imssa-media-api:latest'
          env: [
            { name: 'DATABASE_URL', secretRef: 'db-url' }
            { name: 'REDIS_URL', secretRef: 'redis-url' }
          ]
        }
      ]
    }
  }
}

resource webApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-web'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
      }
    }
    template: {
      containers: [
        {
          name: 'web'
          image: 'ghcr.io/your-org/imssa-media-web:latest'
          env: [
            { name: 'VITE_API_URL', value: 'https://${apiApp.properties.configuration.ingress.fqdn}' }
          ]
        }
      ]
    }
  }
}
