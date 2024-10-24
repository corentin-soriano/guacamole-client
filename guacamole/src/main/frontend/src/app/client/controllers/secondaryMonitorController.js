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
angular.module('client').controller('secondaryMonitorController', ['$scope', '$injector',
    function clientController($scope, $injector) {

    // Required types
    const ClipboardData          = $injector.get('ClipboardData');

    // Required services
    const $window                = $injector.get('$window');
    const clipboardService       = $injector.get('clipboardService');
    const guacFullscreen         = $injector.get('guacFullscreen');

    // Broadcast channel
    const broadcast = new BroadcastChannel('guac_monitors');

    // Display size in pixels
    let displayWidth = 0;
    let displayHeight = 0;

    // Instantiate client, using an HTTP tunnel for communications.
    const client = new Guacamole.Client(
        new Guacamole.HTTPTunnel("tunnel")
    );

    const display = client.getDisplay();
    //display.scale(1);
    let displayContainer;

    setTimeout(function() {
        displayContainer = document.querySelector('.display')

        // Remove any existing display
        displayContainer.innerHTML = "";
    
        // Add display element
        displayContainer.appendChild(display.getElement());

        // Ready for resize
        pushBroadcastMessage('resize', true);
    }, 1000);
    
    // Error handler
    client.onerror = function(error) {
        alert(error);
    };

    // Send resize on window close
    $window.addEventListener('unload', function() {pushBroadcastMessage('resize', true);});

    // Mouse and keyboard
    const mouse = new Guacamole.Mouse(client.getDisplay().getElement());
    const keyboard = new Guacamole.Keyboard(document);

     // Move mouse on screen and send mouse events to main window
     mouse.onEach(['mousedown', 'mouseup', 'mousemove'], function sendMouseEvent(e) {

        // Ensure software cursor is shown
        display.showCursor(true);

        // Update client-side cursor
        display.moveCursor(
            Math.floor(e.state.x),
            Math.floor(e.state.y)
        );

        // Convert mouse state to serializable object
        const mouseState = {
            down: e.state.down,
            up: e.state.up,
            left: e.state.left,
            middle: e.state.middle,
            right: e.state.right,
            x: e.state.x + displayWidth, // Add offset on x as first display width
            y: e.state.y,
        };

        // Send mouse state to main window
        pushBroadcastMessage('mouseState', mouseState);
    });

    // Hide software cursor when mouse leaves display
    mouse.on('mouseout', function() {
        if (!display) return;
        display.showCursor(false);
    });

    // Handle any received clipboard data
    client.onclipboard = function clientClipboardReceived(stream, mimetype) {

        let reader;

        // If the received data is text, read it as a simple string
        if (/^text\//.exec(mimetype)) {

            reader = new Guacamole.StringReader(stream);

            // Assemble received data into a single string
            let data = '';
            reader.ontext = function textReceived(text) {
                data += text;
            };

            // Set clipboard contents once stream is finished
            reader.onend = function textComplete() {
                clipboardService.setClipboard(new ClipboardData({
                    source : 'secondaryMonitor',
                    type : mimetype,
                    data : data
                }))['catch'](angular.noop);
            };

        }

        // Otherwise read the clipboard data as a Blob
        else {
            reader = new Guacamole.BlobReader(stream, mimetype);
            reader.onend = function blobComplete() {
                clipboardService.setClipboard(new ClipboardData({
                    source : 'secondaryMonitor',
                    type : mimetype,
                    data : reader.getBlob()
                }))['catch'](angular.noop);
            };
        }

    };

    // Send keydown events to main window
    keyboard.onkeydown = function (keysym) {
        pushBroadcastMessage('keydown', keysym);
    };

    // Send keyup events to main window
    keyboard.onkeyup = function (keysym) {
        pushBroadcastMessage('keyup', keysym);
    };

    /**
     * Push broadcast message containing instructions that allows additional
     * monitor windows to draw display, resize window and more.
     * 
     * @param {!string} type
     *     The type of message (ex: handler, fullscreen, resize)
     *
     * @param {*} content
     *     The content of the message, can contain any type of serializable
     *      content.
     */
    function pushBroadcastMessage(type, content) {
        const message = {
            [type]: content
        };

        broadcast.postMessage(message);
    };

    /**
     * Handle messages sent by main window in guac_monitors channel. These
     * messages contain instructions to draw the screen, resize window, or
     * request full screen mode.
     * 
     * @param {Event} e
     *     Received message event from guac_monitors channel.
     */
    broadcast.onmessage = function broadcastMessage(message) {

        // Run the client handler to draw display
        if (message.data.handler)
            client.runHandler(message.data.handler.opcode,
                              message.data.handler.parameters);

        // Resize display and window with parameters sent by guacd in the size handler
        if (message.data.handler && message.data.handler.opcode === 'size') {

            const default_layer = 0;
            const layer = parseInt(message.data.handler.parameters[0]);

            // Ignore other layers (ex: mouse) that can have other size
            if (layer !== default_layer)
                return;

            // Set the new display size
            displayWidth  = parseInt(message.data.handler.parameters[1]) / 2;
            displayHeight = parseInt(message.data.handler.parameters[2]);

            // Get unusable winwow (ex: titlebar) height and width
            const windowUnusableHeight = $window.outerHeight - $window.innerHeight;
            const windowUnusableWidth = $window.outerWidth - $window.innerWidth;

            // Remove scrollbars
            document.querySelector('.client-main').style.overflow = 'hidden';

            // Show secondary display instead of first
            document.querySelector('.display canvas').style.left = '-' + displayWidth + 'px';

            // Resize window to the display size
            $window.resizeTo(
                displayWidth + windowUnusableWidth,
                displayHeight + windowUnusableHeight
            );

        }

        // Full screen mode instructions
        if (message.data.fullscreen) {

            // setFullscreenMode require explicit user action
            if (message.data.fullscreen !== false)
                openConsentButton();

            // Close fullscreen mode instantly
            else
                guacFullscreen.setFullscreenMode(message.data.fullscreen);

        }

    };

    /**
     * Add button to request user consent before enabling fullscreen mode to
     * comply with the setFullscreenMode requirements that require explicit
     * user action. The button is removed after a few seconds if the user does
     * not click on it.
     */
    function openConsentButton() {

        // Create the button
        const consentButton = document.createElement('button');

        // Button attributes
        consentButton.id = 'consent-fullscreen-button';
        consentButton.style.position = 'fixed';
        consentButton.style.zIndex = '2';
        consentButton.innerHTML = 'Allow fullscreen?'; // replace by translations

        // Add button on the DOM
        document.body.appendChild(consentButton);

        // User click on button
        consentButton.onclick = function enableFullscreenMode() {
            guacFullscreen.setFullscreenMode(true);
            consentButton.remove();
        };

        // Auto hide button after delay
        setTimeout(function() {
            consentButton.remove();
        }, 5000);

    };

}]);
