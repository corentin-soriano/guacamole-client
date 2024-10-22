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

    // Instantiate client, using an HTTP tunnel for communications.
    const client = new Guacamole.Client(
        new Guacamole.HTTPTunnel("tunnel")
    );

    const display = client.getDisplay();
    display.scale(1);
    let displayContainer;

    setTimeout(function() {
        displayContainer = document.querySelector('.display')

        // Remove any existing display
        displayContainer.innerHTML = "";
    
        // Add display element
        displayContainer.appendChild(display.getElement());
    }, 1000);
    
    // Error handler
    client.onerror = function(error) {
        alert(error);
    };

    // Connect
    //client.connect();

    // Disconnect on close
    /*window.onunload = function() {
        client.disconnect();
    }*/

    // Mouse
    const mouse = new Guacamole.Mouse(client.getDisplay().getElement());

    mouse.onEach(['mousedown', 'mouseup', 'mousemove'], function sendMouseEvent(e) {
        console.log('mouseState: ' + e.state);
        //client.sendMouseState(e.state);
    });

    // Keyboard
    const keyboard = new Guacamole.Keyboard(document);

    keyboard.onkeydown = function (keysym) {
        console.log('keydown: ' + keysym);
        //client.sendKeyEvent(1, keysym);
    };
    
    keyboard.onkeyup = function (keysym) {
        console.log('keyup' + keysym);
        //client.sendKeyEvent(0, keysym);
    };

    $window.addEventListener('message', function(message) {

        // Security check
        if (message.origin !== expected_origin)
            return;

        if (message.data.handler)
            client.runHandler(message.data.handler.opcode,
                              message.data.handler.parameters);

        if (message.data.handler && message.data.handler.opcode === 'size') {
            document.querySelector('.client-main').style.overflow = 'hidden';

            document.querySelector('.display canvas').style.left = '-' + message.data.handler.parameters[1]/2 + 'px';
            //displayContainer.style.left = '-' + message.data.handler.parameters.width + 'px';

            const windowUnusableHeight = $window.outerHeight - $window.innerHeight;
            const windowUnusableWidth = $window.outerWidth - $window.innerWidth;
            $window.resizeTo(
                parseInt(message.data.handler.parameters[1])/2 + windowUnusableWidth,
                parseInt(message.data.handler.parameters[2]) + windowUnusableHeight
            );

        }

    });

/*    // Canvas
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
*/
}]);
