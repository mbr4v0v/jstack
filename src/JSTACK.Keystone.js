/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Keystone API Module
// -------------------

// This file provides functions to access Keystone API's operations,
// such as authenticate and  gettenants.

JSTACK.Keystone = (function(JS, undefined) {

    // `STATES` defines different authentication states. This
    // can be useful for applications to know when they can
    // access to authentication tokens.

    var STATES = {
        DISCONNECTED : 0,
        AUTHENTICATING : 1,
        AUTHENTICATED : 2,
        AUTHENTICATION_ERROR : 3
    }

    // `params` stores info about Keystone service:
    var params = {
        // * **url** points to Keystone location. Typically it could be http://host:5000/
        url : undefined,
        // * **currentstate** stores the state of this API based on options given by `STATES`
        currentstate : undefined,
        // * **access** stores the last information retreived during last successful authentication
        access : undefined,
        // * **token** gives the authentication info obtained during last successful authentication
        token : undefined
    }

    // We need to initialize this API by passing the Keystone's URL. This URL usually follows the next
    // pattern: http://host:5000/
    // This API will initialize parameters such as `currentstate`, `token` and `access`.
    var init = function(keystoneUrl) {
        params.url = keystoneUrl;
        params.access = undefined;
        params.token = undefined;
        params.currentstate = STATES.DISCONNECTED;
    }
    
    // Authentication function
    // ------------------------
    // This API offers Keystone authentication.
    var authenticate = function(username, password, token, tenant, callback, error) {
        var credentials = {};
        // This authentication needs a `username`, a `password`. Or a `token`.
        if (token != undefined) {
            credentials = {"auth": {"token": {"id": token}}};
        }
        else {
            credentials = {
                "auth" : {
                    "passwordCredentials" : {
                        "username" : username,
                        "password" : password
                    }
                }
            };
        }

        // User also can provide a `tenant`.
        if(tenant !== undefined) {
            credentials.auth.tenantId = tenant;
        }

        // During authentication the state will be `AUTHENTICATION`.
        params.currentstate = STATES.AUTHENTICATING;

        // Once Keystone server sends a response to this API client it will call the function
        // `callback` with the result, if provided. It also updates the state to `AUTHENTICATED`
        // and stores result in `access`.
        var _onOK = function(result) {
            params.currentstate = JS.Keystone.STATES.AUTHENTICATED;
            params.access = result.access;
            params.token = params.access.token.id;
            if(callback != undefined)
                callback(result);
        }
        // In case of an error the state will be `AUTHENTICATION_ERROR` and it throws the corresponding
        // error with its description.
        var _onError = function(message) {
            params.currentstate = STATES.AUTHENTICATION_ERROR;
            error(message);
        }
        
        // A typical response would be:
        //
        //     {
        //        "token": {
        //            "expires": "2012-03-10T15:41:58.905480",
        //            "id": "d1eb612e-24fa-48b3-93d4-fc6c90379078",
        //            "tenant": {
        //                "id": "2",
        //                "name": "demo"
        //            }
        //        },
        //        "serviceCatalog": [
        //              {
        //                "endpoints": [
        //                    {
        //                        "adminURL": "http://host.name:8774/v1.1/2",
        //                        "region": "nova",
        //                        "internalURL": "http://host.name:8774/v1.1/2",
        //                        "publicURL": "http://host.name:80/v1.1/2"
        //                    }
        //                ],
        //                "type": "compute",
        //                "name": "nova"
        //            },
        //        ],
        //        "user": {
        //            "id": "1",
        //            "roles": [
        //                {
        //                    "tenantId": "2",
        //                    "id": "1",
        //                    "name": "Admin"
        //                },
        //                {
        //                    "id": "1",
        //                    "name": "Admin"
        //                },
        //            ],
        //            "name": "admin"
        //        }
        //       }
        JS.Comm.post(params.url + "tokens", credentials, undefined, _onOK, _onError);
    }
    
    // Retreiving service information
    // ------------------------------
    // The user can also obtain information about each service which is configured in Keystone.
    var getservice = function(name) {
        // Only if the client is currently authenticated.
        if(params.currentstate != STATES.AUTHENTICATED) {
            return undefined;
        }
        for(var index in params.access.serviceCatalog) {
            var service = params.access.serviceCatalog[index];
            if(name == service.name) {
                // This function will return an object with the next structure:
                //
                //     service: {
                //          endpoints: [
                //               {
                //               adminURL: "http://host.name:8774/v1.1/2",
                //               internalURL: "http://host.name:8774/v1.1/2",
                //               publicURL: "http://host.name:80/v1.1/2",
                //               region: "nova"
                //               },
                //               name: "nova",
                //               type: "compute"
                //          ]
                //     }
                //
                return service;
            }
        }
        return undefined;
    }
    
    // Tenant information function
    // ---------------------------
    // User can obtain information about available tenants.
    var gettenants = function(callback) {
        
        // Only when the user is already authenticated.
        if(params.currentstate == JS.Keystone.STATES.AUTHENTICATED) {
            // This function will return tenant information following next pattern:
            //
            //         tenants: {
            //                links: [
            //                        {       href: "http://host.name:5000/tenants",
            //                                rel: "prev"
            //                        }
            //                ],
            //                values: [
            //                        {
            //                                description: "test",
            //                                enabled: true,
            //                                id: "3",
            //                                name: "test"
            //                        },
            //                        {
            //                                description: "None",
            //                                enabled: true,
            //                                id: "2",
            //                                name: "demo"
            //                        },
            //                        {
            //                                description: "None",
            //                                enabled: true,
            //                                id: "1",
            //                                name: "admin"
            //                        }
            //                ]
            //         }
            //
            var _onOK = function(result) {
                if(callback != undefined)
                    callback(result);
            }
            
            var _onError = function(result) {
                // If error occurs it will send its description.
                throw Error(result);
            }

            JS.Comm.get(params.url + "tenants", params.token, _onOK, _onError);
        }
    }
    // Public Functions and Variables
    // ---------------------------
    // This is the list of available public functions and variables
    return {
        // Variables:
        STATES : STATES,
        params : params,
        // Functions:
        init : init,
        authenticate : authenticate,
        gettenants : gettenants,
        getservice : getservice
    }
})(JSTACK);
