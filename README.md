# Satellite tracker

## Features
- Satellite pass information calculation
- Use the phone to point at the satellite
- Real-time frequency doppler shift calculation
- SSTV decode
- Add calendar reminder

[User Manual](https://github.com/Drakmord2/sat-tracker/blob/main/HowToUse.md)

## Self Host

1. Create a local SSL cert
```shell
cd cert;

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -keyout localhost.key -out localhost.crt -days 365 \
  -subj "/C=US/ST=New York/L=New York/O=SatTracker/OU=Dev/CN=localhost";
```
If using iOS, you need to send the localhost.crt to the phone, install it as a profile and allow trust as a root certificate.

2. Start the HTTPS server (default port: `8987`)
```shell
python3 server.py <optional port>;
```
3. Update TLE database

```shell
sh ./update_tle.sh
```
4. Visit https://localhost:8987 on a browser

# Previews

![image](./assets/home-page.png)
![image](./assets/tracking.png)
<img height="688" alt="image" src="./assets/sstv.png" />

## Sources
- Based on https://github.com/troilus/predict
- https://www.amsat.org (TLEs)
- https://db.satnogs.org (Active satellites)
- https://github.com/shashwatak/satellite-js
- https://github.com/mourner/suncalc
- https://github.com/Equinoxis/sstv-decoder
