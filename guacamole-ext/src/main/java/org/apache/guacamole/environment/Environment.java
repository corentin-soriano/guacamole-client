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

package org.apache.guacamole.environment;

import org.apache.guacamole.properties.GuacamoleProperties;
import java.io.File;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.GuacamoleUnsupportedException;
import org.apache.guacamole.net.auth.GuacamoleProxyConfiguration;
import org.apache.guacamole.properties.BooleanGuacamoleProperty;
import org.apache.guacamole.properties.GuacamoleProperty;
import org.apache.guacamole.properties.IntegerGuacamoleProperty;
import org.apache.guacamole.properties.StringGuacamoleProperty;
import org.apache.guacamole.protocols.ProtocolInfo;

/**
 * The environment of an arbitrary Guacamole instance, describing available
 * protocols, configuration parameters, and the GUACAMOLE_HOME directory.
 */
public interface Environment {

    /**
     * The hostname of the server where guacd (the Guacamole proxy server) is
     * running.
     */
    public static final StringGuacamoleProperty GUACD_HOSTNAME = new StringGuacamoleProperty() {

        @Override
        public String getName() { return "guacd-hostname"; }

    };

    /**
     * The port that guacd (the Guacamole proxy server) is listening on.
     */
    public static final IntegerGuacamoleProperty GUACD_PORT = new IntegerGuacamoleProperty() {

        @Override
        public String getName() { return "guacd-port"; }

    };

    /**
     * Whether guacd requires SSL/TLS on connections.
     */
    public static final BooleanGuacamoleProperty GUACD_SSL = new BooleanGuacamoleProperty() {

        @Override
        public String getName() { return "guacd-ssl"; }

    };
    
    /**
     * A property that configures whether or not Guacamole will take case
     * into account when comparing and processing usernames.
     */
    public static final BooleanGuacamoleProperty CASE_SENSITIVE_USERNAMES =
            new BooleanGuacamoleProperty() {
        
        @Override
        public String getName() { return "case-sensitive-usernames"; }
        
    };

    /**
     * Returns the Guacamole home directory as determined when this Environment
     * object was created. The Guacamole home directory is found by checking, in
     * order: the guacamole.home system property, the GUACAMOLE_HOME environment
     * variable, and finally the .guacamole directory in the home directory of
     * the user running the servlet container.
     *
     * @return The File representing the Guacamole home directory, which may
     *         or may not exist, and may turn out to not be a directory.
     */
    public File getGuacamoleHome();

    /**
     * Returns a map of all available protocols, where each key is the name of
     * that protocol as would be passed to guacd during connection.
     *
     * @return A map of all available protocols.
     */
    public Map<String, ProtocolInfo> getProtocols();

    /**
     * Returns the protocol having the given name. The name must be the
     * protocol name as would be passed to guacd during connection.
     *
     * @param name The name of the protocol.
     * @return The protocol having the given name, or null if no such
     *         protocol is registered.
     */
    public ProtocolInfo getProtocol(String name);

    /**
     * Given a GuacamoleProperty, parses and returns the value set for that
     * property in guacamole.properties, if any.
     *
     * @param <Type>
     *     The type that the given property is parsed into.
     * 
     * @param property
     *     The property to read from guacamole.properties.
     * 
     * @return
     *     The parsed value of the property as read from guacamole.properties.
     * 
     * @throws GuacamoleException
     *     If an error occurs while parsing the value for the given property in
     *     guacamole.properties.
     */
    public <Type> Type getProperty(GuacamoleProperty<Type> property)
            throws GuacamoleException;

    /**
     * Given a GuacamoleProperty, parses and returns the value set for that
     * property in guacamole.properties, if any. If no value is found, the
     * provided default value is returned.
     *
     * @param <Type>
     *     The type that the given property is parsed into.
     * 
     * @param property
     *     The property to read from guacamole.properties.
     * 
     * @param defaultValue
     *     The value to return if no value was given in guacamole.properties.
     * 
     * @return
     *     The parsed value of the property as read from guacamole.properties,
     *     or the provided default value if no value was found.
     * 
     * @throws GuacamoleException
     *     If an error occurs while parsing the value for the given property in
     *     guacamole.properties.
     */
    public <Type> Type getProperty(GuacamoleProperty<Type> property,
            Type defaultValue) throws GuacamoleException;

    /**
     * Given a GuacamoleProperty, parses and returns a sorted Collection of the
     * value set for that property in guacamole.properties, if any. The
     * implementation of parsing and returning a collection of multiple
     * values is up to the individual property implementations, and not all
     * implementations will support reading and returning multiple values.
     *
     * @param <Type>
     *     The type that the given property is parsed into.
     * 
     * @param property
     *     The property to read from guacamole.properties.
     * 
     * @return
     *     A sorted collection of the the parsed values of the property as read
     *     from guacamole.properties.
     * 
     * @throws GuacamoleException
     *     If an error occurs while parsing the value for the given property in
     *     guacamole.properties.
     */
    public default <Type> Collection<Type> getPropertyCollection(
            GuacamoleProperty<Type> property) throws GuacamoleException {
        
        /* Pull the given property as a string. */
        StringGuacamoleProperty stringProperty = new StringGuacamoleProperty() {
            
            @Override
            public String getName() { return property.getName(); }
            
        };
        
        /* Parse the string to a Collection of the desired type. */
        return property.parseValueCollection(getProperty(stringProperty));
        
    }
    
    /**
     * Given a GuacamoleProperty, parses and returns the value set for that
     * property in guacamole.properties, if any. If no value is found, a
     * Collection is returned with the provided default value. The
     * implementation of parsing and returning a collection of multiple
     * values is up to the individual property implementations, and not all
     * implementations will support reading and returning multiple values.
     *
     * @param <Type>
     *     The type that the given property is parsed into.
     * 
     * @param property
     *     The property to read from guacamole.properties.
     * 
     * @param defaultValue
     *     The single value to return in the Collection if no value was given
     *     in guacamole.properties.
     * 
     * @return
     *     A sorted collection of the the parsed values of the property as read
     *     from guacamole.properties, or a Collection with the single default
     *     value provided.
     * 
     * @throws GuacamoleException
     *     If an error occurs while parsing the value for the given property in
     *     guacamole.properties.
     */
    public default <Type> Collection<Type> getPropertyCollection(
            GuacamoleProperty<Type> property, Type defaultValue)
            throws GuacamoleException {
        
        /* Pull the given property as a string. */
        StringGuacamoleProperty stringProperty = new StringGuacamoleProperty() {
            
            @Override
            public String getName() { return property.getName(); }
            
        };
        
        /* Check the value and return the default if null. */
        String stringValue = getProperty(stringProperty);
        if (stringValue == null)
            return Collections.singletonList(defaultValue);
        
        /* Parse the string and return the collection. */
        return property.parseValueCollection(stringValue);
        
    }
    
    /**
     * Given a GuacamoleProperty, parses and returns the value set for that
     * property in guacamole.properties, if any. If no value is found, the
     * provided Collection of default values is returned. The
     * implementation of parsing and returning a collection of multiple
     * values is up to the individual property implementations, and not all
     * implementations will support reading and returning multiple values.
     *
     * @param <Type>
     *     The type that the given property is parsed into.
     * 
     * @param property
     *     The property to read from guacamole.properties.
     * 
     * @param defaultValue
     *     The Collection of values to return in the Collection if no value was
     *     given in guacamole.properties.
     * 
     * @return
     *     A sorted collection of the the parsed values of the property as read
     *     from guacamole.properties, or a Collection with the single default
     *     value provided.
     * 
     * @throws GuacamoleException
     *     If an error occurs while parsing the value for the given property in
     *     guacamole.properties.
     */
    public default <Type> Collection<Type> getPropertyCollection(
            GuacamoleProperty<Type> property, Collection<Type> defaultValue)
            throws GuacamoleException {
        
        /* Pull the given property as a string. */
        StringGuacamoleProperty stringProperty = new StringGuacamoleProperty() {
            
            @Override
            public String getName() { return property.getName(); }
            
        };
        
        /* Check the value and return the default if null. */
        String stringValue = getProperty(stringProperty);
        if (stringValue == null)
            return defaultValue;
        
        /* Parse the string and return the collection. */
        return property.parseValueCollection(stringValue);
        
    }
    
    /**
     * Given a GuacamoleProperty, parses and returns the value set for that
     * property in guacamole.properties. An exception is thrown if the value
     * is not provided.
     *
     * @param <Type> The type that the given property is parsed into.
     * @param property The property to read from guacamole.properties.
     * @return The parsed value of the property as read from
     *         guacamole.properties.
     * @throws GuacamoleException If an error occurs while parsing the value
     *                            for the given property in
     *                            guacamole.properties, or if the property is
     *                            not specified.
     */
    public <Type> Type getRequiredProperty(GuacamoleProperty<Type> property)
            throws GuacamoleException;
    
    /**
     * Given a GuacamoleProperty, parses and returns a sorted Collection of
     * values for that property in guacamole.properties. An exception is thrown
     * if the value is not provided. The implementation of parsing and returning
     * a collection of multiple values is up to the individual property
     * implementations, and not all implementations will support reading and
     * returning multiple values.
     * 
     * @param <Type>
     *     The type that the given property is parsed into.
     * 
     * @param property
     *     The property to read from guacamole.properties.
     * 
     * @return
     *     A sorted Collection of the property as read from guacamole.properties.
     * 
     * @throws GuacamoleException 
     *     If an error occurs while parsing the value for the given property in
     *     guacamole.properties, or if the property is not specified.
     */
    public default <Type> Collection<Type> getRequiredPropertyCollection(
            GuacamoleProperty<Type> property) throws GuacamoleException {
        
        /* Pull the given property as a string. */
        StringGuacamoleProperty stringProperty = new StringGuacamoleProperty() {
            
            @Override
            public String getName() { return property.getName(); }
            
        };
        
        /* Parse the string to a Collection of the desired type. */
        return property.parseValueCollection(getRequiredProperty(stringProperty));
        
    }

    /**
     * Returns the connection information which should be used, by default, to
     * connect to guacd when establishing a remote desktop connection.
     *
     * @return
     *     The connection information which should be used, by default, to
     *     connect to guacd.
     *
     * @throws GuacamoleException
     *     If the connection information for guacd cannot be retrieved.
     */
    public GuacamoleProxyConfiguration getDefaultGuacamoleProxyConfiguration()
            throws GuacamoleException;

    /**
     * Adds another possible source of Guacamole configuration properties to
     * this Environment. Properties not already defined by other sources of
     * Guacamole configuration properties will alternatively be read from the
     * given {@link GuacamoleProperties}.
     *
     * @param properties
     *     The GuacamoleProperties to add to this Environment.
     *
     * @throws GuacamoleException
     *     If the given GuacamoleProperties cannot be added, or if this
     *     Environment does not support this operation.
     */
    public default void addGuacamoleProperties(GuacamoleProperties properties)
            throws GuacamoleException {
        throw new GuacamoleUnsupportedException(String.format("%s does not "
                + "support dynamic definition of Guacamole properties.",
                getClass()));
    }
    
    /**
     * Returns true if Guacamole should consider case when comparing and
     * processing usernames (case-sensitive), or false if case should not be
     * considered (case-insensitive). Because the past behavior of Guacamole,
     * prior to the introduction of this option, was case-sensitive, the default
     * value is true.
     * 
     * @return
     *     true if Guacamole should consider usernames case-sensitive, otherwise
     *     false.
     * 
     * @throws GuacamoleException 
     *     If guacamole.properties cannot be parsed.
     */
    public default boolean getCaseSensitiveUsernames() throws GuacamoleException {
        return getProperty(CASE_SENSITIVE_USERNAMES, true);
    }

}
