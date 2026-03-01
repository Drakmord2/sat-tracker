#!/bin/sh

curl -k -o satonline.txt https://www.amsat.org/tle/dailytle.txt;

sed -i 's/ASRTU-1 (RS64S\/BJ2CR)/ASRTU-1 (RS64S\/BJ2CR\/AO-123)/g' satonline.txt;

curl -o transmitters.json "https://db.satnogs.org/api/transmitters/?format=json&status=active";
