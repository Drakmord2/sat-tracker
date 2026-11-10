#!/bin/bash

echo -e "- Updating TLEs...\n";
curl -k -o ./sat-tracker/satellite_data/satonline.txt https://www.amsat.org/tle/dailytle.txt;

cat ./sat-tracker/satellite_data/meteorsats.txt >> ./sat-tracker/satellite_data/satonline.txt;

sed -i 's/ASRTU-1 (RS64S\/BJ2CR)/ASRTU-1 (RS64S\/BJ2CR\/AO-123)/g' ./sat-tracker/satellite_data/satonline.txt;

echo -e "\n- Updating transmitter data...\n";
curl -o ./sat-tracker/satellite_data/transmitters.json "https://db.satnogs.org/api/transmitters/?format=json&status=active";

echo "\n- Done.";
