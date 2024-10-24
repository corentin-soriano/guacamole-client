/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * A service for adding additional monitors and handle instructions transfer.
 */
angular.module('client').factory('guacManageScreen', ['$injector', '$routeParams',
    function guacManageScreen($injector, $routeParams) {

    // Required services
    const $window = $injector.get('$window');

    const service = {};

    // Additional monitor window
    let additionalMonitor = null;

    // Guacamole Client
    let client = null;

    // Broadcast channel
    let broadcast = null;

    /**
     * Set the current Guacamole Client
     * 
     * @param {Guacamole.Client} guac_client
     *     The guacamole client where to send instructions.
     */
    service.setClient = function setClient(guac_client) {
        client = guac_client;
    }

    /**
     * Push broadcast message containing instructions that allows additional
     * monitor windows to draw display, resize window and more.
     * 
     * @param {!string} type
     *     The type of message (ex: handler, fullscreen, resize)
     *
     * @param {*} content
     *     The content of the message, can contain any type of serializable
     *     content.
     */
    service.pushBroadcastMessage = function pushBroadcastMessage(type, content) {
        if (additionalMonitor && !additionalMonitor.closed) {

            // Format message content
            const message = {
                [type]: content
            };

            // Send message on the broadcast channel
            broadcast.postMessage(message);
        }
    };

    /**
     * Open or close additional monitor window.
     */
    service.toggleMonitor = function toggleMonitor() {

        // Create additional monitor by opening new window
        if (!additionalMonitor || additionalMonitor.closed)
            additionalMonitor = $window.open(
                './#/secondaryMonitor/' + $routeParams.id, 'additionalMonitor',
                'width=' + $window.innerWidth + ',height=' + $window.innerHeight
            );

        // Close additional monitor by closing his window
        else
            service.closeMonitors();

        // Create broadcast on first launch.
        if (!broadcast) {
            broadcast = new BroadcastChannel('guac_monitors');

            /**
             * Handle messages sent by secondary monitors windows in
             * guac_monitors channel.
             * 
             * @param {Event} e
             *     Received message event from guac_monitors channel.
             */
            broadcast.onmessage = function broadcastMessage(message) {
        
                // Trigger the screen resize when new window is ready
                if (message.data.resize)
                    $window.dispatchEvent(new Event('monitor-count'));

                // Mouse state changed on secondary screen
                if (message.data.mouseState)
                    client.sendMouseState(message.data.mouseState);

                // Key down on secondary screen
                if (message.data.keydown)
                    client.sendKeyEvent(1, message.data.keydown);

                // Key up on secondary screen
                if (message.data.keyup)
                    client.sendKeyEvent(0, message.data.keyup);
            }
    
        }

    };

    /**
     * Close additional monitor.
     */
    service.closeMonitors = function closeMonitors() {

        if (additionalMonitor) {

            // Close the monitor
            additionalMonitor.close();
            additionalMonitor = null;

            // Trigger the screen resize
            $window.dispatchEvent(new Event('monitor-count'));

        }
    };

    /**
     * Get open monitors count. Force additional monitor to close if it's
     * window is closed.
     *
     * @returns {!number}
     *     Actual count of monitors.
     */
    service.getMonitorCount = function getMonitorCount() {

        // No additional monitor
        if (!additionalMonitor)
            return 1;

         // Additional monitor found, but window closed
         else if (additionalMonitor.closed) {
            service.closeMonitors();
            return 1;
        }

        // More than one monitor
        else
            return 2;

    };

    // Close additional monitors when window is unloaded
    $window.addEventListener('unload', service.closeMonitors);

    return service;

}]);
