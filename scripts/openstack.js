// Description:
//   Perform Openstack actions to provision and work with VMs, images or flavors.
//
// Commands:
//   hubot openstack-compute flavors - Print a list of available flavors.
//   hubot openstack-compute flavor <id> - Show details about the given flavor.
//   hubot openstack-compute servers - Print a list of all servers.
//   hubot openstack-compute server <id> - Show details about the given server.
//   hubot openstack-compute server-create <server-name> <flavor-name> <image-name> <keyname> - Creates a server with the options specified.
//   hubot openstack-compute server-delete <id> - Deletes a server with specified id or name.
//   hubot openstack-compute images - Print a list of available images to boot from.
//   hubot openstack-compute image <id> - Show details about the given image.
//
// Dependencies:
//   pkgcloud
//   underscore
//   moment
// Author:
//   willgarcia <garcia.rodriguez.william@gmail.com>

var
    pkgcloud = require('pkgcloud'),
    moment = require('moment'),
    _ = require('underscore'),
    computeValidate = function(msg) {
        var status = 1;

        if (typeof(process.env.HUBOT_OPENSTACK_COMPUTE_PROVIDER) === 'undefined') {
            status = 0;
            msg.send('HUBOT_OPENSTACK_COMPUTE_PROVIDER isn\'t set.');
            msg.send('Please set the HUBOT_OPENSTACK_COMPUTE_PROVIDER environment variable.');
        }

        if (typeof(process.env.HUBOT_OPENSTACK_COMPUTE_USERNAME) === 'undefined') {
            status = 0;
            msg.send('HUBOT_OPENSTACK_COMPUTE_USERNAME isn\'t set.');
            msg.send('Please set the HUBOT_OPENSTACK_COMPUTE_USERNAME environment variable.');
        }

        if (typeof(process.env.HUBOT_OPENSTACK_COMPUTE_PASSWORD) === 'undefined') {
            status = 0;
            msg.send('HUBOT_OPENSTACK_COMPUTE_PASSWORD isn\'t set.');
            msg.send('Please set the HUBOT_OPENSTACK_COMPUTE_PASSWORD environment variable.');
        }

        if (typeof(process.env.HUBOT_OPENSTACK_COMPUTE_AUTHURL) === 'undefined') {
            status = 0;
            msg.send('HUBOT_OPENSTACK_COMPUTE_AUTHURL isn\'t set.');
            msg.send('Please set the HUBOT_OPENSTACK_COMPUTE_AUTHURL environment variable.');
        }

        return status;
    },
    computeClient = function() {
        return pkgcloud.compute.createClient({
                provider:   process.env.HUBOT_OPENSTACK_COMPUTE_PROVIDER,
                username:   process.env.HUBOT_OPENSTACK_COMPUTE_USERNAME,
                password:   process.env.HUBOT_OPENSTACK_COMPUTE_PASSWORD,
                authUrl:    process.env.HUBOT_OPENSTACK_COMPUTE_AUTHURL,
                region:     process.env.HUBOT_OPENSTACK_COMPUTE_REGION,
                version:    process.env.HUBOT_OPENSTACK_COMPUTE_VERSION,
                tenantId:   process.env.HUBOT_OPENSTACK_COMPUTE_TENANTID,
                tenantName: process.env.HUBOT_OPENSTACK_COMPUTE_TENANTNAME,
                basePath:   process.env.HUBOT_OPENSTACK_COMPUTE_BASEPATH,
                useServiceCatalog: process.env.HUBOT_OPENSTACK_COMPUTE_USESERVICECATALOG
            }
        );
    },
    computeFlavorInfo = function(flavor) {
        return flavor.name +
            ' - ram:' + flavor.ram +
            ' Mo, disk: ' + flavor.disk +
            'Go, vcpus: ' + flavor.vcpus +
            ', swap: ' + flavor.swap + '\n';
    },
    computeServerInfo = function(server) {
        return server.name +
            ' / ' + server.addresses.private +
            ': ' + server.status +
            ', id: ' + server.id +
            ', key_pair: ' + server.openstack.key_name +
            ', tenant: ' + server.openstack.tenant_id +
            ',  ' + moment(server.created).fromNow() + '\n';
    },
    computeImageInfo = function(image) {
        return image.name + ',  ' + moment(image.created).fromNow() + '\n';
    };

module.exports = function(robot) {
    robot.respond(/openstack-compute flavors/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }

        computeClient().getFlavors(function(err, data){
            if (err) {
                msg.reply(err);
                return;
            }

            var flavors = '';
            data.forEach(function(flavor) {
                flavors += '• ' + computeFlavorInfo(flavor);
            });
            msg.reply(flavors);
        });
    });

    robot.respond(/openstack-compute flavor (.+)/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }
        computeClient().getFlavor(msg.match[1], function(err, flavor) {
            if (err) {
                msg.reply(err);
                return;
            }

            msg.reply(computeFlavorInfo(flavor));
        });
    });

    robot.respond(/openstack-compute servers (.+)/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }

        var regexp_pattern = msg.match[1];
        var regexp = new RegExp(regexp_pattern, "gi");

        computeClient().getServers(function(err, data) {
            if (err) {
                msg.reply(err);
                return;
            }

            var servers = '';
            data.forEach(function(server) {
                if (server.name.match(regexp)) {
                    console.log(server);
                    servers += '• ' + computeServerInfo(server);
                }
            });
            msg.reply(servers);

        });
    });

    robot.respond(/openstack-compute servers$/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }

        computeClient().getServers(function(err, data) {
            if (err) {
                msg.reply(err);
                return;
            }

            var servers = '';
            data.forEach(function(server) {
                console.log(server);
                servers += '• ' + computeServerInfo(server);
            });

            if (!servers.length) {
              msg.reply('No provisioned servers');
              return;
            }
            
            msg.reply(servers);

        });
    });

    robot.respond(/openstack-compute server-create (.+) (.+) (.+) (.+)/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }

        var client = computeClient();

        client.getFlavors(function (err, flavors) {
            if (err) {
                console.dir(err);
                return;
            }

            client.getImages(function (err, images) {
                if (err) {
                    console.dir(err);
                    return;
                }

                var flavor = _.findWhere(flavors, { name: msg.match[2] });
                if (typeof(flavor) === 'undefined') {
                    msg.reply('Flavor not found.');
                    return;
                }

                var image = _.findWhere(images, { name: msg.match[3] });
                if (typeof(image) === 'undefined') {
                    msg.reply('Image not found.');
                    return;
                }

                var options = {
                    name: msg.match[1],
                    flavor: flavor.id,
                    image: image.id,
                    keyname: msg.match[4]
                };
                computeClient().createServer(options,  function(err, server) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    msg.reply('Server created: ' + server.name + ', waiting for active status');

                    server.setWait({ status: server.STATUS.running }, 5000, function (err) {
                        if (err) {
                            msg.reply(err);
                            return;
                        }
                        msg.reply(computeServerInfo(server));
                    });
                });
            });
        });
    });

    robot.respond(/openstack-compute server (.+)/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }
        computeClient().getServer(msg.match[1], function(err, server) {
            if (err) {
                msg.reply(err);
                return;
            }
            msg.reply(computeServerInfo(server));
        });
    });

    robot.respond(/openstack-compute server-delete (.+)/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }
        computeClient().destroyServer(msg.match[1], function(err, serverId) {
            if (err) {
                msg.reply(err);
                return;
            }
            msg.reply('Server ' + serverId.ok + '  Deleted');
        });
    });

    robot.respond(/openstack-compute images/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }

        computeClient().getImages(function(err, data) {
            if (err) {
                msg.reply(err);
                return;
            }

            var images = '';
            data.forEach(function(image) {
                images += '• ' + computeImageInfo(image);
            });
            msg.reply(images);

        });
    });

    robot.respond(/openstack-compute image (.+)/i, function(msg) {
        if (!computeValidate(msg)) {
            return;
        }
        computeClient().getImage(msg.match[1], function(err, image) {
            if (err) {
                msg.reply(err);
                return;
            }
            msg.reply(computeImageInfo(image));
        });
    });
};
