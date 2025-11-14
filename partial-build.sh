#!/bin/bash

function tomcat_config_help() {
    cat <<HELP
vi /etc/tomcat/Catalina/localhost/guacamole.xml
<Context reloadable="true"></Context>

vi /etc/tomcat/server.xml
<Host name="localhost"  appBase="webapps"
    unpackWARs="true" autoDeploy="false"><!-- Disable auto deployment -->
HELP
}

function parse_args() {

    local help="Usage: $0 [--help|--clear|--tomcat-config-help|--make-classfiles|--make-classpath-files|<source-file-path>]"

    if [ $# -eq 0 ]; then
        echo "$help"
        exit 1
    fi

    case "$1" in
        --clear)
            clear_classpath_files
            ;;
        --tomcat-config-help)
            tomcat_config_help
            ;;
        --help)
            echo "$help"
            ;;
        --make-classfiles)
            generate_classfiles
            ;;
        --make-classpath-files)
            generate_classpath_files
            ;;
        --full)
            full_build
            ;;
        *)
            partial_build $1
            ;;
    esac
}

function partial_build() {

    local readonly source_file=$(realpath --relative-to="$PWD" "$1")

    if [ ! -f "$source_file" ]; then
        echo "Source file '$source_file' does not exist."
        exit 1
    fi

    if [ ! -d "guacamole/target/classes/org/apache/guacamole" ]; then
        generate_classfiles
    fi

    if [ ! -f "guacamole/classpath.txt" ]; then
        generate_classpath_files
    fi

    # Compile the source file and place the resulting class file in both the
    # Tomcat webapps directory and the guacamole target/classes directory.
    javac -cp "$(cat guacamole/classpath.txt):$(for i in $(find -type d -name classes | sed -E "s~^\./~~g"); do echo -n '${i}:'; done)" -d /var/lib/tomcat/webapps/guacamole/WEB-INF/classes "$source_file"
    javac -cp "$(cat guacamole/classpath.txt):guacamole/target/classes" -d "$PWD/guacamole/target/classes" "$source_file"

    touch /var/lib/tomcat/webapps/guacamole/WEB-INF/web.xml
}

function generate_classfiles() {
    mvn compile -U -DignoreLicenseErrors=true
}

function generate_classpath_files() {
    mvn dependency:build-classpath -Dmdep.outputFile=classpath.txt -DignoreLicenseErrors=true
}

function clear_classpath_files() {
    find . -name 'classpath.txt' -delete
}

function full_build() {
    version=$(grep "<revision>" pom.xml | cut -d\> -f2 | cut -d\< -f1)
    # Full first time:
    #mvn package -DskipTests -DignoreLicenseErrors=true
    mvn package -pl extensions/guacamole-auth-jdbc/modules/guacamole-auth-jdbc-mysql -am -DskipTests -DignoreLicenseErrors=true
    mvn package -pl guacamole -DskipTests -DignoreLicenseErrors=true
    /bin/cp guacamole/target/guacamole-"$version".war /var/lib/tomcat/webapps/guacamole.war
    /bin/cp extensions/guacamole-auth-jdbc/modules/guacamole-auth-jdbc-mysql/target/guacamole-auth-jdbc-mysql-"$version".jar /etc/guacamole/extensions/01-guacamole-auth-jdbc-mysql.jar
    rm -rf /var/lib/tomcat/webapps/guacamole
    systemctl restart tomcat
}

parse_args "$@"
