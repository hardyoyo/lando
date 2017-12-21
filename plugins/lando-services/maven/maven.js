/**
 * Lando maven service builder
 *
 * @name maven
 */

'use strict';

module.exports = function(lando) {

  // Modules
  var _ = require('lodash');
  // var addScript = lando.services.addScript;
  var addConfig = lando.services.addConfig;
  var buildVolume = lando.services.buildVolume;

  // "Constants"
  var defaultConfDir = lando.config.engineConfigDir;
  var userPath = 'environment.LANDO_WEBROOT_USER';

  /**
   * Supported versions for maven (many more available, look at the supported
   * tags list on Docker Hub: https://hub.docker.com/r/library/maven/)
   */
  var versions = [
    '3.5-jdk-8',
    '3.5.2-jdk-8',
    'latest',
    'custom'
  ];

  /**
   * Return the networks needed
   */
  var networks = function() {
    return {};
  };

  /**
   * Build out maven
   */
  var services = function(name, config) {

    // Start a services collector
    var services = {};

    // Path
    var path = [
      '/usr/local/sbin',
      '/usr/local/bin',
      '/usr/local/bundle/bin',
      '/usr/sbin',
      '/usr/bin',
      '/sbin',
      '/bin'
    ];

    // Define config mappings
    var configFiles = {

  // TODO: hard code this a bit more, I suppose, because this isn't working
// example: https://github.com/lando/lando/blob/752c2086f949b00d94be764027baffefda467d42/plugins/lando-recipes/drupal7/drupal7.js#L16
        mavendotm2folderpath: '/home/' + userPath + '/.m2',
      webroot: config._mount
    };

    var workingDir = config.mount;
      // Add the webroot if its there
    if (_.has(config, 'webroot')) {
      configFiles.webroot = configFiles.webroot + '/' + config.webroot;
      workingDir = configFiles.webroot;
    }

    // Volumes
    var vols = [
      '/usr/local/bin',
      '/usr/local/share',
      '/usr/local/bundle'
    ];

    // Basic config
    var cliCmd = 'tail -f /dev/null';
    var version = config.version || '2';
    var command = config.command || cliCmd;

    // Arrayify the command if needed
    if (!_.isArray(command)) {
      command = [command];
    }

    // Start with the maven base
    var maven = {
      image: 'maven:' + version,
      environment: {
        TERM: 'xterm',
        PATH: path.join(':')
      },
      'working_dir': workingDir,
      volumes: vols,
      command: '/bin/sh -c "' + command.join(' && ') + '"',
    };

    // Set the default Maven dotm2 folder path
    var mavenDotm2FolderPath = ['maven', 'dotm2'];
    var confVol = buildVolume(mavenDotm2FolderPath,
        configFiles.mavendotm2folderpath, defaultConfDir);

    // write the configs out
    maven.volumes = addConfig(confVol, maven.volumes);

    // Handle custom config files
    _.forEach(configFiles, function(file, type) {
      if (_.has(config, 'config.' + type)) {
        var local = config.config[type];
        var customConfig = buildVolume(local, file, '$LANDO_APP_ROOT_BIND');
        maven.volumes = addConfig(customConfig, maven.volumes);
      }
    });

   /**
    * Helper to return tooling config
    */
    var tooling = function() {

    // Get our default tooling opts
    var tooling = {
      node: {
        service: 'maven'
      },
      npm: {
        service: 'maven'
      },
      yarn: {
        service: 'maven'
      },
      mongo: {
        service: 'database',
        description: 'Drop into the mongo shell'
      }
    };

    // Return the toolz
    return tooling;

  };

   /**
    * Build out Maven
    */
    var build = function(name, config) {

    // Start up our build
    var build = {};

    // Get our things
    build.services = services(config);
    build.tooling = tooling();

    // Return the things
    return build;

  };

    // Add mvn to the tooling
    build.tooling.mvn = {
      service: 'maven',
      description: 'Run Maven (mvn) commands'
    };

    // If we have not specified a command we should assume this service was intended
    // to be run for CLI purposes
    if (!_.has(config, 'command')) {
      maven.ports = [];
    }

    // // And if not we need to add in an additional cli container so that we can
    // // run things like lando bundler install before our app starts up
    // else {
    //
    //   // Spoof the config and add some internal properties
    //   var cliConf = {
    //     type: 'maven:' + version,
    //     _app: config._app,
    //     _root: config._root,
    //     _mount: config._mount
    //   };
    //
    //   // Extract the cli service and add here
    //   var cliCompose = lando.services.build('cli', 'maven:' + version, cliConf);
    //   services[name + '_cli'] = cliCompose.services.cli;
    //
    // }
    //

    // // Generate some certs we can use
    // if (config.ssl) {
    //
    //   // Add the ssl port
    //   maven.ports.push('443');
    //
    //   // Add in an add cert task
    //   maven.volumes = addScript('add-cert.sh', maven.volumes);
    //
    // }

    // Put it all together
    services[name] = maven;

    // Return our service
    return services;

  };

  /**
   * Metadata about our service
   */
  var info = function() {
    return {};
  };

  /**
   * Return the volumes needed
   */
  var volumes = function() {

    // Construct our volumes
    var volumes = {
      data: {}
    };

    // Return the volumes
    return volumes;

  };

  return {
    info: info,
    networks: networks,
    services: services,
    versions: versions,
    volumes: volumes,
    configDir: __dirname
  };

};
