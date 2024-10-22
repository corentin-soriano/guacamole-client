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
 * The controller for the page used to display secondary monitors.
 */
angular.module('client').controller('secondaryMonitorController', ['$injector',
    function clientController($injector) {

    // Required services
    const $window = $injector.get('$window');

    const expected_origin = $window.location.protocol + '//' + $window.location.host;

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.style.top = 0;
    canvas.style.position = 'absolute';

    // Append canvas to .viewport
    setTimeout(function() {
        document.querySelector('.viewport').appendChild(canvas);
    }, 1000);

    // Draw on canvas
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, img.width / 2, 0, img.width / 2, img.height, 0, 0, img.width / 2, img.height);
    }

    $window.addEventListener('message', function(message) {

        // Security check
        if (message.origin !== expected_origin)
            return;

        if (message.data.size) {
            const windowUnusableHeight = $window.outerHeight - $window.innerHeight;
            const windowUnusableWidth = $window.outerWidth - $window.innerWidth;
            $window.resizeTo(
                parseInt(message.data.size.width)/2 + windowUnusableWidth,
                parseInt(message.data.size.height) + windowUnusableHeight
            );
            canvas.style.left = '0px'; //message.data.size.left;
            canvas.setAttribute('width', message.data.size.width/2);
            canvas.setAttribute('height', message.data.size.height);
        }

        if (message.data.canvas)
            img.src = message.data.canvas;

    });

}]);
