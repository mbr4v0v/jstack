#!/bin/bash

java -jar compiler.jar --js ../src/JSTACK.js --js ../src/JSTACK.Comm.js --js ../src/JSTACK.Utils.js --js ../src/JSTACK.Keystone.js --js ../src/JSTACK.Nova.js --js ../src/JSTACK.Cinder.js --js ../src/JSTACK.Glance.js --js ../src/JSTACK.Neutron.js --js_output_file ../release/jstack.js 