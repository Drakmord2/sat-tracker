#!/bin/sh

curl -k -o ./satellite_data/satonline.txt https://www.amsat.org/tle/dailytle.txt;

sed -i 's/ASRTU-1 (RS64S\/BJ2CR)/ASRTU-1 (RS64S\/BJ2CR\/AO-123)/g' ./satellite_data/satonline.txt;

curl -o ./satellite_data/transmitters.json "https://db.satnogs.org/api/transmitters/?format=json&status=active";
