# hubot-openstack

A bot to provision and work with Openstack VMs, images or flavors.

## Installing

Add dependency to `package.json`:

```console
$ npm install --save hubot-openstack
```

Include package in Hubot's `external-scripts.json`:

```json
["hubot-openstack"]
```

## Configuration

    HUBOT_OPENSTACK_COMPUTE_PROVIDER            # required - 'openstack'.
    HUBOT_OPENSTACK_COMPUTE_USERNAME            # required - The user name.
    HUBOT_OPENSTACK_COMPUTE_PASSWORD            # required - API key / password. 
    HUBOT_OPENSTACK_COMPUTE_AUTHURL             # required - Identity service URL.
    HUBOT_OPENSTACK_COMPUTE_REGION              # Region.
    HUBOT_OPENSTACK_COMPUTE_VERSION             # API version.
    HUBOT_OPENSTACK_COMPUTE_TENANTID            # The tenant ID.
    HUBOT_OPENSTACK_COMPUTE_TENANTNAME          # The tenant Name.
    HUBOT_OPENSTACK_COMPUTE_BASEPATH            # API endpoint URL (eg.: '/v2.0')
    HUBOT_OPENSTACK_COMPUTE_USESERVICECATALOG   # Identity service catalog.

## Commands

    hubot openstack-compute flavors             # Print a list of available flavors.
    hubot openstack-compute flavor <id>         # Show details about the given flavor.
    hubot openstack-compute images              # Print a list of available images to boot from.
    hubot openstack-compute image <id>          # Show details about the given image.
    hubot openstack-compute servers             # Print a list of all servers.
    hubot openstack-compute server <id>         # Show details about the given server.
    hubot openstack-compute server-create <server-name> <flavor-name> <image-name> <keyname> # Creates a server with the options specified.
    hubot openstack-compute server-delete <id>  # Deletes a server with specified id or name.
