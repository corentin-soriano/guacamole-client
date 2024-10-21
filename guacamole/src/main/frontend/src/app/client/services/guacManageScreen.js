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
 * A service for adding additional screen.
 */
angular.module('client').factory('guacManageScreen', ['$injector',
    function guacManageScreen($injector) {

    // Required services
    const $window = $injector.get('$window');

    const expected_origin = $window.location.protocol + '//' + $window.location.host;

    var service = {};
    var additionalScreen = null;

    // Push content
    service.pushContent = function pushContent(type, content) {
        if (additionalScreen && !additionalScreen.closed) {
            const message = {
                [type]: content
            };

            additionalScreen.postMessage(message, expected_origin);
        }
    }    

    service.toggleScreen = function toggleScreen() {

        // Create additional screen
        if (!additionalScreen || additionalScreen.closed) {
            additionalScreen = $window.open(
                './#/secondaryMonitor', 'additionalScreen',
                'resizable=yes,width=' + $window.innerWidth + ',height=' + $window.innerHeight
            );

/*            setTimeout(function() {
                const targetElement = document.querySelector('.display');
                service.pushContent("html", targetElement.innerHTML);
            }, 1000)
*/

        }

        // Close additional screen
        else {
            additionalScreen.close();
            additionalScreen = null;
        }

        // Trigger the screen resize
        $window.dispatchEvent(new Event('monitor-count'));

    };

    // Close additional screens
    service.closeScreen = function closeScreen() {
        if (additionalScreen) {

            additionalScreen.close();
            additionalScreen = null;

            // Trigger the screen resize
            $window.dispatchEvent(new Event('monitor-count'));

        }
    }

    // Get screens number
    service.getScreenCount = function getScreenCount() {

        if (!additionalScreen)
            return 1;

        else if (additionalScreen.closed) {
            service.closeScreen();
            return 1;
        }

        else
            return 2;

    }

    // Close additional screens when window is unloaded
    $window.addEventListener('unload', service.closeScreen);

    return service;

}]);
